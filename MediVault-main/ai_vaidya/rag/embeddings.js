// AI-Vaidya — embeddings.js | MediVault Platform
// ================================================
// HuggingFace Inference API wrapper for medical embeddings.
// Model: pritamdeka/S-PubMedBert-MS-MARCO (free tier, medical domain)

const crypto = require('crypto');

const HF_API_URL = 'https://api-inference.huggingface.co/models/';
const EMBED_MODEL = process.env.AIVAIDYA_EMBED_MODEL || 'pritamdeka/S-PubMedBert-MS-MARCO';

// In-memory embedding cache: content hash → number[]
const embeddingCache = new Map();

function hashText(text) {
  return crypto.createHash('md5').update(text).digest('hex');
}

/**
 * Sleep utility for exponential backoff.
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Call HuggingFace Inference API with retry on 503 (model loading).
 */
async function callHuggingFace(inputs, retries = 3) {
  const apiKey = process.env.HUGGINGFACE_API_KEY;
  if (!apiKey) throw new Error('HUGGINGFACE_API_KEY not configured');

  const url = `${HF_API_URL}${EMBED_MODEL}`;

  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ inputs }),
        signal: AbortSignal.timeout(15000),
      });

      if (res.status === 503) {
        // Model is loading — wait and retry
        const waitMs = Math.pow(2, attempt) * 1000;
        console.warn(`[embeddings] HF model loading, retry in ${waitMs}ms`);
        await sleep(waitMs);
        continue;
      }

      if (!res.ok) {
        const err = await res.text();
        throw new Error(`HuggingFace API error ${res.status}: ${err}`);
      }

      return await res.json();
    } catch (err) {
      if (attempt === retries - 1) throw err;
      await sleep(Math.pow(2, attempt) * 500);
    }
  }
  throw new Error('HuggingFace API failed after retries');
}

/**
 * Get embedding for a single text string.
 * Returns a flat number[] vector.
 */
async function getEmbedding(text) {
  const hash = hashText(text);
  if (embeddingCache.has(hash)) return embeddingCache.get(hash);

  const result = await callHuggingFace(text);

  // HF returns: number[][] (one vector per token) or number[] (pooled)
  // For sentence transformers, it typically returns number[][]
  // We average to get a single pooled vector
  let vector;
  if (Array.isArray(result[0])) {
    // Token-level embeddings — mean pooling
    const numTokens = result.length;
    const dim = result[0].length;
    vector = new Array(dim).fill(0);
    for (const tokenVec of result) {
      for (let i = 0; i < dim; i++) vector[i] += tokenVec[i];
    }
    vector = vector.map(v => v / numTokens);
  } else {
    // Already pooled
    vector = result;
  }

  embeddingCache.set(hash, vector);
  return vector;
}

/**
 * Get embeddings for multiple texts (batched).
 * Returns number[][]
 */
async function getEmbeddings(texts) {
  const results = [];
  // HF Inference API processes one at a time for free tier
  for (const text of texts) {
    results.push(await getEmbedding(text));
  }
  return results;
}

/**
 * Cosine similarity between two vectors.
 */
function cosineSimilarity(a, b) {
  if (a.length !== b.length) return 0;
  let dot = 0, normA = 0, normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  const denom = Math.sqrt(normA) * Math.sqrt(normB);
  return denom === 0 ? 0 : dot / denom;
}

module.exports = { getEmbedding, getEmbeddings, cosineSimilarity };
