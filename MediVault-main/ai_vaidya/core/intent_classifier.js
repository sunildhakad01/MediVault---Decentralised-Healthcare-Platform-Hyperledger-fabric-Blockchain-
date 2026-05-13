// AI-Vaidya — intent_classifier.js | MediVault Platform
// =======================================================
// Fast query intent detection using Groq (llama3-8b-8192, <200ms).
// Also handles synchronous emergency detection (no API call).

const { PORTAL_POLICIES } = require('../config/portal_policies');
const { EMERGENCY_KEYWORDS } = require('../config/portal_policies');

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

// Maps intent string → agent name for each portal
const INTENT_TO_AGENT = {
  // Patient intents
  general_medicine_query: 'general_health',
  symptom_guidance: 'general_health',
  own_record_analysis: 'document_analysis',
  medication_guidance: 'drug_safety',
  lifestyle_advice: 'general_health',
  health_education: 'general_health',
  drug_info_general: 'drug_safety',
  emergency_triage: 'general_health',
  document_upload_analysis: 'document_analysis',

  // Doctor/Hospital intents
  clinical_case_analysis: 'clinical_decision',
  differential_diagnosis: 'clinical_decision',
  risk_stratification: 'clinical_decision',
  treatment_suggestion: 'clinical_decision',
  soap_note_generation: 'clinical_decision',
  drug_interaction_clinical: 'drug_safety',
  dosage_calculation: 'drug_safety',
  guideline_lookup: 'research',
  research_literature: 'research',
  lab_interpretation: 'clinical_decision',
  imaging_report_analysis: 'document_analysis',
  patient_summary: 'clinical_decision',
  ward_summary: 'monitoring',
  high_risk_patient_list: 'monitoring',
  discharge_readiness: 'monitoring',
  adherence_bulk_check: 'monitoring',
  drug_alerts_bulk: 'drug_safety',

  // Admin intents
  system_analytics: 'monitoring',
  platform_health: 'monitoring',
  usage_statistics: 'monitoring',
  alert_summary_aggregate: 'monitoring',
  compliance_report: 'monitoring',
};

/**
 * Synchronous emergency detection — runs before any API call.
 * Checks for emergency keywords in the query.
 */
function detectEmergency(query) {
  if (!query) return false;
  const lower = query.toLowerCase();
  return EMERGENCY_KEYWORDS.some(kw => lower.includes(kw.toLowerCase()));
}

/**
 * Classify the intent of a query using Groq (llama3-8b-8192).
 * Returns a classification object.
 */
async function classifyIntent(query, portalId) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    // Graceful fallback when Groq is not configured
    return buildFallbackClassification(query, portalId);
  }

  const prompt = `Classify the following healthcare query. Respond ONLY with valid JSON, no markdown, no explanation.

{
  "intent": "<one of: general_medicine_query|symptom_guidance|own_record_analysis|medication_guidance|lifestyle_advice|health_education|drug_info_general|clinical_case_analysis|differential_diagnosis|risk_stratification|treatment_suggestion|soap_note_generation|drug_interaction_clinical|dosage_calculation|guideline_lookup|research_literature|lab_interpretation|imaging_report_analysis|patient_summary|document_upload_analysis|ward_summary|high_risk_patient_list|discharge_readiness|adherence_bulk_check|drug_alerts_bulk|system_analytics|platform_health|usage_statistics|alert_summary_aggregate|compliance_report|emergency>",
  "urgency": "<normal|urgent|emergency>",
  "needs_patient_records": <true|false>,
  "needs_drug_lookup": <true|false>,
  "needs_pubmed": <true|false>,
  "detected_language": "<en|hi|hinglish>",
  "entities": ["<medical entities detected>"],
  "confidence": <0.0-1.0>
}

Query: "${query.slice(0, 500)}"`;

  try {
    const res = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: process.env.AIVAIDYA_FAST_MODEL || 'llama-3.1-8b-instant',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 200,
        temperature: 0,
      }),
      signal: AbortSignal.timeout(8000),
    });

    if (!res.ok) throw new Error(`Groq API error ${res.status}`);

    const data = await res.json();
    const text = data?.choices?.[0]?.message?.content?.trim() || '';

    // Extract JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('No JSON in Groq response');

    const classification = JSON.parse(jsonMatch[0]);
    return validateClassification(classification);
  } catch (err) {
    console.warn('[intent_classifier] Groq fallback:', err.message);
    return buildFallbackClassification(query, portalId);
  }
}

/**
 * Heuristic fallback when Groq is unavailable.
 */
function buildFallbackClassification(query, portalId) {
  const lower = query.toLowerCase();
  const isDoctor = ['doctor', 'hospital'].includes(portalId);

  // Simple keyword matching
  let intent = 'general_medicine_query';
  if (/symptom|fever|pain|ache|hurt|sick|ill|nausea|vomit|diarr|cough|breathe/.test(lower)) {
    intent = 'symptom_guidance';
  } else if (/soap|note|differential|diagnos|risk score|stratif/.test(lower) && isDoctor) {
    intent = 'clinical_case_analysis';
  } else if (/drug|medicine|medication|tablet|capsule|inject|interaction|side effect/.test(lower)) {
    intent = isDoctor ? 'drug_interaction_clinical' : 'drug_info_general';
  } else if (/research|study|trial|pubmed|evidence|guideline/.test(lower) && isDoctor) {
    intent = 'research_literature';
  } else if (/lab|blood test|report|result|biopsy/.test(lower)) {
    intent = isDoctor ? 'lab_interpretation' : 'own_record_analysis';
  } else if (/missed|adherence|monitoring|alert|ward/.test(lower)) {
    intent = isDoctor ? 'ward_summary' : 'medication_guidance';
  } else if (/diet|exercise|lifestyle|sleep|weight|nutrition/.test(lower)) {
    intent = 'lifestyle_advice';
  }

  const isHindi = /[^\u0000-\u007F]/.test(query) || /\b(kya|hai|mujhe|mere|paas|jana|chahiye|dard|bukhar|dawa)\b/i.test(query);

  return {
    intent,
    urgency: 'normal',
    needs_patient_records: ['own_record_analysis', 'medication_guidance', 'clinical_case_analysis'].includes(intent),
    needs_drug_lookup: ['drug_info_general', 'drug_interaction_clinical', 'medication_guidance'].includes(intent),
    needs_pubmed: ['research_literature', 'guideline_lookup'].includes(intent),
    detected_language: isHindi ? 'hinglish' : 'en',
    entities: [],
    confidence: 0.6,
  };
}

/**
 * Validate and sanitize a classification object.
 */
function validateClassification(cls) {
  const validIntents = Object.keys(INTENT_TO_AGENT);
  if (!validIntents.includes(cls.intent)) cls.intent = 'general_medicine_query';

  return {
    intent: cls.intent || 'general_medicine_query',
    urgency: ['normal', 'urgent', 'emergency'].includes(cls.urgency) ? cls.urgency : 'normal',
    needs_patient_records: Boolean(cls.needs_patient_records),
    needs_drug_lookup: Boolean(cls.needs_drug_lookup),
    needs_pubmed: Boolean(cls.needs_pubmed),
    detected_language: ['en', 'hi', 'hinglish'].includes(cls.detected_language) ? cls.detected_language : 'en',
    entities: Array.isArray(cls.entities) ? cls.entities.slice(0, 10) : [],
    confidence: typeof cls.confidence === 'number' ? Math.min(1, Math.max(0, cls.confidence)) : 0.7,
  };
}

/**
 * Map intent + portalId → agent name.
 */
function mapIntentToAgent(intent, portalId) {
  const policy = PORTAL_POLICIES[portalId];
  if (!policy) return 'general_health';

  const agentName = INTENT_TO_AGENT[intent] || 'general_health';

  // Check if the mapped agent is allowed for this portal
  if (policy.blocked_agents?.includes(agentName)) {
    // Fall back to general_health if allowed, else monitoring
    if (!policy.blocked_agents.includes('general_health')) return 'general_health';
    if (!policy.blocked_agents.includes('monitoring')) return 'monitoring';
    return null;
  }

  return agentName;
}

/**
 * Check whether an intent is allowed for a given portal.
 */
function checkIntentAllowed(intent, portalId) {
  const policy = PORTAL_POLICIES[portalId];
  if (!policy) return false;

  // Emergency is always allowed
  if (intent === 'emergency' || intent === 'emergency_triage') return true;

  return policy.allowed_intents.includes(intent);
}

module.exports = { classifyIntent, detectEmergency, mapIntentToAgent, checkIntentAllowed };
