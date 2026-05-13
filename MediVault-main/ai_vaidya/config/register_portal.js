// AI-Vaidya — register_portal.js | MediVault Platform
// ======================================================
// Future portal registration system.
// To add a new portal section to AI-Vaidya, call registerPortal() in this file.
//
// HOW TO ADD A NEW PORTAL IN THE FUTURE:
// ─────────────────────────────────────────────────────────────────────────────
// 1. Call registerPortal({ id: "new_portal", ... }) in the REGISTRATIONS section below.
// 2. Add the JWT role value mapping so auth middleware recognizes it (in query_handler.js).
// 3. That's it — the orchestrator, policies, UI, and response caching all work automatically.
// ─────────────────────────────────────────────────────────────────────────────

const { PORTAL_POLICIES, ROUTE_TO_PORTAL } = require('./portal_policies');

// ─── Portal config schema (documented) ────────────────────────────────────────

/**
 * @typedef {Object} PortalConfig
 * @property {string}   id                    - Unique portal ID (used everywhere as the key)
 * @property {string}   route_prefix          - URL prefix to auto-detect (e.g. '/researcher')
 * @property {string[]} allowed_agents        - Agent names this portal can call
 * @property {string[]} blocked_agents        - Agent names explicitly blocked
 * @property {string[]} allowed_intents       - Intent strings this portal may use
 * @property {string[]} blocked_intents       - Intent strings blocked
 * @property {string}   response_persona      - 'patient_friendly'|'clinical'|'administrative'|'research'
 * @property {string}   data_scope            - 'own_records_only'|'assigned_patients'|'hospital_patients'|'aggregated_only'|'anonymized_cohorts'|'lab_orders'
 * @property {boolean}  file_upload_allowed   - Whether users may upload files
 * @property {string[]} file_types_allowed    - Allowed MIME type extensions
 * @property {string[]} suggested_prompts     - Chip prompts shown on first open
 * @property {boolean}  requires_consent_check - Whether the consent gate is active
 * @property {boolean}  can_see_raw_clinical_codes - Whether ICD/SNOMED codes appear
 * @property {string}   max_response_complexity - 'simple'|'clinical'|'operational'|'research'
 * @property {boolean}  language_auto_detect  - Auto-detect Hindi/Hinglish
 * @property {string}   jwt_role_value        - The value in the JWT userType field for this portal
 */

// ─── Validation ───────────────────────────────────────────────────────────────

const VALID_AGENTS = [
  'general_health', 'clinical_decision', 'drug_safety',
  'research', 'monitoring', 'document_analysis',
];

const VALID_PERSONAS = ['patient_friendly', 'clinical', 'administrative', 'research'];

const VALID_SCOPES = [
  'own_records_only', 'assigned_patients', 'hospital_patients',
  'aggregated_only', 'anonymized_cohorts', 'lab_orders',
];

function validatePortalConfig(config) {
  const errors = [];
  if (!config.id || typeof config.id !== 'string') errors.push('id is required');
  if (!config.route_prefix) errors.push('route_prefix is required');
  if (!VALID_PERSONAS.includes(config.response_persona)) errors.push(`response_persona must be one of: ${VALID_PERSONAS.join(', ')}`);
  if (!VALID_SCOPES.includes(config.data_scope)) errors.push(`data_scope must be one of: ${VALID_SCOPES.join(', ')}`);
  if (config.allowed_agents) {
    const invalid = config.allowed_agents.filter(a => !VALID_AGENTS.includes(a));
    if (invalid.length) errors.push(`Unknown agents: ${invalid.join(', ')}`);
  }
  if (errors.length) throw new Error(`[register_portal] Invalid config for "${config.id}": ${errors.join('; ')}`);
}

// ─── Registration function ────────────────────────────────────────────────────

/**
 * Register a new portal with AI-Vaidya.
 * Mutates PORTAL_POLICIES and ROUTE_TO_PORTAL so the orchestrator picks it up immediately.
 *
 * @param {PortalConfig} config
 */
function registerPortal(config) {
  validatePortalConfig(config);

  if (PORTAL_POLICIES[config.id]) {
    console.warn(`[register_portal] Portal "${config.id}" is already registered — skipping.`);
    return;
  }

  // Build the policy entry with defaults for optional fields
  PORTAL_POLICIES[config.id] = {
    allowed_agents: config.allowed_agents || [],
    blocked_agents: config.blocked_agents || [],
    allowed_intents: config.allowed_intents || [],
    blocked_intents: config.blocked_intents || [],
    response_persona: config.response_persona,
    data_scope: config.data_scope,
    can_see_raw_clinical_codes: config.can_see_raw_clinical_codes ?? false,
    requires_consent_check: config.requires_consent_check ?? false,
    max_response_complexity: config.max_response_complexity || 'simple',
    language_auto_detect: config.language_auto_detect ?? false,
    file_upload_allowed: config.file_upload_allowed ?? false,
    file_types_allowed: config.file_types_allowed || [],
    suggested_prompts: config.suggested_prompts || [],
  };

  // Register the route prefix → portal ID mapping
  ROUTE_TO_PORTAL[config.route_prefix] = config.id;

  console.info(`[register_portal] Registered new portal: "${config.id}" at route "${config.route_prefix}"`);
}

// ─── Pre-built portal configs (ready to enable) ───────────────────────────────
// Uncomment any of these to activate the portal without any other code changes.

// ── RESEARCHER PORTAL ──────────────────────────────────────────────────────────
// registerPortal({
//   id: 'researcher',
//   route_prefix: '/researcher',
//   allowed_agents: ['research'],
//   blocked_agents: ['clinical_decision', 'drug_safety', 'general_health', 'monitoring', 'document_analysis'],
//   allowed_intents: ['research_literature', 'comparative_analysis', 'evidence_summary', 'guideline_lookup'],
//   blocked_intents: ['any_patient_specific_query', 'clinical_diagnosis', 'treatment_suggestion'],
//   response_persona: 'research',
//   data_scope: 'anonymized_cohorts',
//   can_see_raw_clinical_codes: false,
//   requires_consent_check: false,
//   max_response_complexity: 'research',
//   language_auto_detect: false,
//   file_upload_allowed: true,
//   file_types_allowed: ['pdf'],
//   suggested_prompts: [
//     'Summarise recent research on this treatment',
//     'Compare treatment A vs treatment B',
//     'What is the evidence grade for this intervention?',
//     'What do the latest guidelines recommend?',
//   ],
//   jwt_role_value: 'researcher',
// });

// ── LAB PORTAL ────────────────────────────────────────────────────────────────
// registerPortal({
//   id: 'lab',
//   route_prefix: '/lab',
//   allowed_agents: ['drug_safety', 'monitoring', 'document_analysis'],
//   blocked_agents: ['clinical_decision', 'research', 'general_health'],
//   allowed_intents: ['lab_interpretation', 'drug_interaction_clinical', 'alert_generation', 'document_upload_analysis'],
//   blocked_intents: ['clinical_diagnosis', 'treatment_suggestion', 'research_literature'],
//   response_persona: 'clinical',
//   data_scope: 'lab_orders',
//   can_see_raw_clinical_codes: true,
//   requires_consent_check: true,
//   max_response_complexity: 'clinical',
//   language_auto_detect: false,
//   file_upload_allowed: true,
//   file_types_allowed: ['pdf', 'csv'],
//   suggested_prompts: [
//     'Interpret this lab result',
//     'Flag critical values in this report',
//     'Check drug-lab interactions for this patient',
//   ],
//   jwt_role_value: 'lab',
// });

// ── GOVERNMENT / PUBLIC HEALTH PORTAL ─────────────────────────────────────────
// registerPortal({
//   id: 'govt_agency',
//   route_prefix: '/govt',
//   allowed_agents: ['monitoring', 'research'],
//   blocked_agents: ['clinical_decision', 'drug_safety', 'general_health', 'document_analysis'],
//   allowed_intents: ['system_analytics', 'research_literature', 'alert_summary_aggregate', 'compliance_report'],
//   blocked_intents: ['any_patient_specific_query', 'clinical_content'],
//   response_persona: 'administrative',
//   data_scope: 'aggregated_only',
//   can_see_raw_clinical_codes: false,
//   requires_consent_check: false,
//   max_response_complexity: 'operational',
//   language_auto_detect: false,
//   file_upload_allowed: false,
//   file_types_allowed: [],
//   suggested_prompts: [
//     'Disease burden report for this region',
//     'Show immunisation coverage trends',
//     'Alert frequency by condition type',
//   ],
//   jwt_role_value: 'govt_agency',
// });

// ─── Exports ──────────────────────────────────────────────────────────────────

module.exports = { registerPortal };
