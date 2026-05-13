// AI-Vaidya — clinical_decision_agent.js | MediVault Platform
// =============================================================
// Clinical decision support for doctors and hospitals.
// Covers: case analysis, SOAP notes, differential diagnosis, risk stratification, treatment options.
// Used by: doctor, hospital portals.

const { CORE_IDENTITY_PROMPT, PORTAL_PROMPTS, buildSessionContext } = require('../config/prompt_templates');
const { callLLM } = require('../core/llm_client');

function buildSystemPrompt(portalContext) {
  const portalId = portalContext.portal_id || 'doctor';
  const portalPrompt = PORTAL_PROMPTS[portalId] || PORTAL_PROMPTS.doctor;
  const sessionCtx = buildSessionContext(portalContext);
  return `${CORE_IDENTITY_PROMPT}\n\n${portalPrompt}\n\n${sessionCtx}`;
}

function buildUserPrompt(query, chunks, patientContext, classification) {
  let prompt = '';

  // Always confirm patient context at start of every clinical response
  if (patientContext) {
    const name = patientContext.patient_name || 'this patient';
    const age = patientContext.patient_age ? `, ${patientContext.patient_age}` : '';
    const gender = patientContext.patient_gender ? `${patientContext.patient_gender}` : '';
    const conditions = patientContext.active_conditions?.join(', ') || 'none recorded';
    const meds = patientContext.current_medications?.map(m => m.name || m).join(', ') || 'none recorded';
    const allergies = patientContext.allergies?.join(', ') || 'NKDA';

    prompt += `Reviewing: ${name}${age}${gender ? ` (${gender})` : ''}\n`;
    prompt += `Active conditions: ${conditions}\n`;
    prompt += `Current medications: ${meds}\n`;
    prompt += `Allergies: ${allergies}\n`;

    if (patientContext.recent_labs) {
      prompt += `Recent labs: ${JSON.stringify(patientContext.recent_labs)}\n`;
    }
    if (patientContext.vitals) {
      prompt += `Recent vitals: ${JSON.stringify(patientContext.vitals)}\n`;
    }
    prompt += '\n';
  }

  if (chunks && chunks.length > 0) {
    const contextText = chunks
      .map((c, i) => `[Reference ${i + 1} — ${c.metadata?.source || 'knowledge base'}]: ${c.content}`)
      .join('\n\n');
    prompt += `Retrieved clinical references:\n${contextText}\n\n`;
  }

  // Intent-specific guidance
  const intentHints = {
    differential_diagnosis: 'Please provide a ranked differential diagnosis with supporting and against evidence for each, and the next best investigation to confirm.',
    soap_note_generation: 'Please generate a structured SOAP note based on the available information. Flag any fields where clinical examination data is missing.',
    risk_stratification: 'Please apply the most appropriate validated clinical risk score and interpret the result with guideline-recommended management.',
    treatment_suggestion: 'Please provide evidence-based treatment options with guideline references, and flag any that are contraindicated for this specific patient.',
    guideline_lookup: 'Please cite the specific guideline body, recommendation class, and evidence grade.',
    lab_interpretation: 'Please interpret each abnormal value with clinical significance, possible causes, and recommended action. Flag any critical values immediately.',
    drug_interaction_clinical: 'Please describe the interaction mechanism, clinical significance, and management strategy.',
    dosage_calculation: 'Please show the dosage calculation with the patient\'s relevant renal/hepatic parameters.',
  };
  const hint = intentHints[classification?.intent];
  if (hint) prompt += `${hint}\n\n`;

  prompt += `Clinical query: ${query}`;
  return prompt;
}

async function run(query, chunks, patientContext, classification, portalContext) {
  const systemPrompt = buildSystemPrompt(portalContext);
  const userPrompt = buildUserPrompt(query, chunks, patientContext, classification);
  const history = portalContext.conversationHistory || [];
  return (await callLLM({ systemPrompt, userMessage: userPrompt, conversationHistory: history })).text;
}

module.exports = { run, buildSystemPrompt, buildUserPrompt };
