const crypto = require('crypto');

/**
 * Generate a unique MediVault user ID.
 * Format: MV-[COUNTRY]-[6 CHAR HEX]
 */
const generateUserId = (countryCode = 'IND') => {
  const hex = crypto.randomBytes(3).toString('hex').toUpperCase();
  return `MV-${countryCode}-${hex}`;
};

/**
 * Detect the type of login identifier.
 * Returns: 'email' | 'mobile' | 'userId'
 */
const detectIdentifierType = (identifier) => {
  if (identifier.startsWith('MV-'))           return 'userId';
  if (identifier.includes('@'))               return 'email';
  if (/^[+\d]/.test(identifier))             return 'mobile';
  return 'unknown';
};

module.exports = { generateUserId, detectIdentifierType };
