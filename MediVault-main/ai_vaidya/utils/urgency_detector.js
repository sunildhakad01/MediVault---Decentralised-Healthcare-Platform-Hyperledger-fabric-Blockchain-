// AI-Vaidya — urgency_detector.js | MediVault Platform
// =======================================================
// Synchronous emergency keyword scanner — runs BEFORE any API call.
// Zero network dependency: must always work even if all APIs are down.

const { EMERGENCY_KEYWORDS } = require('../config/portal_policies');

// Additional urgency signals (not full emergency, but "see a doctor soon")
const URGENT_SIGNALS = [
  'high fever', 'fever above', 'fever for', 'days of fever',
  'severe pain', 'unbearable pain', 'sharp pain',
  'blood in urine', 'blood in stool', 'coughing blood', 'vomiting blood',
  'can\'t walk', 'cannot walk', 'paralysis', 'paralyzed',
  'sudden vision', 'sudden weakness', 'sudden numbness',
  'shortness of breath', 'difficulty swallowing',
  'seizure', 'convulsion', 'fit',
  'swelling', 'allergic reaction', 'hives all over',
  'child fever', 'baby fever', 'infant fever',
  'pregnant', 'pregnancy pain', 'labor pain',
  'tez bukhar', 'bahut dard', 'khoon aa raha', // Hindi urgency signals
];

/**
 * Detect true emergency from query text.
 * Uses EMERGENCY_KEYWORDS from portal_policies.js.
 * Case-insensitive, partial-match for multi-word phrases.
 */
function detectEmergency(query) {
  if (!query) return false;
  const lower = query.toLowerCase();
  return EMERGENCY_KEYWORDS.some(kw => lower.includes(kw.toLowerCase()));
}

/**
 * Classify broader urgency level.
 * @returns {'emergency' | 'urgent' | 'normal'}
 */
function classifyUrgency(query) {
  if (!query) return 'normal';
  const lower = query.toLowerCase();

  if (detectEmergency(query)) return 'emergency';

  if (URGENT_SIGNALS.some(signal => lower.includes(signal.toLowerCase()))) return 'urgent';

  return 'normal';
}

module.exports = { detectEmergency, classifyUrgency };
