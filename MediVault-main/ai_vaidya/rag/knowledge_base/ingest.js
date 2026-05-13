// AI-Vaidya — ingest.js | MediVault Platform
// ============================================
// Document ingestion pipeline: text/PDF → chunk → embed → store.

const { vectorStore } = require('../vector_store');

// ─── Chunking strategies ─────────────────────────────────────────────────────

/**
 * Recursive character splitter with overlap.
 */
function recursiveChunk(text, chunkSize = 400, overlap = 80) {
  const chunks = [];
  let start = 0;

  while (start < text.length) {
    let end = start + chunkSize;

    // Try to break at a sentence boundary
    if (end < text.length) {
      const breakPoints = ['. ', '.\n', '\n\n', '\n', ' '];
      for (const bp of breakPoints) {
        const idx = text.lastIndexOf(bp, end);
        if (idx > start + chunkSize * 0.5) {
          end = idx + bp.length;
          break;
        }
      }
    }

    chunks.push(text.slice(start, Math.min(end, text.length)).trim());
    start = end - overlap;
  }

  return chunks.filter(c => c.length > 20);
}

/**
 * Chunk a clinical guideline by section headers (## / ###).
 */
function chunkByHeaders(text) {
  const sections = text.split(/(?=#{2,3}\s)/);
  const chunks = [];

  for (const section of sections) {
    if (section.trim().length < 30) continue;
    if (section.length > 600) {
      // Sub-chunk large sections
      chunks.push(...recursiveChunk(section, 400, 80));
    } else {
      chunks.push(section.trim());
    }
  }

  return chunks.length > 0 ? chunks : recursiveChunk(text, 400, 80);
}

/**
 * Chunk a patient record by SOAP sections or date entries.
 */
function chunkPatientRecord(text) {
  // Try SOAP sections
  const soapPattern = /\b(Subjective|Objective|Assessment|Plan|Chief Complaint|HPI|PMH|Medications|Allergies|Vitals|Labs|Impression|Follow-up)\b/i;
  if (soapPattern.test(text)) {
    const sections = text.split(/\n(?=\s*(Subjective|Objective|Assessment|Plan|Chief Complaint|HPI|PMH|Medications|Allergies|Vitals|Labs|Impression|Follow-up)\s*:)/i);
    return sections.filter(s => s.trim().length > 20);
  }

  // Try date-based splitting
  const datePattern = /\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}/;
  if (datePattern.test(text)) {
    return recursiveChunk(text, 300, 60);
  }

  return recursiveChunk(text, 400, 80);
}

// ─── Ingestion functions ─────────────────────────────────────────────────────

/**
 * Ingest plain text with metadata.
 * @param {string} text
 * @param {object} metadata - { source, doc_type, patient_id?, specialty? }
 */
async function ingestText(text, metadata = {}) {
  if (!text || text.trim().length < 10) return;

  let chunks;
  const docType = metadata.doc_type || 'general';

  if (docType === 'guideline' || text.includes('## ') || text.includes('### ')) {
    chunks = chunkByHeaders(text);
  } else if (docType === 'patient_record') {
    chunks = chunkPatientRecord(text);
  } else if (docType === 'research_abstract') {
    chunks = [text.trim()]; // Keep abstract as single chunk
  } else {
    chunks = recursiveChunk(text, 400, 80);
  }

  const docs = chunks.map(chunk => ({
    content: chunk,
    metadata: {
      ...metadata,
      ingested_at: new Date().toISOString(),
      chunk_length: chunk.length,
    },
  }));

  await vectorStore.addDocuments(docs);
  console.log(`[ingest] Added ${docs.length} chunks from "${metadata.source || 'unknown'}"`);
}

/**
 * Ingest a patient record object.
 * Formats the structured record into text before ingesting.
 */
async function ingestPatientRecord(record, patientId) {
  if (!record || !patientId) return;

  const sections = [];

  if (record.conditions?.length) {
    sections.push(`Active Conditions:\n${record.conditions.map(c => `- ${c.name || c}`).join('\n')}`);
  }
  if (record.medications?.length) {
    sections.push(`Current Medications:\n${record.medications.map(m => `- ${m.name} ${m.dose || ''} ${m.frequency || ''}`).join('\n')}`);
  }
  if (record.allergies?.length) {
    sections.push(`Allergies: ${record.allergies.join(', ')}`);
  }
  if (record.lab_results?.length) {
    const labs = record.lab_results.map(l => `${l.test_name}: ${l.value} ${l.unit || ''} (${l.date || 'recent'})`).join('\n');
    sections.push(`Lab Results:\n${labs}`);
  }
  if (record.vitals?.length) {
    const vitals = record.vitals.map(v => `${v.type}: ${v.value} ${v.unit || ''} (${v.date || 'recent'})`).join('\n');
    sections.push(`Vitals:\n${vitals}`);
  }
  if (record.notes) {
    sections.push(`Clinical Notes:\n${record.notes}`);
  }

  const text = sections.join('\n\n');
  if (!text.trim()) return;

  await ingestText(text, {
    source: `patient_record_${patientId}`,
    doc_type: 'patient_record',
    patient_id: patientId,
    record_date: record.date || new Date().toISOString(),
  });
}

/**
 * Ingest a PDF file (reads text — requires no extra library, passes raw text).
 * For production, integrate pdf-parse. For now, accepts pre-extracted text.
 */
async function ingestPDF(textContent, metadata = {}) {
  // textContent should be pre-extracted text from PDF
  await ingestText(textContent, { ...metadata, doc_type: metadata.doc_type || 'document' });
}

module.exports = { ingestText, ingestPDF, ingestPatientRecord, recursiveChunk, chunkByHeaders };
