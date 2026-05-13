// AI-Vaidya — orchestrator.js | MediVault Platform
// ==================================================
// Master routing logic: receives every query, runs the 15-step pipeline,
// returns a structured response object.

const { PORTAL_POLICIES, EMERGENCY_KEYWORDS } = require('../config/portal_policies');
const { classifyIntent, detectEmergency, mapIntentToAgent, checkIntentAllowed } = require('./intent_classifier');
const { buildContext } = require('./context_builder');
const { hybridRetrieve } = require('../rag/retriever');
const { rerank } = require('../rag/reranker');
const { check: safetyCheck } = require('./safety_filter');
const { format: formatResponse } = require('./response_formatter');
const { checkConsentCached } = require('../blockchain/consent_cache');
const { trimConversationHistory } = require('../utils/token_counter');

// ─── Emergency response ───────────────────────────────────────────────────────

const EMERGENCY_RESPONSE = {
  response: `⚠️ This sounds like a medical emergency. Please call 112 (India emergency) immediately or go to your nearest emergency room RIGHT NOW. Do not wait.

If someone has:
• Chest pain or pressure
• Difficulty breathing or shortness of breath
• Loss of consciousness
• Stroke symptoms (face drooping, arm weakness, slurred speech, sudden confusion)
• Severe bleeding
• Suspected overdose or poisoning

**Call 112 immediately. Do not wait for further advice.**

If you are in the US/international: call your local emergency services number.`,
  urgency: 'emergency',
  disclaimer: null,
  confidence: 1.0,
  sources: [],
};

// ─── Blocked intent messages ──────────────────────────────────────────────────

const BLOCKED_INTENT_MESSAGES = {
  'clinical_decision:patient': 'That level of clinical analysis is something your doctor can help with. They have access to clinical decision support tools through MediVault. Would you like help sharing your records with your doctor through the platform?',
  'research:patient': 'Research-level medical literature is available to healthcare professionals on MediVault. I can explain what a condition or treatment is about in simple terms — would that help?',
  'clinical_diagnosis:patient': 'Making a clinical diagnosis requires a doctor\'s examination. I can help explain what symptoms might mean and guide you on when to see a doctor. What would be most helpful?',
  'other_patient_data:patient': 'I can only access your own health records. For information about another person\'s care, please speak directly with their treating doctor.',
  'clinical_content:admin': 'Clinical queries are available to doctors and hospital staff on their sections. The admin panel provides system analytics and operational insights. What operational data can I help you with?',
  'any_patient_specific_query:admin': 'The admin section works with aggregated, anonymised data only. For patient-specific queries, please use the doctor or hospital section.',
  'default': 'I\'m not able to help with that in this section. Please use the appropriate portal, or consult a healthcare professional directly.',
};

function buildBlockedIntentResponse(intent, portalId) {
  const key = `${intent}:${portalId}`;
  const message = BLOCKED_INTENT_MESSAGES[key] || BLOCKED_INTENT_MESSAGES['default'];
  return {
    response: message,
    urgency: 'normal',
    disclaimer: null,
    confidence: 1.0,
    sources: [],
    blocked: true,
  };
}

function buildConsentRequiredResponse(portalContext) {
  return {
    response: `To access ${portalContext.patient_name ? `${portalContext.patient_name}'s` : "this patient's"} health records, their consent is required on MediVault. The patient can grant access through their patient portal. Once consent is granted, full clinical support will be available.`,
    urgency: 'normal',
    disclaimer: null,
    confidence: 1.0,
    sources: [],
    blocked: true,
  };
}

// ─── Session-level response cache ─────────────────────────────────────────────
// Key: hash(query + patient_id + portal_id) → { result, cachedAt }
// Scoped to the Node process (survives requests within a session, cleared on restart).
// Max 100 entries; TTL 10 minutes. Only caches deterministic non-file queries.

const _responseCache = new Map();
const RESPONSE_CACHE_TTL = 10 * 60 * 1000; // 10 minutes
const RESPONSE_CACHE_MAX = 100;

function _responseCacheKey(query, patientId, portalId) {
  // Simple but effective hash — no crypto needed for a response cache key
  const raw = `${portalId}|${patientId || ''}|${query.trim().toLowerCase()}`;
  let hash = 0;
  for (let i = 0; i < raw.length; i++) {
    hash = (Math.imul(31, hash) + raw.charCodeAt(i)) | 0;
  }
  return `rc:${hash}`;
}

function _getCachedResponse(query, patientId, portalId) {
  const key = _responseCacheKey(query, patientId, portalId);
  const entry = _responseCache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.cachedAt > RESPONSE_CACHE_TTL) {
    _responseCache.delete(key);
    return null;
  }
  return entry.result;
}

function _setCachedResponse(query, patientId, portalId, result) {
  // Evict oldest entry when at capacity
  if (_responseCache.size >= RESPONSE_CACHE_MAX) {
    const firstKey = _responseCache.keys().next().value;
    _responseCache.delete(firstKey);
  }
  const key = _responseCacheKey(query, patientId, portalId);
  _responseCache.set(key, { result, cachedAt: Date.now() });
}

// ─── Agent registry (loaded lazily to avoid circular deps) ───────────────────

let agentRegistry = null;

function getAgentRegistry() {
  if (!agentRegistry) {
    agentRegistry = require('../config/agent_registry');
  }
  return agentRegistry;
}

// ─── Main orchestrator ────────────────────────────────────────────────────────

/**
 * The 15-step AI-Vaidya pipeline.
 *
 * @param {string} query - User's query text
 * @param {object} portalContext - { portal_id, user_id, patient_id, auth_token, user_name, ... }
 * @param {Array} conversationHistory - [{ role, content }, ...] — last 10 turns
 * @param {object|null} uploadedFile - { data, filename, mimeType } or null
 * @returns {Promise<object>} - { response, urgency, disclaimer, confidence, sources, session_id }
 */
async function orchestrate(query, portalContext, conversationHistory = [], uploadedFile = null) {
  const sessionId = portalContext.session_id || `sess_${Date.now()}`;
  portalContext.session_id = sessionId;
  // Trim history to stay within the 6000-token context budget
  portalContext.conversationHistory = trimConversationHistory(
    (conversationHistory || []).slice(-10),
    6000
  );

  try {
    // ─── STEP 1: EMERGENCY CHECK (synchronous, no API calls) ─────────────────
    if (detectEmergency(query)) {
      await logAudit({ query, response: EMERGENCY_RESPONSE.response, intent: 'emergency', portalContext, blocked: false });
      return { ...EMERGENCY_RESPONSE, session_id: sessionId };
    }

    // ─── STEP 2: VALIDATE PORTAL CONTEXT ────────────────────────────────────
    const policy = PORTAL_POLICIES[portalContext.portal_id];
    if (!policy) {
      return { response: 'Unknown portal. Please access AI-Vaidya from a valid portal section.', urgency: 'normal', session_id: sessionId };
    }

    // ─── STEP 3: LOAD POLICY (already done above) ───────────────────────────

    // ─── STEP 3.5: RESPONSE CACHE CHECK ─────────────────────────────────────
    // Skip cache if file attached (file content changes the response)
    if (!uploadedFile && query) {
      const cached = _getCachedResponse(query, portalContext.patient_id, portalContext.portal_id);
      if (cached) {
        return { ...cached, session_id: sessionId, cached: true };
      }
    }

    // ─── STEP 4: CLASSIFY INTENT ─────────────────────────────────────────────
    const classification = await classifyIntent(query, portalContext.portal_id);

    // Override urgency if emergency detected
    if (classification.urgency === 'emergency' || detectEmergency(query)) {
      await logAudit({ query, response: EMERGENCY_RESPONSE.response, intent: 'emergency', portalContext, blocked: false });
      return { ...EMERGENCY_RESPONSE, session_id: sessionId };
    }

    // ─── STEP 5: CHECK INTENT ALLOWED ────────────────────────────────────────
    if (!checkIntentAllowed(classification.intent, portalContext.portal_id)) {
      const blocked = buildBlockedIntentResponse(classification.intent, portalContext.portal_id);
      await logAudit({ query, response: blocked.response, intent: classification.intent, portalContext, blocked: true });
      return { ...blocked, session_id: sessionId };
    }

    // ─── STEP 6: DATA SCOPE VALIDATION ───────────────────────────────────────
    if (classification.needs_patient_records && policy.data_scope === 'aggregated_only') {
      const blocked = buildBlockedIntentResponse('any_patient_specific_query', portalContext.portal_id);
      return { ...blocked, session_id: sessionId };
    }

    // ─── STEP 7: CONSENT CHECK ───────────────────────────────────────────────
    if (policy.requires_consent_check && portalContext.patient_id && portalContext.user_id && portalContext.patient_id !== portalContext.user_id) {
      const consentResult = await checkConsentCached(portalContext.patient_id, portalContext.user_id, portalContext.auth_token);
      const hasConsent = consentResult?.allowed === true;
      if (!hasConsent) {
        const blocked = buildConsentRequiredResponse(portalContext);
        return { ...blocked, session_id: sessionId };
      }
    }

    // ─── STEP 8: HANDLE FILE UPLOAD ──────────────────────────────────────────
    let documentChunks = [];
    if (uploadedFile && policy.file_upload_allowed) {
      // Document analysis happens inside the agent for file queries
      // We mark the intent to ensure document_analysis_agent is used
      classification.has_file = true;
    }

    // ─── STEP 9: BUILD PATIENT CONTEXT ───────────────────────────────────────
    let patientContext = null;
    if (classification.needs_patient_records && portalContext.portal_id !== 'admin') {
      try {
        patientContext = await buildContext(portalContext, classification.entities);
      } catch (err) {
        if (err.message === 'AUTH_EXPIRED') {
          return { response: 'Your session has expired. Please log in again.', urgency: 'normal', session_id: sessionId };
        }
        // Non-fatal — continue without patient context
      }
    }

    // ─── STEP 10: RAG RETRIEVAL ───────────────────────────────────────────────
    let rankedChunks = [];
    let retrievalConfidence = 'low';

    if (process.env.AIVAIDYA_ENABLE_RAG === 'true') {
      try {
        const filter = {
          patient_id: policy.data_scope === 'own_records_only' ? (portalContext.patient_id || portalContext.user_id) : undefined,
        };

        const rawChunks = await hybridRetrieve(query, 20, { dense: 0.6, sparse: 0.4 }, filter);
        if (rawChunks.length > 0) {
          const reranked = await rerank(query, rawChunks, 5, false);
          rankedChunks = reranked.chunks;
          retrievalConfidence = reranked.retrieval_confidence;
        }
      } catch (_) {
        // RAG failure is non-fatal — LLM answers from parametric knowledge
      }
    }

    // ─── STEP 11: DISPATCH TO AGENT ──────────────────────────────────────────
    const registry = getAgentRegistry();
    let agentName = mapIntentToAgent(classification.intent, portalContext.portal_id);

    // Override to document_analysis_agent if file is present
    if (classification.has_file || uploadedFile) agentName = 'document_analysis';

    const agentFn = registry[agentName] || registry['general_health'];
    if (!agentFn) {
      throw new Error(`No agent found for: ${agentName}`);
    }

    let rawResponse;
    if (agentName === 'document_analysis') {
      rawResponse = await agentFn.run(query, rankedChunks, patientContext, classification, portalContext, uploadedFile);
    } else {
      rawResponse = await agentFn.run(query, rankedChunks, patientContext, classification, portalContext);
    }

    // ─── STEP 12: SAFETY FILTER ───────────────────────────────────────────────
    const filtered = safetyCheck(rawResponse, classification, portalContext, retrievalConfidence);

    // ─── STEP 13: PERSONA FORMATTING ─────────────────────────────────────────
    const persona = policy.response_persona || 'patient_friendly';
    const formatted = await formatResponse(filtered.response, persona, {
      detected_language: classification.detected_language,
    });

    // ─── STEP 14: AUDIT LOG ───────────────────────────────────────────────────
    await logAudit({
      query,
      response: formatted.text,
      intent: classification.intent,
      portalContext,
      blocked: false,
      safetyPassed: filtered.passed,
      confidence: classification.confidence,
      sources: rankedChunks.map(c => c.metadata?.source).filter(Boolean),
    });

    // ─── STEP 15: RETURN ─────────────────────────────────────────────────────
    const finalResult = {
      response: formatted.text,
      confidence: classification.confidence,
      sources: rankedChunks.map(c => c.metadata?.source_name || c.metadata?.source).filter(Boolean),
      disclaimer: filtered.disclaimer,
      urgency: classification.urgency,
      session_id: sessionId,
      blocked: false,
    };

    // Store in response cache (skip file-based and emergency responses)
    if (!uploadedFile && classification.urgency !== 'emergency') {
      _setCachedResponse(query, portalContext.patient_id, portalContext.portal_id, finalResult);
    }

    return finalResult;

  } catch (err) {
    console.error('[orchestrator] Pipeline error:', err.message);

    // User-friendly error messages based on portal
    const portal = portalContext.portal_id;
    const errorMsg = ['doctor', 'hospital'].includes(portal)
      ? 'AI-Vaidya is temporarily unavailable. Please use standard clinical references for immediate needs.'
      : 'I\'m having a little trouble right now. Please try again in a moment, or contact your doctor directly for urgent queries.';

    return {
      response: errorMsg,
      urgency: 'normal',
      disclaimer: null,
      confidence: 0,
      sources: [],
      session_id: sessionId,
      error: true,
    };
  }
}

// ─── Audit logging ────────────────────────────────────────────────────────────

async function logAudit({ query, response, intent, portalContext, blocked, safetyPassed, confidence, sources }) {
  if (process.env.AIVAIDYA_AUDIT_LOGGING !== 'true') return;

  try {
    const crypto = require('crypto');
    const entry = {
      query_id: crypto.randomUUID(),
      session_id: portalContext.session_id,
      portal_id: portalContext.portal_id,
      user_id: portalContext.user_id,
      user_role: portalContext.portal_id,
      patient_id: portalContext.patient_id || null,
      query_text: query,
      intent: intent || 'unknown',
      agent_used: intent || 'unknown',
      model_version: process.env.AIVAIDYA_PRIMARY_MODEL || 'gemini-2.0-flash',
      retrieved_sources: sources || [],
      response_hash: crypto.createHash('sha256').update(response || '').digest('hex'),
      confidence: confidence || 0,
      urgency: 'normal',
      safety_passed: safetyPassed !== false,
      blocked: Boolean(blocked),
      timestamp: new Date().toISOString(),
    };

    // Write to audit_logger if available
    try {
      const auditLogger = require('../blockchain/audit_logger');
      await auditLogger.log(entry);
    } catch (_) {
      // Audit logger not yet implemented — silent fail
    }
  } catch (_) { /* non-fatal */ }
}

module.exports = { orchestrate };
