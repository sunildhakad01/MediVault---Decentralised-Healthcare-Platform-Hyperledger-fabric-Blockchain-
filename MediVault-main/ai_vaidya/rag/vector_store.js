// AI-Vaidya — vector_store.js | MediVault Platform
// ==================================================
// In-memory vector store with JSON persistence.
// Uses cosine similarity for ranking.
// Persists to JSON file at VECTOR_DB_PATH.

const fs = require('fs');
const path = require('path');
const { getEmbedding, cosineSimilarity } = require('./embeddings');

const STORE_PATH = process.env.VECTOR_DB_PATH || './ai_vaidya/vector_store';
const STORE_FILE = path.join(STORE_PATH, 'store.json');

class VectorStore {
  constructor() {
    this.documents = []; // [{ id, content, embedding, metadata }]
    this._loaded = false;
  }

  /**
   * Load persisted store from disk (called lazily on first use).
   */
  _ensureLoaded() {
    if (this._loaded) return;
    this._loaded = true;
    try {
      if (fs.existsSync(STORE_FILE)) {
        const raw = fs.readFileSync(STORE_FILE, 'utf8');
        this.documents = JSON.parse(raw);
      }
    } catch (_) {
      this.documents = [];
    }
  }

  /**
   * Persist current store to disk (async, best-effort).
   */
  _persist() {
    try {
      fs.mkdirSync(STORE_PATH, { recursive: true });
      fs.writeFileSync(STORE_FILE, JSON.stringify(this.documents), 'utf8');
    } catch (err) {
      console.warn('[vector_store] Persist failed:', err.message);
    }
  }

  /**
   * Add documents to the store.
   * @param {Array<{ content: string, metadata: object }>} docs
   */
  async addDocuments(docs) {
    this._ensureLoaded();
    for (const doc of docs) {
      const embedding = await getEmbedding(doc.content);
      const id = `doc_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
      this.documents.push({ id, content: doc.content, embedding, metadata: doc.metadata || {} });
    }
    this._persist();
  }

  /**
   * Search by embedding similarity.
   * @param {number[]} queryEmbedding
   * @param {number} topK
   * @param {object} filter - { patient_id?, doc_type?, portal_id? }
   * @returns {Array<{ id, content, metadata, score }>}
   */
  search(queryEmbedding, topK = 5, filter = {}) {
    this._ensureLoaded();

    let candidates = this.documents;

    // Apply metadata filters
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

    // Score and rank
    const scored = candidates.map(doc => ({
      id: doc.id,
      content: doc.content,
      metadata: doc.metadata,
      score: cosineSimilarity(queryEmbedding, doc.embedding),
    }));

    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, topK);
  }

  /**
   * Delete all documents for a specific patient (for consent revocation).
   */
  deleteByPatient(patientId) {
    this._ensureLoaded();
    const before = this.documents.length;
    this.documents = this.documents.filter(d => d.metadata.patient_id !== patientId);
    if (this.documents.length !== before) this._persist();
  }

  /**
   * Get total document count.
   */
  count() {
    this._ensureLoaded();
    return this.documents.length;
  }
}

// Singleton instance shared across the app
const vectorStore = new VectorStore();

module.exports = { VectorStore, vectorStore };
