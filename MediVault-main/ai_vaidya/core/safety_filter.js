// AI-Vaidya — safety_filter.js | MediVault Platform
// ====================================================
// Output validation before delivery: PII scrubbing, medical guardrails,
// disclaimer injection, confidence-based guardrails.

// ─── Hard-block regex patterns ────────────────────────────────────────────────

const PATIENT_BLOCK_PATTERNS = [
  {
    pattern: /\b(I\s+diagnose\s+you\s+with|you\s+have\s+(been\s+diagnosed\s+with|developed))\b/gi,
    reason: 'diagnosis_statement',
    replacement: 'This could be consistent with',
  },
  {
    // "you have diabetes" / "you have hypertension" etc.
    pattern: /\byou\s+have\s+(diabetes|cancer|hypertension|heart\s+(disease|failure)|kidney\s+(disease|failure)|liver\s+(disease|failure)|stroke|tuberculosis|covid|HIV|AIDS|asthma|COPD|depression|anxiety|schizophrenia|[a-z]+\s+disease|[a-z]+\s+disorder)\b/gi,
    reason: 'diagnosis_statement',
    replacement: 'This may be consistent with',
  },
  {
    // "take 500 mg of metformin" — specific prescription to patient
    pattern: /\btake\s+\d+\s*(mg|mcg|ml|units?|IU)\s+of\s+\w+/gi,
    reason: 'prescription_to_patient',
    replacement: 'The typical dose range — confirm with your doctor',
  },
  {
    // "stop taking" — dangerous without medical supervision
    pattern: /\b(stop\s+taking|discontinue|do\s+not\s+take)\s+(your\s+)?\w+\b/gi,
    reason: 'stop_medication_advice',
    replacement: 'Discuss with your doctor before making any changes to',
  },
];

const ALL_PORTAL_BLOCK_PATTERNS = [
  {
    // Aadhaar number (12 digits, sometimes spaced)
    pattern: /\baadhaar\s*(number\s*is|:)?\s*\d[\d\s-]{10,14}\d\b/gi,
    reason: 'pii_aadhaar',
    replacement: '[REDACTED — Aadhaar number]',
  },
  {
    // ABHA ID
    pattern: /\bABHA\s*(ID\s*is|:)?\s*[\w@-]{8,30}\b/gi,
    reason: 'pii_abha_id',
    replacement: '[REDACTED — ABHA ID]',
  },
  {
    // Full phone numbers
    pattern: /\b(?:\+91[\s-]?)?[6-9]\d{9}\b/g,
    reason: 'pii_phone',
    replacement: '[REDACTED — phone number]',
  },
];

// ─── Disclaimer library ───────────────────────────────────────────────────────

const DISCLAIMERS = {
  patient_friendly: 'ℹ️ AI-Vaidya provides health information and guidance, not medical diagnosis or prescription. Always consult a qualified doctor for medical decisions.',
  clinical: '⚕️ AI-Vaidya is a clinical decision support tool. All clinical decisions remain the responsibility of the treating clinician.',
  drug: '💊 Drug information is for reference only. Verify with a pharmacist or clinical reference before prescribing or dispensing.',
  research: '📚 Research summaries are based on retrieved literature. Evidence applicability to individual patients should be clinically assessed.',
  administrative: '📊 Analytics are based on available platform data.',
  default: 'ℹ️ AI-Vaidya provides informational guidance. Please consult appropriate professionals for decisions.',
};

// ─── Main filter function ─────────────────────────────────────────────────────

/**
 * Check and sanitize a raw LLM response.
 *
 * @param {string} rawResponse - The LLM's raw text output
 * @param {object} classification - Intent classification object
 * @param {object} portalContext - Portal session context
 * @param {string} retrievalConfidence - 'high' | 'medium' | 'low'
 * @returns {{ response: string, disclaimer: string, passed: boolean, issues: string[] }}
 */
function check(rawResponse, classification, portalContext, retrievalConfidence = 'medium') {
  const issues = [];
  let response = rawResponse || '';
  const isPatient = portalContext.portal_id === 'patient';

  // Apply patient-specific block patterns
  if (isPatient) {
    for (const { pattern, reason, replacement } of PATIENT_BLOCK_PATTERNS) {
      if (pattern.test(response)) {
        issues.push(reason);
        response = response.replace(pattern, replacement);
        pattern.lastIndex = 0; // Reset regex state
      }
    }
  }

  // Apply all-portal PII patterns
  for (const { pattern, reason, replacement } of ALL_PORTAL_BLOCK_PATTERNS) {
    if (pattern.test(response)) {
      issues.push(reason);
      response = response.replace(pattern, replacement);
      pattern.lastIndex = 0;
    }
  }

  // Confidence-based guardrail prefix
  if (retrievalConfidence === 'low' && portalContext.portal_id !== 'admin') {
    response = '⚠️ Limited information available on this topic. The following is based on general knowledge — please verify with a specialist or clinical reference.\n\n' + response;
  }

  // Choose appropriate disclaimer
  const intent = classification?.intent || '';
  let disclaimerKey = 'patient_friendly';
  if (['doctor', 'hospital'].includes(portalContext.portal_id)) {
    disclaimerKey = intent.includes('drug') ? 'drug' : 'clinical';
  } else if (intent.includes('research') || intent.includes('guideline')) {
    disclaimerKey = 'research';
  } else if (portalContext.portal_id === 'admin') {
    disclaimerKey = 'administrative';
  }

  const disclaimer = DISCLAIMERS[disclaimerKey] || DISCLAIMERS.default;

  return {
    response,
    disclaimer,
    passed: issues.length === 0,
    issues,
  };
}

module.exports = { check, DISCLAIMERS };
