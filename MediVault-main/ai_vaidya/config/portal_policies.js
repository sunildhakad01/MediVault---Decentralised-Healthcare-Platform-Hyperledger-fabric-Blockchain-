// AI-Vaidya — portal_policies.js | MediVault Platform
// =====================================================
// NEVER import this file on the frontend. Backend/server only.
// Single source of truth for what each portal's AI can and cannot do.
// To add a new portal: call registerPortal() in register_portal.js — no changes needed here.

const PORTAL_POLICIES = {

  patient: {
    allowed_agents: [
      'general_health',       // medicine info, disease explanations
      'drug_safety',          // drug queries for own medications only
      'monitoring',           // own medication adherence + vitals
      'document_analysis',    // own uploaded reports/prescriptions
    ],
    blocked_agents: [
      'clinical_decision',    // no clinical risk scores for patients
      'research',             // no raw research paper access
    ],
    allowed_intents: [
      'general_medicine_query',     // "what is paracetamol used for"
      'symptom_guidance',           // "I have fever, should I see a doctor"
      'own_record_analysis',        // "explain my blood test"
      'medication_guidance',        // "when should I take this medicine"
      'lifestyle_advice',           // "diet tips for diabetes"
      'health_education',           // "what is hypertension"
      'drug_info_general',          // "what are side effects of metformin"
      'emergency_triage',           // always allowed, all portals
      'document_upload_analysis',   // uploaded PDF/image analysis
    ],
    blocked_intents: [
      'clinical_diagnosis',
      'clinical_risk_score',
      'prescribe_medicine',
      'research_literature',
      'other_patient_data',
      'hospital_analytics',
    ],
    response_persona: 'patient_friendly',
    data_scope: 'own_records_only',
    can_see_raw_clinical_codes: false,
    requires_consent_check: false,     // patient accessing own data = no consent needed
    max_response_complexity: 'simple', // plain language always
    language_auto_detect: true,        // Hindi/English auto-switch
    file_upload_allowed: true,
    file_types_allowed: ['pdf', 'jpg', 'jpeg', 'png', 'webp'],
    suggested_prompts: [
      'Explain my latest blood test report',
      'I have a headache — should I see a doctor?',
      'What is metformin used for?',
      'Summarise my current medicines',
      'I have these symptoms — what should I do?',
    ],
  },

  doctor: {
    allowed_agents: [
      'clinical_decision',    // full clinical support
      'research',             // literature and guidelines
      'drug_safety',          // detailed clinical drug info
      'monitoring',           // patient monitoring
      'document_analysis',    // clinical document analysis
      'general_health',       // can also answer general queries
    ],
    blocked_agents: [],       // doctors have full agent access
    allowed_intents: [
      'clinical_case_analysis',
      'differential_diagnosis',
      'risk_stratification',
      'treatment_suggestion',
      'soap_note_generation',
      'drug_interaction_clinical',
      'dosage_calculation',
      'guideline_lookup',
      'research_literature',
      'lab_interpretation',
      'imaging_report_analysis',
      'patient_summary',
      'emergency_triage',
      'document_upload_analysis',
    ],
    blocked_intents: [
      'other_hospital_patients',  // only assigned patients
    ],
    response_persona: 'clinical',
    data_scope: 'assigned_patients',
    can_see_raw_clinical_codes: true,
    requires_consent_check: true,
    max_response_complexity: 'clinical',
    language_auto_detect: false,        // English only for clinical
    file_upload_allowed: true,
    file_types_allowed: ['pdf', 'jpg', 'jpeg', 'png', 'webp', 'dcm'],
    suggested_prompts: [
      "Summarise this patient's clinical history",
      'What does the guideline say about this condition?',
      "Check drug interactions for this patient's medications",
      'Generate a SOAP note for this encounter',
      'Risk stratify this patient for cardiac events',
    ],
  },

  hospital: {
    allowed_agents: [
      'clinical_decision',
      'research',
      'drug_safety',
      'monitoring',           // ward-level monitoring
      'document_analysis',
    ],
    blocked_agents: [],
    allowed_intents: [
      'clinical_case_analysis',
      'differential_diagnosis',
      'risk_stratification',
      'treatment_suggestion',
      'soap_note_generation',
      'drug_interaction_clinical',
      'dosage_calculation',
      'guideline_lookup',
      'research_literature',
      'lab_interpretation',
      'imaging_report_analysis',
      'patient_summary',
      'ward_summary',             // hospital-only
      'high_risk_patient_list',   // hospital-only
      'discharge_readiness',      // hospital-only
      'adherence_bulk_check',     // hospital-only
      'drug_alerts_bulk',         // hospital-only
      'emergency_triage',
      'document_upload_analysis',
    ],
    blocked_intents: [],
    response_persona: 'clinical',
    data_scope: 'hospital_patients',
    can_see_raw_clinical_codes: true,
    requires_consent_check: true,
    max_response_complexity: 'clinical',
    language_auto_detect: false,
    file_upload_allowed: true,
    file_types_allowed: ['pdf', 'jpg', 'jpeg', 'png', 'webp', 'dcm'],
    suggested_prompts: [
      'Show high-risk patients in this ward',
      'Which patients missed morning medication?',
      'Generate ward round summary',
      'Check drug interaction alerts across admissions',
      'Which patients are ready for discharge?',
    ],
  },

  admin: {
    allowed_agents: [
      'monitoring',           // system-level monitoring only
    ],
    blocked_agents: [
      'clinical_decision',
      'research',
      'drug_safety',
      'general_health',
      'document_analysis',
    ],
    allowed_intents: [
      'system_analytics',
      'platform_health',
      'usage_statistics',
      'alert_summary_aggregate',
      'compliance_report',
    ],
    blocked_intents: [
      'any_individual_patient_query',
      'clinical_content',
    ],
    response_persona: 'administrative',
    data_scope: 'aggregated_only',
    can_see_raw_clinical_codes: false,
    requires_consent_check: false,
    max_response_complexity: 'operational',
    language_auto_detect: false,
    file_upload_allowed: false,
    file_types_allowed: [],
    suggested_prompts: [
      'How many alerts were triggered this week?',
      'Show platform usage summary',
      'Compliance report for this month',
    ],
  },

  // ── Future portals ──────────────────────────────────────────────────────────
  // Pre-defined and ready to enable via register_portal.js
  // Uncomment to activate when those portal sections are built.

  researcher: {
    allowed_agents: ['research'],
    blocked_agents: ['clinical_decision', 'drug_safety', 'general_health', 'monitoring'],
    allowed_intents: ['research_literature', 'comparative_analysis', 'evidence_summary'],
    blocked_intents: ['any_patient_specific_query'],
    response_persona: 'research',
    data_scope: 'anonymized_cohorts',
    can_see_raw_clinical_codes: false,
    requires_consent_check: false,
    max_response_complexity: 'research',
    language_auto_detect: false,
    file_upload_allowed: true,
    file_types_allowed: ['pdf'],
    suggested_prompts: [
      'Summarise recent research on this treatment',
      'Compare treatment A vs treatment B',
      'What is the evidence grade for this intervention?',
    ],
  },

  lab: {
    allowed_agents: ['drug_safety', 'monitoring'],
    blocked_agents: ['clinical_decision', 'research', 'general_health'],
    allowed_intents: ['lab_value_interpretation', 'drug_interaction_clinical', 'alert_generation'],
    blocked_intents: ['diagnosis', 'treatment_suggestion'],
    response_persona: 'clinical',
    data_scope: 'lab_orders',
    can_see_raw_clinical_codes: true,
    requires_consent_check: true,
    max_response_complexity: 'clinical',
    language_auto_detect: false,
    file_upload_allowed: true,
    file_types_allowed: ['pdf', 'csv'],
    suggested_prompts: [
      'Interpret this lab result',
      'Flag critical values in this report',
    ],
  },
};

// ── Route → Portal mapping ───────────────────────────────────────────────────
// Maps URL route prefixes to portal IDs.
// In MediVault (Next.js 13 Pages Router), routes are:
//   /patient/* → patient portal   (userType: "patient")
//   /doctor/*  → doctor portal    (userType: "doctor")
//   /hospital/*→ hospital portal  (userType: "hospital_admin" | "hospital")
//   /admin/*   → admin portal     (userType: "admin")
const ROUTE_TO_PORTAL = {
  '/patient': 'patient',
  '/doctor': 'doctor',
  '/hospital': 'hospital',
  '/admin': 'admin',
  '/researcher': 'researcher',
  '/lab': 'lab',
};

// ── JWT userType → Portal ID mapping ────────────────────────────────────────
// Maps the userType field from MediVault's JWT (seen in AuthContext.js)
// to the portal ID used by AI-Vaidya.
const USER_TYPE_TO_PORTAL = {
  patient: 'patient',
  doctor: 'doctor',
  hospital_admin: 'hospital',
  hospital: 'hospital',
  admin: 'admin',
  researcher: 'researcher',
  lab: 'lab',
};

// ── Emergency keywords ───────────────────────────────────────────────────────
// These bypass ALL portal policies. Always respond with 112 helpline first.
// detectEmergency() in urgency_detector.js checks against this list synchronously.
const EMERGENCY_KEYWORDS = [
  // English
  'chest pain', "can't breathe", 'cannot breathe', 'difficulty breathing',
  'unconscious', 'not breathing', 'heart attack', 'stroke',
  'face drooping', 'arm weakness', 'slurred speech',
  'severe bleeding', 'overdose', 'poisoning', 'suicide',
  'severe allergic', 'anaphylaxis', 'sudden vision loss', 'sudden blindness',
  'thunderclap headache', 'worst headache of my life',
  'infant not breathing', 'baby not breathing', 'child not breathing',
  // Hindi (Devanagari)
  'सीने में दर्द',       // chest pain
  'साँस नहीं आ रहा',   // can't breathe
  'बेहोश',              // unconscious
  // Hindi (Roman / Hinglish)
  'seena mein dard',      // chest pain
  'saans nahi aa raha',   // can't breathe
  'behosh',               // unconscious
  'neend ki goliyan',     // sleeping pills (overdose risk)
  'zeher kha liya',       // took poison
  'khoon bahut aa raha',  // severe bleeding
];

// ── Blocked intent response messages ────────────────────────────────────────
// User-friendly messages when a portal blocks an intent.
// Used by orchestrator.js to generate the redirect response.
const BLOCKED_INTENT_MESSAGES = {
  'clinical_diagnosis:patient':
    "That level of clinical analysis is something your doctor can help with. They have access to clinical decision support tools through MediVault. Would you like help sharing your records with your doctor through the platform?",
  'clinical_risk_score:patient':
    "Clinical risk scoring tools are available to doctors and hospital staff on MediVault. I can explain what a risk score means in simple terms if you'd like — just ask.",
  'prescribe_medicine:patient':
    "I'm not able to prescribe medicines, and I wouldn't want to — your doctor knows your complete history and is the right person to make that decision. I can help you understand what a medicine is used for, though.",
  'research_literature:patient':
    "Research-level medical literature is available to healthcare professionals on MediVault. I can explain what a condition or treatment is about in simple terms — would that help?",
  'other_patient_data:patient':
    "I can only access your own health records. For information about another person's care, please speak directly with their treating doctor.",
  'hospital_analytics:patient':
    "Hospital-level analytics are available to hospital staff and administrators. Is there something about your own care I can help you with?",
  'clinical_content:admin':
    "Clinical queries are available to doctors and hospital staff on their sections. The admin panel provides system analytics and operational insights. What operational data can I help you with?",
  'any_individual_patient_query:admin':
    "The admin section works with aggregated, anonymised data only. For patient-specific queries, please use the doctor or hospital section.",
  'other_hospital_patients:doctor':
    "I can only provide information about patients assigned to you. Please access the patient's record through your assigned patient list.",
};

module.exports = {
  PORTAL_POLICIES,
  ROUTE_TO_PORTAL,
  USER_TYPE_TO_PORTAL,
  EMERGENCY_KEYWORDS,
  BLOCKED_INTENT_MESSAGES,
};
