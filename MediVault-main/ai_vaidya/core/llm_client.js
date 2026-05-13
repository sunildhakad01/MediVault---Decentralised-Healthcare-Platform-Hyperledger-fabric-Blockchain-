// AI-Vaidya — llm_client.js | MediVault Platform
// ================================================
// Shared LLM client with a 3-tier fallback chain:
//   1. Gemini 2.0 Flash (primary — Google AI Studio, free tier)
//   2. Groq Llama 3.1 70B (fallback 1 — fast, free)
//   3. Groq Llama 3.1 8B  (fallback 2 — fastest, free)
//
// All agents should import `callLLM` from here instead of calling Gemini directly.
// This centralises retry logic, fallback handling, and model-version tracking.

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models';
const GROQ_API_URL   = 'https://api.groq.com/openai/v1/chat/completions';

// ─── Per-model config ─────────────────────────────────────────────────────────

const MODELS = [
  {
    id: 'gemini',
    name: () => process.env.AIVAIDYA_PRIMARY_MODEL || 'gemini-2.0-flash',
    available: () => Boolean(process.env.GEMINI_API_KEY),
    call: callGemini,
  },
  {
    id: 'groq-70b',
    name: () => 'llama-3.3-70b-versatile',
    available: () => Boolean(process.env.GROQ_API_KEY),
    call: callGroq,
  },
  {
    id: 'groq-8b',
    name: () => process.env.AIVAIDYA_FAST_MODEL || 'llama-3.1-8b-instant',
    available: () => Boolean(process.env.GROQ_API_KEY),
    call: callGroq,
  },
];

// ─── Gemini implementation ────────────────────────────────────────────────────

/**
 * Call Gemini generateContent API.
 *
 * @param {object} opts
 * @param {string}  opts.modelName
 * @param {string}  opts.systemPrompt
 * @param {string}  opts.userMessage
 * @param {Array}   opts.conversationHistory  — [{role, content}]
 * @param {number}  opts.maxTokens
 * @param {number}  opts.temperature
 * @param {object}  [opts.fileAttachment]     — { data: base64, mimeType }
 * @returns {Promise<string>}
 */
async function callGemini({ modelName, systemPrompt, userMessage, conversationHistory = [], maxTokens, temperature, fileAttachment }) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY not set');

  const contents = [];

  // Conversation history
  for (const turn of conversationHistory) {
    contents.push({
      role: turn.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: turn.content }],
    });
  }

  // Current user message (with optional file attachment)
  const userParts = [];
  if (fileAttachment?.data && fileAttachment?.mimeType) {
    userParts.push({
      inline_data: { mime_type: fileAttachment.mimeType, data: fileAttachment.data },
    });
  }
  userParts.push({ text: userMessage });
  contents.push({ role: 'user', parts: userParts });

  const body = {
    system_instruction: { parts: [{ text: systemPrompt }] },
    contents,
    generationConfig: {
      maxOutputTokens: maxTokens,
      temperature,
    },
  };

  const url = `${GEMINI_API_URL}/${modelName}:generateContent?key=${apiKey}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(30000),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => '');
    throw new Error(`Gemini ${res.status}: ${errText.slice(0, 200)}`);
  }

  const data = await res.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error('Gemini returned empty response');
  return text;
}

// ─── Groq implementation ──────────────────────────────────────────────────────

/**
 * Call Groq OpenAI-compatible chat completions API.
 *
 * @param {object} opts
 * @param {string}  opts.modelName
 * @param {string}  opts.systemPrompt
 * @param {string}  opts.userMessage
 * @param {Array}   opts.conversationHistory
 * @param {number}  opts.maxTokens
 * @param {number}  opts.temperature
 * @returns {Promise<string>}
 */
async function callGroq({ modelName, systemPrompt, userMessage, conversationHistory = [], maxTokens, temperature }) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error('GROQ_API_KEY not set');

  const messages = [{ role: 'system', content: systemPrompt }];

  for (const turn of conversationHistory) {
    messages.push({ role: turn.role, content: turn.content });
  }
  messages.push({ role: 'user', content: userMessage });

  const res = await fetch(GROQ_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: modelName,
      messages,
      max_tokens: Math.min(maxTokens, 8000), // Groq free tier cap
      temperature,
    }),
    signal: AbortSignal.timeout(25000),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => '');
    throw new Error(`Groq ${res.status}: ${errText.slice(0, 200)}`);
  }

  const data = await res.json();
  const text = data?.choices?.[0]?.message?.content;
  if (!text) throw new Error('Groq returned empty response');
  return text;
}

// ─── Retry helper ─────────────────────────────────────────────────────────────

/**
 * Retry a function up to `retries` times with a fixed 1-second delay.
 * Does NOT retry on auth errors (401/403) or bad requests (400).
 */
async function withRetry(fn, retries = 2) {
  let lastErr;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      const msg = err.message || '';
      // Don't retry on client-side errors
      if (msg.includes('400') || msg.includes('401') || msg.includes('403')) {
        throw err;
      }
      if (attempt < retries) {
        await new Promise(r => setTimeout(r, 1000));
      }
    }
  }
  throw lastErr;
}

// ─── Main entry point ─────────────────────────────────────────────────────────

/**
 * Call the LLM with automatic fallback across the 3-tier chain.
 *
 * @param {object} opts
 * @param {string}  opts.systemPrompt         - System/persona prompt
 * @param {string}  opts.userMessage          - The user's query
 * @param {Array}   [opts.conversationHistory] - [{role, content}] prior turns
 * @param {number}  [opts.maxTokens]          - Max output tokens (default: env or 1500)
 * @param {number}  [opts.temperature]        - LLM temperature (default: env or 0.3)
 * @param {object}  [opts.fileAttachment]     - { data: base64, mimeType } for vision
 * @param {string}  [opts.preferModel]        - 'gemini' | 'groq-70b' | 'groq-8b' to skip ahead
 *
 * @returns {Promise<{ text: string, model_used: string }>}
 * @throws {Error} Only when ALL fallbacks are exhausted
 */
async function callLLM(opts) {
  const maxTokens  = opts.maxTokens  ?? parseInt(process.env.AIVAIDYA_MAX_TOKENS  || '1500', 10);
  const temperature = opts.temperature ?? parseFloat(process.env.AIVAIDYA_TEMPERATURE || '0.3');

  const errors = [];
  let startIndex = 0;

  // Allow callers to skip to a specific model (e.g. intent classifier prefers Groq speed)
  if (opts.preferModel) {
    const idx = MODELS.findIndex(m => m.id === opts.preferModel);
    if (idx !== -1) startIndex = idx;
  }

  for (let i = startIndex; i < MODELS.length; i++) {
    const model = MODELS[i];
    if (!model.available()) {
      errors.push(`${model.id}: API key not configured`);
      continue;
    }

    const modelName = model.name();

    try {
      const text = await withRetry(() =>
        model.call({
          modelName,
          systemPrompt: opts.systemPrompt,
          userMessage: opts.userMessage,
          conversationHistory: opts.conversationHistory || [],
          maxTokens,
          temperature,
          fileAttachment: opts.fileAttachment,
        })
      );

      if (i > startIndex) {
        console.info(`[llm_client] Fallback to ${model.id} (${modelName}) succeeded`);
      }

      return { text, model_used: modelName };

    } catch (err) {
      const errMsg = `${model.id} (${modelName}): ${err.message}`;
      errors.push(errMsg);
      console.warn(`[llm_client] ${errMsg}`);
    }
  }

  // All fallbacks exhausted
  const detail = errors.join(' | ');
  console.error(`[llm_client] All LLM fallbacks failed: ${detail}`);
  throw new Error(`All LLM providers failed: ${detail}`);
}

/**
 * Convenience: call Groq specifically for fast classification tasks.
 * Uses `preferModel: 'groq-8b'` for <200ms response.
 */
async function callLLMFast(opts) {
  return callLLM({ ...opts, preferModel: 'groq-8b', maxTokens: opts.maxTokens ?? 500 });
}

module.exports = { callLLM, callLLMFast, callGemini, callGroq };
