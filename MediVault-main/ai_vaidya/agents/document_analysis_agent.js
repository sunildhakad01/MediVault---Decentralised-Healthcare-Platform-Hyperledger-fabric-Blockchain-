// AI-Vaidya — document_analysis_agent.js | MediVault Platform
// =============================================================
// Analyse uploaded health documents: lab reports, prescriptions,
// discharge summaries, imaging reports.
// Used by: all portals.
// LLM: Gemini 2.0 Flash (multimodal — accepts base64 image/PDF directly).

const { CORE_IDENTITY_PROMPT, PORTAL_PROMPTS, buildSessionContext } = require('../config/prompt_templates');
const { callLLM } = require('../core/llm_client');

// Supported MIME types mapped to Gemini's inline_data format
const MIME_MAP = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  pdf: 'application/pdf',
  dcm: 'image/x-dicom',
};

/**
 * Detect document type from content or filename hint.
 * Returns one of: lab_report | prescription | discharge_summary | imaging_report | other
 */
function detectDocumentType(filename, textHint = '') {
  const name = (filename || '').toLowerCase();
  const hint = textHint.toLowerCase();

  if (/lab|blood|cbc|lft|kft|lipid|thyroid|hba1c|urine|report|result/.test(name + hint)) return 'lab_report';
  if (/prescript|rx|medicine|medication|drug/.test(name + hint)) return 'prescription';
  if (/discharge|summary|hospital|admission|inpatient/.test(name + hint)) return 'discharge_summary';
  if (/xray|x-ray|mri|ct|ultrasound|scan|radiol|imaging|ecg|ekg/.test(name + hint)) return 'imaging_report';
  return 'other';
}

/**
 * Build the document-type-specific analysis instruction.
 */
function buildDocumentInstruction(docType, isPatient) {
  const instructions = {
    lab_report: isPatient
      ? `This is a lab report. For EVERY parameter listed:
1. What does this test measure? (1 sentence, simple language)
2. The patient's value and the reference range
3. Is it normal, slightly outside range, or significantly outside range?
4. What does this mean in plain language? (reassuring where appropriate)
5. What should the patient discuss with their doctor?

Format each parameter clearly. Use "✅ Normal" or "⚠️ Needs attention" labels.
End with: "Please bring this report to your next doctor's appointment."`
      : `This is a lab report. Provide full clinical interpretation:
For each abnormal value: Parameter | Value | Reference range | Clinical significance | Likely causes | Recommended action | Urgency.
Flag any CRITICAL values prominently with [CRITICAL].
Include any notable patterns (e.g., combined renal + electrolyte abnormalities).`,

    prescription: isPatient
      ? `This is a prescription. For EACH medicine listed:
1. Medicine name (generic and brand if both present)
2. What it is used for (simple language)
3. When to take it: Morning/Evening/Night, with food or empty stomach, how many times per day
4. Important things to watch for
5. Duration (if stated)

End with a clear daily medicine schedule.`
      : `This is a prescription. Extract each medicine with: Generic name | Dose | Route | Frequency | Duration | Clinical indication (if stated). Flag any unusual doses or potential interactions with known patient medications.`,

    discharge_summary: isPatient
      ? `This is a hospital discharge summary. Please explain:
1. Why the patient was admitted (in simple words)
2. What happened during the hospital stay
3. The diagnosis (in plain language — what condition was found/treated)
4. Procedures or operations done
5. Medicines to take at home and schedule
6. What NOT to do during recovery
7. When to go back to the doctor (follow-up date and reason)
8. Warning signs to watch for (when to go to emergency)

Use simple language. Be reassuring.`
      : `This is a discharge summary. Extract: Primary diagnosis | Secondary diagnoses | Procedures performed | Discharge medications (with any changes from admission medications) | Follow-up instructions | Red flag symptoms for re-admission.`,

    imaging_report: isPatient
      ? `This is an imaging/radiology report. Please explain:
1. What type of scan/image this is and what body part was examined
2. What the doctor was looking for
3. What was found — explain each finding in simple, non-alarming language
4. What is normal vs. what needs attention
5. What this likely means for the patient's health
6. What the patient should discuss with their doctor

Never cause unnecessary alarm. Be clear and reassuring.`
      : `This is an imaging/radiology report. Provide: Imaging modality | Body part | Key findings | Incidental findings | Clinical significance | Recommended follow-up imaging or action.`,

    other: isPatient
      ? `Please analyse this health document and explain its key contents in simple, patient-friendly language. Highlight anything the patient should discuss with their doctor.`
      : `Please analyse this clinical document and extract key medical information relevant to patient care.`,
  };

  return instructions[docType] || instructions.other;
}

async function callGeminiMultimodal(systemPrompt, instruction, fileData, mimeType) {
  let fileAttachment;
  if (fileData && mimeType) {
    const base64 = Buffer.isBuffer(fileData) ? fileData.toString('base64') : fileData;
    fileAttachment = { data: base64, mimeType };
  }
  return (await callLLM({ systemPrompt, userMessage: instruction, fileAttachment })).text;
}

function buildSystemPrompt(portalContext) {
  const portalId = portalContext.portal_id || 'patient';
  const portalPrompt = PORTAL_PROMPTS[portalId] || PORTAL_PROMPTS.patient;
  const sessionCtx = buildSessionContext(portalContext);
  return `${CORE_IDENTITY_PROMPT}\n\n${portalPrompt}\n\n${sessionCtx}`;
}

/**
 * Main entry point for document analysis.
 * @param {object} file - { data: Buffer|base64string, filename: string, mimeType?: string }
 * @param {object} portalContext
 * @param {string} queryHint - Optional user query to guide analysis
 * @returns {Promise<{ raw: object, formatted: string }>}
 */
async function analyzeDocument(file, portalContext, queryHint = '') {
  const isPatient = portalContext.portal_id === 'patient';
  const docType = detectDocumentType(file.filename, queryHint);

  // Resolve MIME type
  const ext = (file.filename || '').split('.').pop()?.toLowerCase();
  const mimeType = file.mimeType || MIME_MAP[ext] || 'application/octet-stream';

  const systemPrompt = buildSystemPrompt(portalContext);
  const instruction = buildDocumentInstruction(docType, isPatient);

  const fullInstruction = queryHint
    ? `The user asked: "${queryHint}"\n\n${instruction}`
    : instruction;

  const formatted = await callGeminiMultimodal(systemPrompt, fullInstruction, file.data, mimeType);

  return {
    raw: { doc_type: docType, filename: file.filename, mime_type: mimeType },
    formatted,
  };
}

/**
 * Standard agent run interface (called from orchestrator when file is attached).
 */
async function run(query, chunks, patientContext, classification, portalContext, file) {
  if (!file) {
    // No file — ask user to upload
    return 'Please upload a document (PDF, image of lab report, prescription, or scan) and I will analyse it for you.';
  }
  const result = await analyzeDocument(file, portalContext, query);
  return result.formatted;
}

module.exports = { run, analyzeDocument, detectDocumentType };
