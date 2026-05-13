// AI-Vaidya — general_health_agent.js | MediVault Platform
// ===========================================================
// Handles all patient general health queries via Gemini 1.5 Flash.
// Covers: medicine info, disease explanations, symptom guidance, lifestyle advice.
// Used by: patient portal.

const { CORE_IDENTITY_PROMPT, PORTAL_PROMPTS, buildSessionContext } = require('../config/prompt_templates');
const { callLLM } = require('../core/llm_client');

/**
 * Builds the full system prompt for this agent in the patient portal.
 */
function buildSystemPrompt(portalContext) {
  const sessionCtx = buildSessionContext(portalContext);
  return `${CORE_IDENTITY_PROMPT}\n\n${PORTAL_PROMPTS.patient}\n\n${sessionCtx}`;
}

/**
 * Builds the user-facing prompt with retrieved RAG context.
 */
function buildUserPrompt(query, chunks, patientContext) {
  let prompt = '';

  if (chunks && chunks.length > 0) {
    const contextText = chunks.map((c, i) => `[Source ${i + 1}]: ${c.content}`).join('\n\n');
    prompt += `Relevant medical knowledge retrieved:\n${contextText}\n\n`;
  }

  if (patientContext) {
    const parts = [];
    if (patientContext.active_conditions?.length) {
      parts.push(`Patient's active conditions: ${patientContext.active_conditions.join(', ')}`);
    }
    if (patientContext.current_medications?.length) {
      parts.push(`Patient's current medications: ${patientContext.current_medications.map(m => m.name || m).join(', ')}`);
    }
    if (patientContext.allergies?.length) {
      parts.push(`Known allergies: ${patientContext.allergies.join(', ')}`);
    }
    if (parts.length > 0) {
      prompt += `Patient context:\n${parts.join('\n')}\n\n`;
    }
  }

  prompt += `Patient's question: ${query}`;
  return prompt;
}

/**
 * Main agent entry point.
 * @param {string} query - User's question
 * @param {Array} chunks - Retrieved RAG chunks
 * @param {object} patientContext - Patient data from context_builder
 * @param {object} classification - Intent classification from intent_classifier
 * @param {object} portalContext - Portal session context
 * @returns {Promise<string>} - AI response text
 */
async function run(query, chunks, patientContext, classification, portalContext) {
  const systemPrompt = buildSystemPrompt(portalContext);
  const userPrompt = buildUserPrompt(query, chunks, patientContext);
  const history = portalContext.conversationHistory || [];

  const { text } = await callLLM({
    systemPrompt,
    userMessage: userPrompt,
    conversationHistory: history,
    fileAttachment: portalContext.fileAttachment || null,
  });
  return text;
}

module.exports = { run, buildSystemPrompt, buildUserPrompt };
