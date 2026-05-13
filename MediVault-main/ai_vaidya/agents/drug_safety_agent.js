// AI-Vaidya — drug_safety_agent.js | MediVault Platform
// =======================================================
// Drug information and safety checking.
// Covers: interactions, side effects, dosage safety, alternatives.
// Used by: patient (simplified), doctor, hospital (clinical detail) portals.
// External API: openFDA (free, no key required) — https://api.fda.gov/drug/label.json

const { CORE_IDENTITY_PROMPT, PORTAL_PROMPTS, buildSessionContext } = require('../config/prompt_templates');
const { callLLM } = require('../core/llm_client');

const FDA_LABEL_URL = 'https://api.fda.gov/drug/label.json';

// Simple in-memory cache for FDA drug data (7-day TTL)
const fdaCache = new Map();
const FDA_CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * Fetch drug label data from openFDA.
 * Returns the first matching label record, or null.
 */
async function fetchFDADrugData(drugName) {
  const cacheKey = drugName.toLowerCase().trim();
  const cached = fdaCache.get(cacheKey);
  if (cached && Date.now() - cached.ts < FDA_CACHE_TTL_MS) {
    return cached.data;
  }

  try {
    // Try brand name first, then generic name
    const queries = [
      `openfda.brand_name:"${encodeURIComponent(drugName)}"`,
      `openfda.generic_name:"${encodeURIComponent(drugName)}"`,
      `openfda.substance_name:"${encodeURIComponent(drugName)}"`,
    ];

    for (const q of queries) {
      const url = `${FDA_LABEL_URL}?search=${q}&limit=1`;
      const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
      if (!res.ok) continue;
      const json = await res.json();
      const record = json?.results?.[0];
      if (record) {
        const parsed = parseFDALabel(record);
        fdaCache.set(cacheKey, { data: parsed, ts: Date.now() });
        return parsed;
      }
    }
  } catch (_) {
    // FDA unavailable — proceed without it
  }
  return null;
}

/**
 * Extract the useful fields from an FDA label record.
 */
function parseFDALabel(record) {
  const extract = (field) => {
    const val = record[field];
    if (!val) return null;
    const text = Array.isArray(val) ? val[0] : val;
    // Strip HTML tags and truncate
    return text.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 1200);
  };

  return {
    brand_name: record.openfda?.brand_name?.[0] || null,
    generic_name: record.openfda?.generic_name?.[0] || null,
    indications: extract('indications_and_usage'),
    contraindications: extract('contraindications'),
    warnings: extract('warnings_and_cautions') || extract('warnings'),
    drug_interactions: extract('drug_interactions'),
    dosage: extract('dosage_and_administration'),
    adverse_reactions: extract('adverse_reactions'),
    use_in_pregnancy: extract('pregnancy') || extract('use_in_specific_populations'),
  };
}

function buildSystemPrompt(portalContext) {
  const portalId = portalContext.portal_id || 'patient';
  const portalPrompt = PORTAL_PROMPTS[portalId] || PORTAL_PROMPTS.patient;
  const sessionCtx = buildSessionContext(portalContext);
  return `${CORE_IDENTITY_PROMPT}\n\n${portalPrompt}\n\n${sessionCtx}`;
}

function buildUserPrompt(query, chunks, patientContext, classification, fdaData, isPatient) {
  let prompt = '';

  // Include structured FDA data so the LLM doesn't need to guess
  if (fdaData) {
    prompt += `FDA-sourced drug data for "${fdaData.generic_name || fdaData.brand_name}":\n`;
    if (fdaData.indications) prompt += `Indications: ${fdaData.indications}\n`;
    if (fdaData.contraindications) prompt += `Contraindications: ${fdaData.contraindications}\n`;
    if (fdaData.warnings) prompt += `Warnings: ${fdaData.warnings}\n`;
    if (fdaData.drug_interactions) prompt += `Drug interactions: ${fdaData.drug_interactions}\n`;
    if (fdaData.dosage) prompt += `Dosage: ${fdaData.dosage}\n`;
    if (fdaData.adverse_reactions) prompt += `Adverse reactions: ${fdaData.adverse_reactions}\n`;
    if (fdaData.use_in_pregnancy) prompt += `Use in pregnancy: ${fdaData.use_in_pregnancy}\n`;
    prompt += '\n';
  } else {
    prompt += 'Note: Real-time FDA database was unavailable. Use general pharmacological knowledge and be explicit about uncertainty.\n\n';
  }

  if (patientContext) {
    const meds = patientContext.current_medications?.map(m => m.name || m).join(', ');
    const allergies = patientContext.allergies?.join(', ');
    const conditions = patientContext.active_conditions?.join(', ');
    if (meds) prompt += `Patient's current medications: ${meds}\n`;
    if (allergies) prompt += `Patient's allergies: ${allergies}\n`;
    if (conditions) prompt += `Patient's conditions: ${conditions}\n`;

    if (patientContext.renal_function) prompt += `Renal function: ${JSON.stringify(patientContext.renal_function)}\n`;
    if (patientContext.hepatic_function) prompt += `Hepatic function: ${JSON.stringify(patientContext.hepatic_function)}\n`;
    prompt += '\n';
  }

  if (chunks?.length > 0) {
    const ctx = chunks.map((c, i) => `[Ref ${i + 1}]: ${c.content}`).join('\n\n');
    prompt += `Additional knowledge base context:\n${ctx}\n\n`;
  }

  if (isPatient) {
    prompt += 'Please explain in simple, patient-friendly language. Avoid raw medical jargon. End your response with: "Always confirm with your doctor or pharmacist before making any medication changes."\n\n';
  } else {
    prompt += 'Please provide full clinical detail including interaction mechanism, clinical significance (major/moderate/minor), and management strategy. Include dosage adjustment guidance if renal or hepatic impairment is present.\n\n';
  }

  prompt += `Query: ${query}`;
  return prompt;
}

/**
 * Extracts drug names from a query using simple heuristics.
 */
function extractDrugNames(query) {
  // Common drug patterns in queries
  const cleaned = query.toLowerCase();
  const stopWords = ['take', 'taking', 'with', 'and', 'the', 'my', 'can', 'i', 'safe', 'is', 'are', 'what', 'about', 'for', 'of', 'interaction', 'between'];
  const words = cleaned.split(/\s+/)
    .filter(w => w.length > 3 && !stopWords.includes(w))
    .filter(w => /^[a-z]+$/.test(w));
  // Return up to 3 candidate drug names
  return words.slice(0, 3);
}

async function run(query, chunks, patientContext, classification, portalContext) {
  const isPatient = portalContext.portal_id === 'patient';

  // Try to fetch FDA data for the drug(s) mentioned
  const drugNames = extractDrugNames(query);
  let fdaData = null;
  for (const drug of drugNames) {
    fdaData = await fetchFDADrugData(drug);
    if (fdaData) break;
  }

  const systemPrompt = buildSystemPrompt(portalContext);
  const userPrompt = buildUserPrompt(query, chunks, patientContext, classification, fdaData, isPatient);
  const history = portalContext.conversationHistory || [];
  return (await callLLM({ systemPrompt, userMessage: userPrompt, conversationHistory: history })).text;
}

module.exports = { run, buildSystemPrompt, buildUserPrompt, fetchFDADrugData };
