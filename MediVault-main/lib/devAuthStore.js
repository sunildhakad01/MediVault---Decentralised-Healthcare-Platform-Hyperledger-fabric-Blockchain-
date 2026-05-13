// lib/devAuthStore.js — auth store with persistent user accounts
// Users saved to data/auth.json — survives restarts.
// OTP sessions stay in RAM (they expire in 10-15 min anyway).

const crypto = require('crypto');
const fs     = require('fs');
const path   = require('path');

const AUTH_FILE = path.join(process.cwd(), 'data', 'auth.json');

// ── File helpers ──────────────────────────────────────────────────────────────

function _loadUsers() {
  try {
    if (fs.existsSync(AUTH_FILE)) {
      const raw  = fs.readFileSync(AUTH_FILE, 'utf8');
      const json = JSON.parse(raw);
      return {
        users:          new Map(Object.entries(json.users          || {})),
        usersByContact: new Map(Object.entries(json.usersByContact || {})),
        seq:            json.seq || 0,
      };
    }
  } catch (e) {
    console.error('[MediVault] Failed to load auth.json:', e.message);
  }
  return { users: new Map(), usersByContact: new Map(), seq: 0 };
}

function _saveUsers() {
  try {
    const dir = path.dirname(AUTH_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(AUTH_FILE, JSON.stringify({
      users:          Object.fromEntries(mem.users),
      usersByContact: Object.fromEntries(mem.usersByContact),
      seq:            mem.seq,
    }, null, 2), 'utf8');
  } catch (e) {
    console.error('[MediVault] Failed to save auth.json:', e.message);
  }
}

// ── In-memory state ───────────────────────────────────────────────────────────

if (!globalThis.__mvEphemeral) {
  const persisted = _loadUsers();
  globalThis.__mvEphemeral = {
    // ── Ephemeral (RAM only — intentionally reset on restart) ──────────────
    sessions:      new Map(), // OTP registration sessions  (10 min TTL)
    tempTokens:    new Map(), // post-OTP temp tokens       (15 min TTL)
    resetSessions: new Map(), // forgot-pin sessions        (10 min TTL)
    resetTokens:   new Map(), // forgot-pin reset tokens    (15 min TTL)
    // ── Persistent (loaded from data/auth.json) ────────────────────────────
    users:          persisted.users,
    usersByContact: persisted.usersByContact,
    seq:            persisted.seq,
  };
  console.log(`[MediVault] Auth store loaded — ${persisted.users.size} user(s)`);
}
const mem = globalThis.__mvEphemeral;

// Seed default admin once (persisted so it survives restarts too)
if (!mem.users.has('MV_ADMIN')) {
  const salt    = 'mvdevsalt';
  const pinHash = crypto.createHash('sha256').update(salt + '123456').digest('hex');
  const admin   = {
    userId: 'MV_ADMIN', userType: 'admin',
    contactMethod: 'email', contactValue: 'admin@medivault.dev',
    name: 'System Administrator',
    pinHash, pinSalt: salt, pinLength: 6,
    passwordHash: null, passwordSalt: null,
    createdAt: new Date().toISOString(),
  };
  mem.users.set('MV_ADMIN', admin);
  mem.usersByContact.set('admin@medivault.dev', 'MV_ADMIN');
  _saveUsers();
  process.stderr.write(
    '\n  [MediVault] Admin account ready\n' +
    '  Email : admin@medivault.dev\n' +
    '  PIN   : 123456\n\n'
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function randomHex(bytes = 16) {
  return crypto.randomBytes(bytes).toString('hex');
}

function generateOTP() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

function hashPin(pin, salt) {
  return crypto.createHash('sha256').update(salt + pin).digest('hex');
}

function nextUserId() {
  mem.seq = (mem.seq || 0) + 1;
  _saveUsers();
  return `MV${String(mem.seq).padStart(4, '0')}`;
}

function logOTPToTerminal(type, contactMethod, contactValue, otp) {
  const line  = '═'.repeat(60);
  const label = type === 'register'   ? 'REGISTRATION OTP'
    : type === 'forgot-pin'           ? 'FORGOT-PIN OTP'
    : type === 'admin-2fa'            ? 'ADMIN 2FA OTP'
    : 'OTP';
  const msg = [
    '', line,
    `  [MediVault] ${label}`, line,
    `  Contact Method : ${contactMethod}`,
    `  Sent To        : ${contactValue}`,
    `  OTP Code       : \x1b[33m\x1b[1m${otp}\x1b[0m`,
    `  Expires In     : 10 minutes`,
    line, '',
  ].join('\n');
  console.log(msg);
  process.stderr.write(msg + '\n');
}

// ── Registration session (RAM only — expires in 10 min) ───────────────────────

function createRegistrationSession(contactMethod, contactValue) {
  const sessionId = randomHex(16);
  const otp       = generateOTP();
  mem.sessions.set(sessionId, {
    contactMethod,
    contactValue: contactValue.toLowerCase().trim(),
    otp,
    createdAt: Date.now(),
    expiresAt: Date.now() + 10 * 60 * 1000,
    verified:  false,
  });
  logOTPToTerminal('register', contactMethod, contactValue, otp);
  return { sessionId, otp };
}

function verifyRegistrationOTP(sessionId, otp) {
  const session = mem.sessions.get(sessionId);
  if (!session) throw new Error('Invalid or expired session');
  if (Date.now() > session.expiresAt) {
    mem.sessions.delete(sessionId);
    throw new Error('OTP has expired. Please request a new one.');
  }
  if (session.otp !== String(otp).trim()) throw new Error('Incorrect OTP');

  session.verified = true;
  const tempToken  = randomHex(24);
  mem.tempTokens.set(tempToken, {
    sessionId,
    contactMethod: session.contactMethod,
    contactValue:  session.contactValue,
    createdAt:     Date.now(),
    expiresAt:     Date.now() + 15 * 60 * 1000,
  });
  mem.sessions.delete(sessionId);
  return { tempToken };
}

// ── User creation (persisted) ─────────────────────────────────────────────────

function createUser(tempToken, pin, pinLength, userType) {
  const tokenData = mem.tempTokens.get(tempToken);
  if (!tokenData) throw new Error('Invalid or expired temp token');
  if (Date.now() > tokenData.expiresAt) {
    mem.tempTokens.delete(tempToken);
    throw new Error('Session expired. Please restart registration.');
  }
  if (mem.usersByContact.has(tokenData.contactValue)) {
    throw new Error('An account with this contact already exists');
  }

  const userId = nextUserId();
  const salt   = randomHex(8);
  const user   = {
    userId,
    userType:      userType || 'patient',
    contactMethod: tokenData.contactMethod,
    contactValue:  tokenData.contactValue,
    pinHash:       hashPin(String(pin), salt),
    pinSalt:       salt,
    pinLength:     Number(pinLength) || 6,
    passwordHash:  null,
    passwordSalt:  null,
    name:          null,
    hospitalId:    null,
    createdAt:     new Date().toISOString(),
  };

  mem.users.set(userId, user);
  mem.usersByContact.set(tokenData.contactValue, userId);
  mem.tempTokens.delete(tempToken);
  _saveUsers();

  const { jwt, refreshToken } = issueTokens(userId, userType);
  console.log(`\n  [MediVault] New account: ${userId} (${userType}) — ${tokenData.contactValue}\n`);
  return { userId, jwt, refreshToken, user: { userId, userType, contactValue: user.contactValue } };
}

// ── Login ─────────────────────────────────────────────────────────────────────

function findUserByIdentifier(identifier) {
  const id  = identifier.trim();
  const byId = mem.users.get(id.toUpperCase());
  if (byId) return _formatUser(byId);
  const uid = mem.usersByContact.get(id.toLowerCase());
  return uid ? _formatUser(mem.users.get(uid)) : null;
}

function loginWithPin(identifier, pin) {
  const user = findUserByIdentifier(identifier);
  if (!user) throw new Error('No account found with this identifier');
  if (hashPin(String(pin), user.pinSalt) !== user.pinHash) throw new Error('Incorrect PIN');
  return user;
}

function loginWithPassword(identifier, password) {
  const user = findUserByIdentifier(identifier);
  if (!user) throw new Error('No account found with this identifier');
  if (user.passwordHash) {
    if (hashPin(String(password), user.passwordSalt) !== user.passwordHash) throw new Error('Incorrect password');
    return user;
  }
  if (hashPin(String(password), user.pinSalt) !== user.pinHash) throw new Error('Incorrect password');
  return user;
}

function createHospitalAdminUser(adminEmail, adminPin, adminName, hospitalId, pinLength = 6) {
  const email = adminEmail.toLowerCase().trim();
  if (mem.usersByContact.has(email)) throw new Error('An account with this email already exists');

  const userId = nextUserId();
  const salt   = randomHex(8);
  const user   = {
    userId,
    userType:      'hospital_admin',
    contactMethod: 'email',
    contactValue:  email,
    name:          adminName,
    hospitalId,
    pinHash:       hashPin(String(adminPin), salt),
    pinSalt:       salt,
    pinLength:     Number(pinLength) || 6,
    passwordHash:  null,
    passwordSalt:  null,
    createdAt:     new Date().toISOString(),
  };

  mem.users.set(userId, user);
  mem.usersByContact.set(email, userId);
  _saveUsers();

  const { jwt, refreshToken } = issueTokens(userId, 'hospital_admin');
  console.log(`\n  [MediVault] Hospital admin created: ${userId} — ${email}\n`);
  return { userId, jwt, refreshToken, user: { userId, userType: 'hospital_admin', contactValue: email } };
}

function _formatUser(u) {
  if (!u) return null;
  return {
    userId:        u.userId,
    userType:      u.userType,
    contactMethod: u.contactMethod,
    contactValue:  u.contactValue,
    pinHash:       u.pinHash,
    pinSalt:       u.pinSalt,
    pinLength:     u.pinLength,
    passwordHash:  u.passwordHash,
    passwordSalt:  u.passwordSalt,
    name:          u.name,
    hospital:      u.hospitalId,
    createdAt:     u.createdAt,
  };
}

// ── Token management (self-verifying HMAC — no DB needed) ─────────────────────

const DEV_JWT_SECRET = process.env.DEV_JWT_SECRET || 'mv-dev-hmac-secret-not-for-prod';
const JWT_TTL_MS     = 24 * 60 * 60 * 1000;
const REFRESH_TTL    = 30 * 24 * 60 * 60 * 1000;

function signDevToken(payload) {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'MVDEV' })).toString('base64url');
  const body   = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const sig    = crypto.createHmac('sha256', DEV_JWT_SECRET).update(`${header}.${body}`).digest('base64url');
  return `${header}.${body}.${sig}`;
}

function parseDevToken(token) {
  if (!token || typeof token !== 'string') return null;
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  const [header, body, sig] = parts;
  const expected = crypto.createHmac('sha256', DEV_JWT_SECRET).update(`${header}.${body}`).digest('base64url');
  const sigBuf = Buffer.from(sig);
  const expBuf = Buffer.from(expected);
  if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) return null;
  try {
    return JSON.parse(Buffer.from(body, 'base64url').toString('utf8'));
  } catch {
    return null;
  }
}

function issueTokens(userId, userType) {
  const expiresAt        = Date.now() + JWT_TTL_MS;
  const refreshExpiresAt = Date.now() + REFRESH_TTL;
  const jwt          = signDevToken({ userId, userType, expiresAt, iat: Date.now() });
  const refreshToken = signDevToken({ userId, userType, expiresAt: refreshExpiresAt, iat: Date.now(), type: 'refresh' });
  return { jwt, refreshToken, expiresAt };
}

function verifyJWT(token) {
  if (!token) return null;
  const payload = parseDevToken(token);
  if (!payload || payload.type === 'refresh' || Date.now() > payload.expiresAt) return null;
  const user = mem.users.get(payload.userId);
  return {
    userId:       payload.userId,
    userType:     payload.userType,
    contactValue: user ? user.contactValue : '',
  };
}

function refreshAccessToken(refreshToken) {
  const payload = parseDevToken(refreshToken);
  if (!payload || payload.type !== 'refresh') throw new Error('Invalid refresh token');
  if (Date.now() > payload.expiresAt) throw new Error('Refresh token expired. Please log in again.');
  return { jwt: issueTokens(payload.userId, payload.userType).jwt };
}

function revokeToken() { /* stateless tokens — client discards on logout */ }

// ── Forgot-PIN flow ───────────────────────────────────────────────────────────

function initiateForgotPin(identifier) {
  const user = findUserByIdentifier(identifier);
  if (!user) throw new Error('No account found with this identifier');

  const sessionId = randomHex(16);
  const otp       = generateOTP();
  mem.resetSessions.set(sessionId, {
    userId:       user.userId,
    contactValue: user.contactValue,
    otp,
    createdAt:    Date.now(),
    expiresAt:    Date.now() + 10 * 60 * 1000,
  });
  logOTPToTerminal('forgot-pin', user.contactMethod, user.contactValue, otp);
  return { sessionId };
}

function verifyForgotPinOTP(sessionId, otp) {
  const session = mem.resetSessions.get(sessionId);
  if (!session) throw new Error('Invalid or expired session');
  if (Date.now() > session.expiresAt) {
    mem.resetSessions.delete(sessionId);
    throw new Error('OTP expired. Please request a new one.');
  }
  if (session.otp !== String(otp).trim()) throw new Error('Incorrect OTP');

  const resetToken = randomHex(24);
  mem.resetTokens.set(resetToken, { userId: session.userId, expiresAt: Date.now() + 15 * 60 * 1000 });
  mem.resetSessions.delete(sessionId);
  return { resetToken };
}

function resetPin(resetToken, newPin, pinLength) {
  const tokenData = mem.resetTokens.get(resetToken);
  if (!tokenData) throw new Error('Invalid or expired reset token');
  if (Date.now() > tokenData.expiresAt) {
    mem.resetTokens.delete(resetToken);
    throw new Error('Reset session expired. Please start over.');
  }
  const user = mem.users.get(tokenData.userId);
  if (!user) throw new Error('User not found');

  const salt       = randomHex(8);
  user.pinHash     = hashPin(String(newPin), salt);
  user.pinSalt     = salt;
  user.pinLength   = Number(pinLength) || 6;
  mem.resetTokens.delete(resetToken);
  _saveUsers();
  return { ok: true };
}

// ── Exports ───────────────────────────────────────────────────────────────────

module.exports = {
  store: mem,
  createRegistrationSession,
  verifyRegistrationOTP,
  createUser,
  findUserByIdentifier,
  loginWithPin,
  loginWithPassword,
  createHospitalAdminUser,
  issueTokens,
  verifyJWT,
  refreshAccessToken,
  revokeToken,
  initiateForgotPin,
  verifyForgotPinOTP,
  resetPin,
};
