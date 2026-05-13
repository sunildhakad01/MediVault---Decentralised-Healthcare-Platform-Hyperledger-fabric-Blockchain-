// AI-Vaidya — response_formatter.js | MediVault Platform
// ========================================================
// Applies persona-based output formatting to raw LLM responses.
// Makes a Gemini reformatting call only when a clear persona mismatch is detected.

const { PERSONA_REFORMAT_INSTRUCTIONS } = require('../config/prompt_templates');

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

// ─── Persona mismatch detection ───────────────────────────────────────────────

// Clinical jargon that should NOT appear in patient-friendly responses
const CLINICAL_JARGON = [
  /\beGFR\b/, /\bHbA1c\b(?!\s+is\s+a)/, /\bCKD-EPI\b/, /\bCHADS\b/, /\bSOAP\b/,
  /\bdifferential\s+diagnosis\b/, /\bpharmacokinetics\b/, /\bcontraindicated\b/,
  /\bSGOT\b/, /\bSGPT\b/, /\bALP\b(?!\s+is)/, /\bCRP\b(?!\s+is)/,
];

function hasClinicaljargon(text) {
  return CLINICAL_JARGON.some(pattern => pattern.test(text));
}

/**
 * Detect whether the response language is Hindi/Hinglish.
 */
function isHindi(text) {
  // Devanagari script range
  if (/[\u0900-\u097F]/.test(text)) return true;
  // Common Hinglish words
  if (/\b(hai|hain|kya|nahi|aap|mujhe|mere|dawa|bukhar|dard|doctor ke paas|jana chahiye)\b/i.test(text)) return true;
  return false;
}

// ─── Gemini reformatting ──────────────────────────────────────────────────────

async function callGeminiReformat(instruction, rawText) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return rawText; // Skip reformatting if no API key

  try {
    const res = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: instruction }] },
        contents: [{ role: 'user', parts: [{ text: rawText }] }],
        generationConfig: {
          maxOutputTokens: parseInt(process.env.AIVAIDYA_MAX_TOKENS || '1500', 10),
          temperature: 0.2,
        },
      }),
      signal: AbortSignal.timeout(10000),
    });

    if (!res.ok) return rawText;
    const data = await res.json();
    return data?.candidates?.[0]?.content?.parts?.[0]?.text || rawText;
  } catch (_) {
    return rawText; // Always fall back to original if reformatting fails
  }
}

// ─── Main formatter ───────────────────────────────────────────────────────────

/**
 * Format a raw LLM response for the correct persona.
 *
 * @param {string} rawText - The raw agent response
 * @param {string} persona - 'patient_friendly' | 'clinical' | 'administrative' | 'research'
 * @param {object} options - { detected_language?, force_reformat? }
 * @returns {Promise<{ text: string }>}
 */
async function format(rawText, persona, options = {}) {
  if (!rawText) return { text: '' };

  let text = rawText;

  // Preserve Hindi/Hinglish if detected
  const responseIsHindi = isHindi(text);

  // Only reformat if there is a clear persona mismatch
  if (persona === 'patient_friendly' && hasClinicaljargon(text) && !responseIsHindi) {
    const instruction = PERSONA_REFORMAT_INSTRUCTIONS.patient_friendly;
    text = await callGeminiReformat(instruction, text);
  }

  // For patient persona with Hindi query, preserve the language
  if (persona === 'patient_friendly' && options.detected_language === 'hinglish' && !responseIsHindi) {
    // Append a brief note in Hinglish if response came back in English
    // Do not force-translate as it can distort meaning
  }

  return { text };
}

module.exports = { format };
