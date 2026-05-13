// AI-Vaidya — query_handler.js | MediVault Platform
// ====================================================
// Core handler logic for POST /api/ai-vaidya/query
// Called from pages/api/ai-vaidya/query.js (Next.js API route)

const { orchestrate } = require('../core/orchestrator');
const { ROUTE_TO_PORTAL } = require('../config/portal_policies');
const { verifyJWT, store: devStore } = require('../../lib/devAuthStore');

// ─── Rate limiter (in-memory) ─────────────────────────────────────────────────

const rateLimitMap = new Map(); // userId → { count, windowStart }
const RATE_LIMIT_REQUESTS = 30;
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute

const fileRateLimitMap = new Map(); // userId → { count, windowStart }
const FILE_RATE_LIMIT = 5;
const FILE_RATE_WINDOW_MS = 60 * 60 * 1000; // 1 hour

function checkRateLimit(userId, hasFile = false) {
  const now = Date.now();

  // Query rate limit
  const entry = rateLimitMap.get(userId) || { count: 0, windowStart: now };
  if (now - entry.windowStart > RATE_LIMIT_WINDOW_MS) {
    entry.count = 0;
    entry.windowStart = now;
  }
  entry.count += 1;
  rateLimitMap.set(userId, entry);
  if (entry.count > RATE_LIMIT_REQUESTS) return false;

  // File rate limit
  if (hasFile) {
    const fileEntry = fileRateLimitMap.get(userId) || { count: 0, windowStart: now };
    if (now - fileEntry.windowStart > FILE_RATE_WINDOW_MS) {
      fileEntry.count = 0;
      fileEntry.windowStart = now;
    }
    fileEntry.count += 1;
    fileRateLimitMap.set(userId, fileEntry);
    if (fileEntry.count > FILE_RATE_LIMIT) return false;
  }

  return true;
}

// ─── Input sanitization ───────────────────────────────────────────────────────

const PROMPT_INJECTION_PATTERNS = [
  /ignore\s+(all\s+)?previous\s+instructions/i,
  /you\s+are\s+now\s+(a|an)\s+/i,
  /disregard\s+(all\s+)?(previous\s+)?instructions/i,
  /\bjailbreak\b/i,
  /\bsystem\s+prompt\b/i,
  /\bforget\s+(all\s+)?(your\s+)?(instructions|rules)\b/i,
  /\bact\s+as\s+(if\s+you\s+are|a)\b/i,
];

function sanitizeInput(text) {
  if (!text || typeof text !== 'string') return '';
  // Strip HTML tags
  let clean = text.replace(/<[^>]+>/g, ' ').replace(/&[a-z]+;/gi, ' ');
  // Collapse whitespace
  clean = clean.replace(/\s+/g, ' ').trim();
  // Max length
  return clean.slice(0, 2000);
}

function detectPromptInjection(text) {
  return PROMPT_INJECTION_PATTERNS.some(p => p.test(text));
}

// ─── JWT verification ─────────────────────────────────────────────────────────

/**
 * Verify token using the local in-memory devAuthStore (no HTTP hop needed).
 * Returns the decoded user payload or throws.
 */
async function verifyToken(token) {
  if (!token) throw Object.assign(new Error('No token'), { status: 401 });

  // First try the local devAuthStore (used in development / this Next.js-only setup)
  const user = await verifyJWT(token);
  if (user) return user;

  // Fallback: try the Next.js API route (handles production JWT scenarios)
  try {
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
    const res = await fetch(`${API_URL}/api/auth/verify`, {
      headers: { Authorization: `Bearer ${token}` },
      signal: AbortSignal.timeout(5000),
    });
    if (res.ok) {
      const data = await res.json();
      if (data?.valid && data?.user) return data.user;
    }
  } catch (_) {
    // Auth service unreachable — fall through to rejection below
  }

  throw Object.assign(new Error('Invalid or expired token'), { status: 401 });
}

/**
 * Map a user's role string to a portal ID.
 */
function roleToPortalId(userType) {
  const map = {
    patient: 'patient',
    doctor: 'doctor',
    hospital_admin: 'hospital',
    hospital: 'hospital',
    admin: 'admin',
    super_admin: 'admin',
    researcher: 'researcher',
    lab: 'lab',
  };
  return map[(userType || '').toLowerCase()] || 'patient';
}

// ─── File extraction ──────────────────────────────────────────────────────────

const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg', 'image/png', 'image/webp',
  'application/pdf',
  'image/x-dicom',
]);

function extractFile(body) {
  if (!body?.file) return null;

  const file = body.file;

  // Validate MIME type
  const mimeType = file.mimeType || file.mime_type || '';
  if (!ALLOWED_MIME_TYPES.has(mimeType)) return null;

  // Validate size (max 10MB in base64 ≈ ~13.3MB base64 string)
  const dataStr = file.data || '';
  if (dataStr.length > 14 * 1024 * 1024) return null;

  return {
    data: dataStr,
    filename: file.filename || file.name || 'upload',
    mimeType,
  };
}

// ─── Main handler ─────────────────────────────────────────────────────────────

/**
 * Handle a POST /api/ai-vaidya/query request.
 * Compatible with Next.js API route handler signature (req, res).
 */
async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // 1. Extract JWT
  const authHeader = req.headers.authorization || req.headers.Authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : authHeader;

  // 2. Verify JWT
  let user;
  try {
    user = await verifyToken(token);
  } catch (err) {
    return res.status(401).json({ error: 'Authentication required. Please log in again.' });
  }

  const userId = user._id || user.id || user.userId;

  // 3. Determine portal ID from user role
  const portalId = roleToPortalId(user.userType || user.role);

  // 4. Extract and validate request body
  const body = req.body || {};
  const rawQuery = body.query || '';
  const patientId = body.patient_id || body.patientId || null;
  const conversationHistory = Array.isArray(body.conversation_history) ? body.conversation_history : [];

  // 5. Extract file (if present)
  const uploadedFile = extractFile(body);
  const hasFile = Boolean(uploadedFile);

  // 6. Rate limiting
  if (!checkRateLimit(userId, hasFile)) {
    return res.status(429).json({ error: 'Too many requests. Please wait a moment before trying again.' });
  }

  // 7. Input sanitization
  const query = sanitizeInput(rawQuery);
  if (!query && !hasFile) {
    return res.status(400).json({ error: 'Query is required.' });
  }

  // 8. Prompt injection detection
  if (detectPromptInjection(query)) {
    return res.status(200).json({
      response: 'I can only help with health-related questions on MediVault.',
      urgency: 'normal',
      disclaimer: null,
      confidence: 1.0,
    });
  }

  // 9. Patient ID scope validation
  // Patients can only query their own data
  let resolvedPatientId = patientId;
  if (portalId === 'patient') {
    // Patient can only access their own records
    resolvedPatientId = userId;
  } else if (patientId && portalId === 'doctor') {
    // Doctor queries a specific patient — validated later by consent check
    resolvedPatientId = patientId;
  }

  // 10. Build portal context
  const portalContext = {
    portal_id: portalId,
    user_id: userId,
    patient_id: resolvedPatientId,
    user_name: user.name || user.firstName || user.fullName || 'User',
    auth_token: token,
    doctor_speciality: user.speciality || user.specialty || null,
    ward: body.ward || null,
    session_id: body.session_id || null,
  };

  // 11. Call orchestrator
  try {
    const result = await orchestrate(query, portalContext, conversationHistory, uploadedFile);
    return res.status(200).json(result);
  } catch (err) {
    console.error('[query_handler] Unexpected error:', err.message);
    return res.status(500).json({
      response: 'Something went wrong. Please try again in a moment.',
      urgency: 'normal',
      error: true,
    });
  }
}

module.exports = { handler };
