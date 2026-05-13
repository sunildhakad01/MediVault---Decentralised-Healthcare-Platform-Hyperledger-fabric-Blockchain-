/**
 * india.util.js — India-specific validation and formatting utilities for the MediVault backend.
 */

/**
 * Validate an Indian mobile number.
 * Accepts bare 10-digit, +91-prefixed, or 91-prefixed forms.
 * The leading digit of the subscriber number must be 6–9.
 * @param {string} phone
 * @returns {boolean}
 */
const validateIndianPhone = (phone) => {
  if (!phone) return false;
  const cleaned = String(phone).replace(/[\s\-().]/g, '');
  const match = cleaned.match(/^(?:\+91|91)?(\d{10})$/);
  if (!match) return false;
  return /^[6-9]\d{9}$/.test(match[1]);
};

/**
 * Validate a 6-digit Indian PIN code.
 * @param {string|number} pincode
 * @returns {boolean}
 */
const validatePincode = (pincode) => {
  if (!pincode) return false;
  return /^\d{6}$/.test(String(pincode).trim());
};

/**
 * Validate a 15-character Indian GSTIN.
 * Format: 2-digit state code + 10-char PAN + 1 entity digit + 1 Z + 1 check digit.
 * @param {string} gstin
 * @returns {boolean}
 */
const validateGSTIN = (gstin) => {
  if (!gstin) return false;
  return /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(
    String(gstin).trim().toUpperCase()
  );
};

/**
 * Normalize any valid Indian phone number to the canonical +91XXXXXXXXXX form
 * suitable for database storage.
 * Returns null if the number fails validation.
 * @param {string} phone
 * @returns {string|null}
 */
const formatPhoneForDB = (phone) => {
  if (!validateIndianPhone(phone)) return null;
  const cleaned = String(phone).replace(/[\s\-().]/g, '');
  const match = cleaned.match(/^(?:\+91|91)?(\d{10})$/);
  return `+91${match[1]}`;
};

module.exports = {
  validateIndianPhone,
  validatePincode,
  validateGSTIN,
  formatPhoneForDB,
};
