// AI-Vaidya — token_counter.js | MediVault Platform
// ====================================================
// Token estimation and conversation history trimming to prevent context overflow.

/**
 * Rough token count estimate.
 * 1 token ≈ 4 chars (English) | 1 token ≈ 3 chars (Hindi/Devanagari)
 */
function countTokens(text) {
  if (!text) return 0;
  const hasDevanagari = /[\u0900-\u097F]/.test(text);
  const charsPerToken = hasDevanagari ? 3 : 4;
  return Math.ceil(text.length / charsPerToken);
}

/**
 * Trim conversation history to fit within a token budget.
 * Removes oldest turns first, always preserving the last 2 turns.
 * @param {Array<{role: string, content: string}>} history
 * @param {number} maxTokens
 * @returns {Array}
 */
function trimConversationHistory(history, maxTokens = 6000) {
  if (!history || history.length === 0) return [];

  let trimmed = [...history];

  // Always keep at least the last 2 turns
  while (trimmed.length > 2) {
    const totalTokens = trimmed.reduce((sum, turn) => sum + countTokens(turn.content || ''), 0);
    if (totalTokens <= maxTokens) break;
    trimmed = trimmed.slice(1); // Remove oldest turn
  }

  return trimmed;
}

module.exports = { countTokens, trimConversationHistory };
