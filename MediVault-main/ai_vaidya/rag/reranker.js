// AI-Vaidya — reranker.js | MediVault Platform
// ==============================================
// Cross-encoder reranking: selects top-5 from up to top-20 retrieved chunks.
// Primary: TF-IDF cosine similarity (fast, no quota usage).
// Optional: Gemini-based scoring (more accurate, uses quota).

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

// ─── TF-IDF cosine similarity reranker ───────────────────────────────────────

function tokenize(text) {
  return text.toLowerCase().split(/\W+/).filter(w => w.length > 2);
}

function buildTFVector(tokens, vocab) {
  const tf = {};
  for (const t of tokens) tf[t] = (tf[t] || 0) + 1;
  return vocab.map(v => (tf[v] || 0) / (tokens.length || 1));
}

function dotProduct(a, b) {
  return a.reduce((sum, val, i) => sum + val * b[i], 0);
}

function norm(a) {
  return Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
}

/**
 * TF-IDF cosine similarity between query and a chunk.
 */
function tfidfSimilarity(queryTokens, chunkTokens) {
  const vocab = [...new Set([...queryTokens, ...chunkTokens])];
  const qVec = buildTFVector(queryTokens, vocab);
  const cVec = buildTFVector(chunkTokens, vocab);
  const n = norm(qVec) * norm(cVec);
  return n === 0 ? 0 : dotProduct(qVec, cVec) / n;
}

/**
 * Fast TF-IDF-based reranker (no API calls).
 */
function tfidfRerank(query, chunks, topK = 5) {
  const queryTokens = tokenize(query);

  const scored = chunks.map(chunk => {
    const chunkTokens = tokenize(chunk.content);
    return { ...chunk, rerank_score: tfidfSimilarity(queryTokens, chunkTokens) };
  });

  scored.sort((a, b) => b.rerank_score - a.rerank_score);
  return scored.slice(0, topK);
}

// ─── Optional Gemini-based reranker ──────────────────────────────────────────

/**
 * Score a single chunk's relevance to the query using Gemini (0-1 float).
 * Used as fallback when TF-IDF score is ambiguous.
 */
async function geminiScoreChunk(query, chunkContent, apiKey) {
  const prompt = `Rate the relevance of the following medical text to this query on a scale of 0.0 to 1.0.
Query: "${query}"
Text: "${chunkContent.slice(0, 400)}"
Respond with ONLY a decimal number between 0.0 and 1.0. No other text.`;

  try {
    const res = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: { maxOutputTokens: 10, temperature: 0 },
      }),
      signal: AbortSignal.timeout(5000),
    });

    if (!res.ok) return 0.5;
    const data = await res.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '0.5';
    const score = parseFloat(text);
    return isNaN(score) ? 0.5 : Math.min(1, Math.max(0, score));
  } catch (_) {
    return 0.5;
  }
}

// ─── Main reranker ────────────────────────────────────────────────────────────

/**
 * Rerank chunks and return top-K with a confidence level.
 * @param {string} query
 * @param {Array} chunks - Up to 20 chunks from retriever
 * @param {number} topK - How many to return (default 5)
 * @param {boolean} useGemini - Whether to use Gemini scoring (quota-aware)
 * @returns {{ chunks: Array, retrieval_confidence: 'high'|'medium'|'low' }}
 */
async function rerank(query, chunks, topK = 5, useGemini = false) {
  if (!chunks || chunks.length === 0) {
    return { chunks: [], retrieval_confidence: 'low' };
  }

  let reranked;

  if (useGemini && process.env.GEMINI_API_KEY) {
    // Gemini-based scoring for top 10 chunks only (quota-conscious)
    const candidates = chunks.slice(0, 10);
    const apiKey = process.env.GEMINI_API_KEY;

    const scored = await Promise.all(
      candidates.map(async chunk => ({
        ...chunk,
        rerank_score: await geminiScoreChunk(query, chunk.content, apiKey),
      }))
    );
    scored.sort((a, b) => b.rerank_score - a.rerank_score);
    reranked = scored.slice(0, topK);
  } else {
    // Fast TF-IDF reranker
    reranked = tfidfRerank(query, chunks, topK);
  }

  // Determine retrieval confidence from top chunk score
  const topScore = reranked[0]?.rerank_score ?? 0;
  let retrieval_confidence;
  if (topScore >= 0.7) retrieval_confidence = 'high';
  else if (topScore >= 0.4) retrieval_confidence = 'medium';
  else retrieval_confidence = 'low';

  return { chunks: reranked, retrieval_confidence };
}

module.exports = { rerank, tfidfRerank };
