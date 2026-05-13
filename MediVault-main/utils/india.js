/**
 * india.js — India-specific constants and utility functions for MediVault frontend.
 * All locale-specific data for Indian states, medical councils, validation, and formatting.
 */

// ── States & Union Territories ────────────────────────────────────────────────

const INDIAN_STATES = [
  // 28 States
  { value: 'andhra_pradesh',       label: 'Andhra Pradesh' },
  { value: 'arunachal_pradesh',    label: 'Arunachal Pradesh' },
  { value: 'assam',                label: 'Assam' },
  { value: 'bihar',                label: 'Bihar' },
  { value: 'chhattisgarh',         label: 'Chhattisgarh' },
  { value: 'goa',                  label: 'Goa' },
  { value: 'gujarat',              label: 'Gujarat' },
  { value: 'haryana',              label: 'Haryana' },
  { value: 'himachal_pradesh',     label: 'Himachal Pradesh' },
  { value: 'jharkhand',            label: 'Jharkhand' },
  { value: 'karnataka',            label: 'Karnataka' },
  { value: 'kerala',               label: 'Kerala' },
  { value: 'madhya_pradesh',       label: 'Madhya Pradesh' },
  { value: 'maharashtra',          label: 'Maharashtra' },
  { value: 'manipur',              label: 'Manipur' },
  { value: 'meghalaya',            label: 'Meghalaya' },
  { value: 'mizoram',              label: 'Mizoram' },
  { value: 'nagaland',             label: 'Nagaland' },
  { value: 'odisha',               label: 'Odisha' },
  { value: 'punjab',               label: 'Punjab' },
  { value: 'rajasthan',            label: 'Rajasthan' },
  { value: 'sikkim',               label: 'Sikkim' },
  { value: 'tamil_nadu',           label: 'Tamil Nadu' },
  { value: 'telangana',            label: 'Telangana' },
  { value: 'tripura',              label: 'Tripura' },
  { value: 'uttar_pradesh',        label: 'Uttar Pradesh' },
  { value: 'uttarakhand',          label: 'Uttarakhand' },
  { value: 'west_bengal',          label: 'West Bengal' },
  // 8 Union Territories
  { value: 'andaman_nicobar',      label: 'Andaman and Nicobar Islands' },
  { value: 'chandigarh',           label: 'Chandigarh' },
  { value: 'dadra_nagar_haveli',   label: 'Dadra and Nagar Haveli and Daman and Diu' },
  { value: 'delhi',                label: 'Delhi' },
  { value: 'jammu_kashmir',        label: 'Jammu and Kashmir' },
  { value: 'ladakh',               label: 'Ladakh' },
  { value: 'lakshadweep',          label: 'Lakshadweep' },
  { value: 'puducherry',           label: 'Puducherry' },
];

// ── Medical Councils ──────────────────────────────────────────────────────────

const MEDICAL_COUNCILS = [
  { value: 'nmc',                  label: 'NMC (National Medical Commission)' },
  { value: 'ap_mc',                label: 'Andhra Pradesh Medical Council' },
  { value: 'ar_mc',                label: 'Arunachal Pradesh Medical Council' },
  { value: 'as_mc',                label: 'Assam Medical Council' },
  { value: 'br_mc',                label: 'Bihar Medical Council' },
  { value: 'cg_mc',                label: 'Chhattisgarh Medical Council' },
  { value: 'dl_mc',                label: 'Delhi Medical Council' },
  { value: 'ga_mc',                label: 'Goa Medical Council' },
  { value: 'gj_mc',                label: 'Gujarat Medical Council' },
  { value: 'hr_mc',                label: 'Haryana Medical Council' },
  { value: 'hp_mc',                label: 'Himachal Pradesh Medical Council' },
  { value: 'jk_mc',                label: 'Jammu & Kashmir Medical Council' },
  { value: 'jh_mc',                label: 'Jharkhand Medical Council' },
  { value: 'ka_mc',                label: 'Karnataka Medical Council' },
  { value: 'kl_mc',                label: 'Kerala Medical Council' },
  { value: 'mp_mc',                label: 'Madhya Pradesh Medical Council' },
  { value: 'mh_mc',                label: 'Maharashtra Medical Council' },
  { value: 'mn_mc',                label: 'Manipur Medical Council' },
  { value: 'ml_mc',                label: 'Meghalaya Medical Council' },
  { value: 'mz_mc',                label: 'Mizoram Medical Council' },
  { value: 'nl_mc',                label: 'Nagaland Medical Council' },
  { value: 'or_mc',                label: 'Odisha Medical Council' },
  { value: 'pb_mc',                label: 'Punjab Medical Council' },
  { value: 'rj_mc',                label: 'Rajasthan Medical Council' },
  { value: 'sk_mc',                label: 'Sikkim Medical Council' },
  { value: 'tn_mc',                label: 'Tamil Nadu Medical Council' },
  { value: 'tg_mc',                label: 'Telangana Medical Council' },
  { value: 'tr_mc',                label: 'Tripura Medical Council' },
  { value: 'up_mc',                label: 'Uttar Pradesh Medical Council' },
  { value: 'uk_mc',                label: 'Uttarakhand Medical Council' },
  { value: 'wb_mc',                label: 'West Bengal Medical Council' },
];

// ── Clinical / Patient Constants ──────────────────────────────────────────────

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'Unknown'];

const GENDER_OPTIONS = ['Male', 'Female', 'Other', 'Prefer not to say'];

const EMERGENCY_CONTACTS_RELATIONSHIP = [
  'Father',
  'Mother',
  'Spouse',
  'Sibling',
  'Son',
  'Daughter',
  'Friend',
  'Guardian',
  'Other',
];

const EMERGENCY_NUMBERS = {
  ambulance:      '108',
  police:         '100',
  healthHelpline: '104',
  womenHelpline:  '1091',
};

// ── Provider / Practice Constants ─────────────────────────────────────────────

const SLOT_DURATION_OPTIONS = [15, 20, 30]; // minutes

const DOCTOR_TYPES = ['hospital', 'self_clinic', 'freelancer'];

const HOSPITAL_TYPES = ['government', 'private', 'trust', 'clinic', 'diagnostic_center'];

// ── Phone Utilities ───────────────────────────────────────────────────────────

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
  // Strip +91 or 91 prefix if present
  const match = cleaned.match(/^(?:\+91|91)?(\d{10})$/);
  if (!match) return false;
  const subscriber = match[1];
  // First digit must be 6, 7, 8, or 9 (no 0 or 1 start)
  return /^[6-9]\d{9}$/.test(subscriber);
};

/**
 * Format any Indian phone number to the canonical +91XXXXXXXXXX form.
 * Returns null if the number is invalid.
 * @param {string} phone
 * @returns {string|null}
 */
const formatIndianPhone = (phone) => {
  if (!validateIndianPhone(phone)) return null;
  const cleaned = String(phone).replace(/[\s\-().]/g, '');
  const match = cleaned.match(/^(?:\+91|91)?(\d{10})$/);
  return `+91${match[1]}`;
};

// ── Currency / Date Formatting ────────────────────────────────────────────────

/**
 * Format a number as Indian Rupees with the ₹ symbol and Indian comma grouping.
 * Example: 1250 → "₹1,250.00"
 * @param {number} amount
 * @returns {string}
 */
const formatCurrencyINR = (amount) => {
  const num = Number(amount);
  if (isNaN(num)) return '₹0.00';
  return (
    '₹' +
    num.toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  );
};

/**
 * Format a date value as DD/MM/YYYY in IST (UTC+5:30).
 * @param {Date|string|number} date
 * @returns {string}
 */
const formatDateIST = (date) => {
  if (!date) return '';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-IN', {
    timeZone: 'Asia/Kolkata',
    day:   '2-digit',
    month: '2-digit',
    year:  'numeric',
  });
};

/**
 * Format a date-time value as DD/MM/YYYY HH:MM AM/PM IST.
 * @param {Date|string|number} date
 * @returns {string}
 */
const formatDateTimeIST = (date) => {
  if (!date) return '';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '';
  const datePart = d.toLocaleDateString('en-IN', {
    timeZone: 'Asia/Kolkata',
    day:   '2-digit',
    month: '2-digit',
    year:  'numeric',
  });
  const timePart = d.toLocaleTimeString('en-IN', {
    timeZone:     'Asia/Kolkata',
    hour:         '2-digit',
    minute:       '2-digit',
    hour12:       true,
  }).toUpperCase();
  return `${datePart} ${timePart} IST`;
};

// ── Document / ID Validators ──────────────────────────────────────────────────

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
 * Validate a 12-digit Aadhaar number.
 * @param {string|number} aadhaar
 * @returns {boolean}
 */
const validateAadhaar = (aadhaar) => {
  if (!aadhaar) return false;
  return /^\d{12}$/.test(String(aadhaar).replace(/\s/g, ''));
};

// ── Exports ───────────────────────────────────────────────────────────────────

module.exports = {
  INDIAN_STATES,
  MEDICAL_COUNCILS,
  BLOOD_GROUPS,
  GENDER_OPTIONS,
  EMERGENCY_CONTACTS_RELATIONSHIP,
  EMERGENCY_NUMBERS,
  SLOT_DURATION_OPTIONS,
  DOCTOR_TYPES,
  HOSPITAL_TYPES,
  validateIndianPhone,
  formatIndianPhone,
  formatCurrencyINR,
  formatDateIST,
  formatDateTimeIST,
  validatePincode,
  validateGSTIN,
  validateAadhaar,
};
