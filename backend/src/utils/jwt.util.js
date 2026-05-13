const jwt = require('jsonwebtoken');

const JWT_SECRET      = process.env.JWT_SECRET      || 'change_this_secret_in_production';
const JWT_EXPIRES_IN  = process.env.JWT_EXPIRES_IN  || '1h';
const REFRESH_EXPIRES = process.env.REFRESH_TOKEN_EXPIRES_IN || '7d';

/**
 * Generate a short-lived access JWT.
 */
const generateToken = (payload) =>
  jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN, algorithm: 'HS256' });

/**
 * Generate a longer-lived refresh token.
 */
const generateRefreshToken = (payload) =>
  jwt.sign(payload, JWT_SECRET, { expiresIn: REFRESH_EXPIRES, algorithm: 'HS256' });

/**
 * Generate a very short-lived temp token (used mid-registration / PIN reset).
 */
const generateTempToken = (payload) =>
  jwt.sign(payload, JWT_SECRET, { expiresIn: '10m', algorithm: 'HS256' });

/**
 * Verify any JWT and return its decoded payload (throws on failure).
 */
const verifyToken = (token) => jwt.verify(token, JWT_SECRET);

module.exports = { generateToken, generateRefreshToken, generateTempToken, verifyToken };
