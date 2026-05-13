// AI-Vaidya — retriever.js | MediVault Platform
// ===============================================
// Hybrid search: dense (vector similarity) + sparse (TF-IDF keyword).
// Combines both with configurable weights.

const { getEmbedding } = require('./embeddings');
const { vectorStore } = require('./vector_store');

// ─── Sparse retrieval (TF-IDF BM25-style) ────────────────────────────────────

/**
 * Compute TF-IDF term frequency for a text.
 */
function computeTF(text) {
  const words = text.toLowerCase().split(/\W+/).filter(w => w.length > 2);
  const tf = {};
  for (const word of words) {
    tf[word] = (tf[word] || 0) + 1;
  }
  const total = words.length || 1;
  for (const word in tf) tf[word] /= total;
  return tf;
}

/**
 * Simple BM25-inspired sparse scoring.
 * Scores each document based on query term frequency overlap.
 */
function sparseScore(queryTerms, docText) {
  const docWords = docText.toLowerCase().split(/\W+/);
  const docFreq = {};
  for (const word of docWords) docFreq[word] = (docFreq[word] || 0) + 1;

  let score = 0;
  const k1 = 1.5;
  const b = 0.75;
  const avgDocLen = 200;
  const docLen = docWords.length;

  for (const term of queryTerms) {
    const tf = docFreq[term] || 0;
    if (tf > 0) {
      const idf = Math.log(1 + 1 / (tf + 0.5));
      const bm25 = idf * (tf * (k1 + 1)) / (tf + k1 * (1 - b + b * docLen / avgDocLen));
      score += bm25;
    }
  }
  return score;
}

/**
 * Dense retrieval using vector similarity.
 */
async function denseRetrieve(query, topK = 20, filter = {}) {
  const queryEmbedding = await getEmbedding(query);
  return vectorStore.search(queryEmbedding, topK, filter);
}

/**
 * Sparse (keyword) retrieval across all documents matching the filter.
 */
async function sparseRetrieve(query, topK = 20, filter = {}) {
  // Access the raw documents from the store
  vectorStore._ensureLoaded();
  let candidates = vectorStore.documents;

  // Apply same filters as dense
  if (filter.patient_id) {
    candidates = candidates.filter(d =>
      !d.metadata.patient_id || d.metadata.patient_id === filter.patient_id
    );
  }
  if (filter.doc_type) {
    candidates = candidates.filter(d =>
      !d.metadata.doc_type || d.metadata.doc_type === filter.doc_type
    );
  }

  const queryTerms = query.toLowerCase().split(/\W+/).filter(w => w.length > 2);

  const scored = candidates.map(doc => ({
    id: doc.id,
    content: doc.content,
    metadata: doc.metadata,
    score: sparseScore(queryTerms, doc.content),
  })).filter(d => d.score > 0);

  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, topK);
}

/**
 * Hybrid retrieval: combines dense + sparse scores.
 * @param {string} query
 * @param {number} topK - Final number of results to return
 * @param {object} weights - { dense: 0.6, sparse: 0.4 }
 * @param {object} filter - Metadata filters
 * @returns {Promise<Array>}
 */
async function hybridRetrieve(query, topK = 20, weights = { dense: 0.6, sparse: 0.4 }, filter = {}) {
  // If no documents in store, return empty
  if (vectorStore.count() === 0) return [];

  const [denseResults, sparseResults] = await Promise.all([
    denseRetrieve(query, topK * 2, filter).catch(() => []),
    sparseRetrieve(query, topK * 2, filter).catch(() => []),
  ]);

  // Merge by document ID with reciprocal rank fusion
  const scores = new Map();

  const addScores = (results, weight) => {
    const maxScore = results[0]?.score || 1;
    results.forEach((doc, rank) => {
      const normalizedScore = (doc.score / maxScore) * weight;
      const rrfScore = weight / (60 + rank + 1); // RRF
      const combined = normalizedScore * 0.5 + rrfScore * 0.5;
      const existing = scores.get(doc.id);
      if (existing) {
        existing.score += combined;
      } else {
        scores.set(doc.id, { ...doc, score: combined });
      }
    });
  };

  addScores(denseResults, weights.dense);
  addScores(sparseResults, weights.sparse);

  const merged = Array.from(scores.values());
  merged.sort((a, b) => b.score - a.score);
  return merged.slice(0, topK);
}

module.exports = { hybridRetrieve, denseRetrieve, sparseRetrieve };
