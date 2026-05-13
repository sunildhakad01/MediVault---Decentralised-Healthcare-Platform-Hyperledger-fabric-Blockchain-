const crypto = require('crypto');

/**
 * Generate a cryptographically secure N-digit OTP string.
 */
const generateOTP = (length = 6) => {
  const max = Math.pow(10, length);
  const randomBytes = crypto.randomBytes(4);
  const randomInt = randomBytes.readUInt32BE(0) % max;
  return randomInt.toString().padStart(length, '0');
};

/**
 * Generate a session ID for OTP tracking.
 */
const generateSessionId = (prefix = 'sess') =>
  `${prefix}_${crypto.randomBytes(16).toString('hex')}`;

module.exports = { generateOTP, generateSessionId };
