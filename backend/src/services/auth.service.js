const prisma = require('../config/prisma');
const { hashPin, comparePin, hashOTP, compareOTP } = require('../utils/hash.util');
const { generateOTP, generateSessionId } = require('../utils/otp.util');
const { generateToken, generateRefreshToken, generateTempToken, verifyToken } = require('../utils/jwt.util');
const { generateUserId, detectIdentifierType } = require('../utils/userId.util');
const { sendOTPEmail, sendPinChangedEmail, sendAccountLockedEmail } = require('./email.service');
const { sendSMS } = require('./notification.service');
const { getRedisClient } = require('../config/redis');
const { registerUser, enrollUser } = require('../config/fabric');
const logger = require('../utils/logger.util');

const MAX_LOGIN_ATTEMPTS    = parseInt(process.env.RATE_LIMIT_LOGIN_ATTEMPTS) || 5;
const LOCK_DURATION_MINUTES = 15;
const OTP_EXPIRY_SECONDS    = 300;

const validatePin = (pin) => {
  if (!/^\d{4}$|^\d{6}$/.test(pin)) return 'PIN must be 4 or 6 digits';
  if (/^(\d)\1+$/.test(pin)) return 'PIN cannot be all the same digit';
  const digits = pin.split('').map(Number);
  let seqAsc = true, seqDesc = true;
  for (let i = 1; i < digits.length; i++) {
    if (digits[i] !== digits[i - 1] + 1) seqAsc = false;
    if (digits[i] !== digits[i - 1] - 1) seqDesc = false;
  }
  if (seqAsc || seqDesc) return 'PIN cannot be sequential digits (e.g., 1234)';
  return null;
};

const checkOTPRateLimit = async (identifier) => {
  try {
    const redis = getRedisClient();
    const key = `ratelimit:otp:${identifier}`;
    const count = await redis.incr(key);
    if (count === 1) await redis.expire(key, 3600);
    return count > 3;
  } catch {
    return false;
  }
};

// ─── Registration ─────────────────────────────────────────────────────────────

const initiateRegistration = async ({ contactMethod, contactValue }) => {
  const isEmail  = contactMethod === 'email';
  const existing = await prisma.user.findFirst({
    where: isEmail ? { email: contactValue } : { mobile: contactValue },
  });
  if (existing) {
    const err = new Error('User already exists with this contact'); err.statusCode = 409; throw err;
  }

  const limited = await checkOTPRateLimit(contactValue);
  if (limited) {
    const err = new Error('Too many OTP requests. Please try again in 1 hour.'); err.statusCode = 429; throw err;
  }

  const otp       = generateOTP(6);
  const sessionId = generateSessionId('reg');
  const otpHash   = await hashOTP(otp);
  const expiresAt = new Date(Date.now() + OTP_EXPIRY_SECONDS * 1000);

  const line = '='.repeat(60);
  console.log(`\n${line}\n🔐 REGISTRATION OTP\n${line}\n📧 Contact : ${contactValue}\n🔑 OTP     : ${otp}\n⏱️  Expires : 5 min\n${line}\n`);

  await prisma.otpLog.create({ data: { identifier: contactValue, sessionId, otpHash, type: 'registration', expiresAt } });

  if (isEmail) {
    sendOTPEmail(contactValue, otp, 'registration').catch(e => logger.warn('Email failed:', e.message));
  } else {
    sendSMS(contactValue, `Your MediVault OTP is ${otp}. Valid for 5 minutes.`).catch(e => logger.warn('SMS failed:', e.message));
  }

  return { sessionId, expiresIn: OTP_EXPIRY_SECONDS };
};

const verifyRegistrationOTP = async ({ sessionId, otp }) => {
  const log = await prisma.otpLog.findFirst({ where: { sessionId, type: 'registration', isUsed: false } });
  if (!log) { const err = new Error('Invalid or expired OTP session'); err.statusCode = 401; throw err; }
  if (new Date() > log.expiresAt) { const err = new Error('OTP has expired'); err.statusCode = 401; throw err; }
  if (log.attempts >= 3) { const err = new Error('Too many invalid OTP attempts'); err.statusCode = 429; throw err; }

  const valid = await compareOTP(otp, log.otpHash);
  if (!valid) {
    await prisma.otpLog.update({ where: { id: log.id }, data: { attempts: { increment: 1 } } });
    const err = new Error('Invalid OTP'); err.statusCode = 401; throw err;
  }

  await prisma.otpLog.update({ where: { id: log.id }, data: { verifiedAt: new Date() } });

  const tempToken = generateTempToken({ sessionId, identifier: log.identifier, step: 'set-pin' });
  return { tempToken };
};

const setPin = async ({ tempToken, pin, pinLength, userType, additionalData }) => {
  let decoded;
  try { decoded = verifyToken(tempToken); } catch {
    const err = new Error('Token expired or invalid'); err.statusCode = 401; throw err;
  }
  if (decoded.step !== 'set-pin') {
    const err = new Error('Invalid token for this step'); err.statusCode = 401; throw err;
  }

  const pinError = validatePin(pin);
  if (pinError) { const err = new Error(pinError); err.statusCode = 400; throw err; }

  await prisma.otpLog.updateMany({ where: { sessionId: decoded.sessionId }, data: { isUsed: true } });

  const identifier = decoded.identifier;
  const isEmail    = identifier.includes('@');
  const userId     = generateUserId('IND');
  const pinHash    = await hashPin(pin);

  const user = await prisma.user.create({
    data: {
      userId,
      pinHash,
      pinSalt: '',
      pinLength: String(pinLength || pin.length),
      userType:  userType || 'patient',
      ...(isEmail ? { email: identifier, isEmailVerified: true } : { mobile: identifier, isMobileVerified: true }),
      firstName:     additionalData?.firstName   || null,
      lastName:      additionalData?.lastName    || null,
      hospital:      additionalData?.hospital    || null,
      department:    additionalData?.department  || null,
      licenseNumber: additionalData?.licenseNumber || null,
    },
  });

  // Fabric enrollment (best-effort)
  try {
    const fabricUserId = `${userId}@hospital1.medivault.local`;
    const secret = await registerUser(
      process.env.FABRIC_USER_ID || 'admin@hospital1.medivault.local',
      fabricUserId, 'client', `hospital1.${userType || 'patient'}`
    );
    await enrollUser(fabricUserId, secret, process.env.FABRIC_MSP_ID || 'Hospital1MSP');
    await prisma.user.update({
      where: { userId },
      data: { fabricUserId, fabricMSPID: process.env.FABRIC_MSP_ID || 'Hospital1MSP' },
    });
  } catch (fabricErr) {
    logger.warn(`Fabric enrollment skipped for ${userId}: ${fabricErr.message}`);
  }

  const jwt          = generateToken({ userId: user.userId, userType: user.userType, email: user.email });
  const refreshToken = generateRefreshToken({ userId: user.userId });
  return { userId: user.userId, jwt, refreshToken, expiresIn: 3600 };
};

// ─── Login ────────────────────────────────────────────────────────────────────

const login = async ({ identifier, pin, deviceInfo, ipAddress, userAgent }) => {
  const type  = detectIdentifierType(identifier);
  const where =
    type === 'email'  ? { email:  identifier } :
    type === 'mobile' ? { mobile: identifier } :
    type === 'userId' ? { userId: identifier } : null;

  if (!where) { const err = new Error('Invalid identifier format'); err.statusCode = 400; throw err; }

  const user = await prisma.user.findFirst({ where });
  if (!user || !user.isActive || user.isBlocked) {
    const err = new Error('User not found or account is disabled'); err.statusCode = 404; throw err;
  }

  if (user.lockedUntil && new Date() < user.lockedUntil) {
    const remainingMs = new Date(user.lockedUntil).getTime() - Date.now();
    const err = new Error(`Account locked. Try again in ${Math.ceil(remainingMs / 60000)} minutes.`);
    err.statusCode = 429; throw err;
  }

  const valid = await comparePin(pin, user.pinHash);

  await prisma.loginHistory.create({
    data: {
      userId: user.userId, identifier, ipAddress, userAgent,
      deviceFingerprint: deviceInfo?.fingerprint || null,
      success: valid,
      failureReason: valid ? null : 'Invalid PIN',
    },
  });

  if (!valid) {
    const newAttempts = (user.failedLoginAttempts || 0) + 1;
    const updates = { failedLoginAttempts: newAttempts };
    if (newAttempts >= MAX_LOGIN_ATTEMPTS) {
      updates.lockedUntil = new Date(Date.now() + LOCK_DURATION_MINUTES * 60 * 1000);
      if (user.email) sendAccountLockedEmail(user.email, user.firstName, LOCK_DURATION_MINUTES).catch(() => {});
      await prisma.user.update({ where: { userId: user.userId }, data: updates });
      const err = new Error(`Too many failed attempts. Account locked for ${LOCK_DURATION_MINUTES} minutes.`);
      err.statusCode = 429; throw err;
    }
    await prisma.user.update({ where: { userId: user.userId }, data: updates });
    const err = new Error(`Invalid PIN. ${MAX_LOGIN_ATTEMPTS - newAttempts} attempt(s) remaining.`);
    err.statusCode = 401; throw err;
  }

  const devices = Array.isArray(user.registeredDevices) ? [...user.registeredDevices] : [];
  if (deviceInfo?.fingerprint) {
    const idx = devices.findIndex(d => d.fingerprint === deviceInfo.fingerprint);
    if (idx >= 0) devices[idx].lastSeen = new Date();
    else devices.push({ fingerprint: deviceInfo.fingerprint, name: userAgent || 'Unknown', isVerified: true });
  }

  await prisma.user.update({
    where: { userId: user.userId },
    data: { failedLoginAttempts: 0, lockedUntil: null, lastLoginAt: new Date(), lastLoginIP: ipAddress, registeredDevices: devices },
  });

  // Admin 2FA
  if (user.userType === 'admin') {
    const sessionId = generateSessionId();
    const otp       = generateOTP(6);
    const otpHash   = await hashOTP(otp);
    await prisma.otpLog.create({
      data: { identifier: user.email || user.mobile, sessionId, otpHash, type: 'admin_2fa', expiresAt: new Date(Date.now() + OTP_EXPIRY_SECONDS * 1000) },
    });
    console.log(`🔑 Admin 2FA OTP for ${user.email || user.mobile}: ${otp}`);
    if (user.email)  sendOTPEmail(user.email, otp, 'admin_2fa').catch(() => {});
    if (user.mobile) sendSMS(user.mobile, `Your MediVault Admin OTP is ${otp}. Valid for 5 minutes.`).catch(() => {});
    const tempToken = generateTempToken({ userId: user.userId, isTempToken: true });
    return { requires2FA: true, sessionId, tempToken, message: 'OTP sent to registered phone/email' };
  }

  const jwt          = generateToken({ userId: user.userId, userType: user.userType, email: user.email, mobile: user.mobile });
  const refreshToken = generateRefreshToken({ userId: user.userId });
  return {
    jwt, refreshToken, expiresIn: 3600,
    user: { userId: user.userId, userType: user.userType, email: user.email, hospital: user.hospital, firstName: user.firstName, lastName: user.lastName },
  };
};

// ─── Forgot PIN ───────────────────────────────────────────────────────────────

const initiateForgotPin = async ({ identifier }) => {
  const type  = detectIdentifierType(identifier);
  const where =
    type === 'email'  ? { email:  identifier } :
    type === 'mobile' ? { mobile: identifier } :
    type === 'userId' ? { userId: identifier } : null;

  if (!where) { const err = new Error('Invalid identifier'); err.statusCode = 400; throw err; }

  const user = await prisma.user.findFirst({ where });
  if (!user) return { message: 'If an account exists, an OTP has been sent.' };

  const limited = await checkOTPRateLimit(identifier);
  if (limited) { const err = new Error('Too many OTP requests'); err.statusCode = 429; throw err; }

  const otp       = generateOTP(6);
  const sessionId = generateSessionId('reset');
  const otpHash   = await hashOTP(otp);
  const contact   = user.email || user.mobile;

  const line = '='.repeat(60);
  console.log(`\n${line}\n🔐 FORGOT PIN OTP\n${line}\n📧 Contact : ${contact}\n🔑 OTP     : ${otp}\n⏱️  Expires : 5 min\n${line}\n`);

  await prisma.otpLog.create({
    data: { identifier: contact, sessionId, otpHash, type: 'forgot_pin', expiresAt: new Date(Date.now() + OTP_EXPIRY_SECONDS * 1000) },
  });

  if (user.email)  sendOTPEmail(user.email, otp, 'forgot_pin').catch(e => logger.warn('Email failed:', e.message));
  else if (user.mobile) sendSMS(user.mobile, `Your MediVault OTP is ${otp}. Valid for 5 minutes.`).catch(e => logger.warn('SMS failed:', e.message));

  return { sessionId, message: 'OTP sent' };
};

const verifyForgotPinOTP = async ({ sessionId, otp }) => {
  const log = await prisma.otpLog.findFirst({ where: { sessionId, type: 'forgot_pin', isUsed: false } });
  if (!log || new Date() > log.expiresAt) {
    const err = new Error('Invalid or expired OTP'); err.statusCode = 401; throw err;
  }
  if (log.attempts >= 3) { const err = new Error('Too many OTP attempts'); err.statusCode = 429; throw err; }

  const valid = await compareOTP(otp, log.otpHash);
  if (!valid) {
    await prisma.otpLog.update({ where: { id: log.id }, data: { attempts: { increment: 1 } } });
    const err = new Error('Invalid OTP'); err.statusCode = 401; throw err;
  }

  await prisma.otpLog.update({ where: { id: log.id }, data: { verifiedAt: new Date() } });
  const resetToken = generateTempToken({ sessionId, identifier: log.identifier, step: 'reset-pin' });
  return { resetToken };
};

const resetPin = async ({ resetToken, newPin, pinLength }) => {
  let decoded;
  try { decoded = verifyToken(resetToken); } catch {
    const err = new Error('Token expired or invalid'); err.statusCode = 401; throw err;
  }
  if (decoded.step !== 'reset-pin') {
    const err = new Error('Invalid token'); err.statusCode = 401; throw err;
  }

  const pinError = validatePin(newPin);
  if (pinError) { const err = new Error(pinError); err.statusCode = 400; throw err; }

  const identifier = decoded.identifier;
  const user = await prisma.user.findFirst({
    where: identifier.includes('@') ? { email: identifier } : { mobile: identifier },
  });
  if (!user) { const err = new Error('User not found'); err.statusCode = 404; throw err; }

  const pinHash = await hashPin(newPin);
  await prisma.user.update({
    where: { userId: user.userId },
    data: { pinHash, pinLength: String(pinLength || newPin.length), failedLoginAttempts: 0, lockedUntil: null },
  });

  await prisma.otpLog.updateMany({ where: { sessionId: decoded.sessionId }, data: { isUsed: true } });

  if (user.email) sendPinChangedEmail(user.email, user.firstName).catch(() => {});

  return { message: 'PIN reset successfully' };
};

// ─── Token operations ─────────────────────────────────────────────────────────

const refreshToken = async (token) => {
  let decoded;
  try { decoded = verifyToken(token); } catch {
    const err = new Error('Invalid refresh token'); err.statusCode = 401; throw err;
  }
  const user = await prisma.user.findFirst({ where: { userId: decoded.userId } });
  if (!user || !user.isActive) { const err = new Error('User not found'); err.statusCode = 404; throw err; }
  const jwt = generateToken({ userId: user.userId, userType: user.userType, email: user.email });
  return { jwt, expiresIn: 3600 };
};

// ─── Secondary Contact Verification ──────────────────────────────────────────

const initiateSecondaryVerification = async (userId, contactValue) => {
  const user = await prisma.user.findFirst({ where: { userId } });
  if (!user) { const e = new Error('User not found'); e.statusCode = 404; throw e; }

  const isEmail = contactValue.includes('@');
  if (isEmail && user.isEmailVerified && user.email === contactValue) {
    const e = new Error('Email already verified'); e.statusCode = 409; throw e;
  }
  if (!isEmail && user.isMobileVerified && user.mobile === contactValue) {
    const e = new Error('Mobile already verified'); e.statusCode = 409; throw e;
  }

  const limited = await checkOTPRateLimit(contactValue);
  if (limited) { const e = new Error('Too many OTP requests'); e.statusCode = 429; throw e; }

  const otp       = generateOTP(6);
  const sessionId = generateSessionId('sec');
  const otpHash   = await hashOTP(otp);
  const line = '='.repeat(60);
  console.log(`\n${line}\n🔐 SECONDARY CONTACT OTP\n${line}\n📧 Contact : ${contactValue}\n🔑 OTP     : ${otp}\n${line}\n`);

  await prisma.otpLog.create({
    data: { identifier: contactValue, sessionId, otpHash, type: 'secondary_verification', expiresAt: new Date(Date.now() + OTP_EXPIRY_SECONDS * 1000) },
  });

  if (isEmail) sendOTPEmail(contactValue, otp, 'registration').catch(() => {});
  else sendSMS(contactValue, `Your MediVault OTP is ${otp}. Valid for 5 minutes.`).catch(() => {});

  return { sessionId, expiresIn: OTP_EXPIRY_SECONDS };
};

const confirmSecondaryVerification = async (userId, sessionId, otp, contactValue) => {
  const log = await prisma.otpLog.findFirst({ where: { sessionId, type: 'secondary_verification' } });
  if (!log) { const e = new Error('Session not found'); e.statusCode = 404; throw e; }
  if (log.isUsed) { const e = new Error('OTP already used'); e.statusCode = 400; throw e; }
  if (new Date() > log.expiresAt) { const e = new Error('OTP expired'); e.statusCode = 400; throw e; }
  if (log.attempts >= 3) { const e = new Error('Too many attempts'); e.statusCode = 429; throw e; }

  const valid = await compareOTP(otp, log.otpHash);
  if (!valid) {
    await prisma.otpLog.update({ where: { id: log.id }, data: { attempts: { increment: 1 } } });
    const e = new Error('Invalid OTP'); e.statusCode = 400; throw e;
  }

  await prisma.otpLog.update({ where: { id: log.id }, data: { isUsed: true, verifiedAt: new Date() } });

  const isEmail = contactValue.includes('@');
  await prisma.user.update({
    where: { userId },
    data: isEmail ? { email: contactValue, isEmailVerified: true } : { mobile: contactValue, isMobileVerified: true },
  });

  return { verified: true };
};

// ── Admin 2FA OTP Verification ────────────────────────────────────────────────

const verify2FAAdminOTP = async ({ sessionId, otp, tempToken }) => {
  if (!sessionId || !otp || !tempToken) {
    const err = new Error('sessionId, otp, and tempToken are required'); err.statusCode = 400; throw err;
  }

  let decoded;
  try { decoded = verifyToken(tempToken); } catch {
    const err = new Error('Invalid or expired session'); err.statusCode = 401; throw err;
  }
  if (!decoded.isTempToken) { const err = new Error('Invalid token type'); err.statusCode = 401; throw err; }

  const log = await prisma.otpLog.findFirst({ where: { sessionId, type: 'admin_2fa', isUsed: false } });
  if (!log) { const err = new Error('OTP session not found or already used'); err.statusCode = 400; throw err; }
  if (new Date() > log.expiresAt) { const err = new Error('OTP has expired'); err.statusCode = 400; throw err; }

  const valid = await compareOTP(otp, log.otpHash);
  if (!valid) { const err = new Error('Invalid OTP'); err.statusCode = 401; throw err; }

  await prisma.otpLog.updateMany({ where: { sessionId }, data: { isUsed: true } });

  const user = await prisma.user.findFirst({ where: { userId: decoded.userId } });
  if (!user || user.userType !== 'admin') {
    const err = new Error('Admin user not found'); err.statusCode = 404; throw err;
  }

  const jwt          = generateToken({ userId: user.userId, userType: user.userType, email: user.email, mobile: user.mobile });
  const refreshToken = generateRefreshToken({ userId: user.userId });
  return {
    jwt, refreshToken, expiresIn: 3600,
    user: { userId: user.userId, userType: user.userType, email: user.email, firstName: user.firstName, lastName: user.lastName, role: user.role },
  };
};

module.exports = {
  initiateRegistration, verifyRegistrationOTP, setPin,
  login, initiateForgotPin, verifyForgotPinOTP, resetPin,
  refreshToken, initiateSecondaryVerification, confirmSecondaryVerification, verify2FAAdminOTP,
};
