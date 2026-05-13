const bcrypt = require('bcryptjs');

const BCRYPT_ROUNDS = parseInt(process.env.BCRYPT_ROUNDS) || 12;

/**
 * Hash a plain-text PIN.
 */
const hashPin = async (pin) => bcrypt.hash(pin, BCRYPT_ROUNDS);

/**
 * Compare a plain-text PIN with a stored hash.
 */
const comparePin = async (pin, hash) => bcrypt.compare(pin, hash);

/**
 * Hash a plain-text OTP (use fewer rounds for speed — OTPs are short-lived).
 */
const hashOTP = async (otp) => bcrypt.hash(otp, 8);

/**
 * Compare a plain-text OTP with a stored hash.
 */
const compareOTP = async (otp, hash) => bcrypt.compare(otp, hash);

module.exports = { hashPin, comparePin, hashOTP, compareOTP };
