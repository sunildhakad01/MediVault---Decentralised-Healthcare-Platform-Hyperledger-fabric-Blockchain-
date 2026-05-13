// AI-Vaidya — research_agent.js | MediVault Platform
// =====================================================
// Medical literature retrieval and summarisation.
// Covers: PubMed search, study summaries, guideline retrieval, comparative analysis.
// Used by: doctor, hospital portals.
// External APIs: PubMed E-utilities (free, no key required).

const { CORE_IDENTITY_PROMPT, PORTAL_PROMPTS, buildSessionContext } = require('../config/prompt_templates');
const { callLLM } = require('../core/llm_client');

const PUBMED_SEARCH_URL = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi';
const PUBMED_FETCH_URL = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi';
const PUBMED_SUMMARY_URL = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi';

// Cache PubMed results by query string (24-hour TTL)
const pubmedCache = new Map();
const PUBMED_CACHE_TTL_MS = 24 * 60 * 60 * 1000;

/**
 * Search PubMed and return top article IDs.
 */
async function searchPubMed(query, maxResults = 5) {
  const cacheKey = `search:${query.toLowerCase().trim()}`;
  const cached = pubmedCache.get(cacheKey);
  if (cached && Date.now() - cached.ts < PUBMED_CACHE_TTL_MS) return cached.data;

  const params = new URLSearchParams({
    db: 'pubmed',
    term: query,
    retmax: String(maxResults),
    retmode: 'json',
    sort: 'relevance',
  });

  const res = await fetch(`${PUBMED_SEARCH_URL}?${params}`, { signal: AbortSignal.timeout(10000) });
  if (!res.ok) throw new Error(`PubMed search failed: ${res.status}`);
  const json = await res.json();
  const ids = json?.esearchresult?.idlist || [];

  pubmedCache.set(cacheKey, { data: ids, ts: Date.now() });
  return ids;
}

/**
 * Fetch summaries for PubMed article IDs.
 */
async function fetchPubMedSummaries(ids) {
  if (!ids || ids.length === 0) return [];

  const cacheKey = `summary:${ids.join(',')}`;
  const cached = pubmedCache.get(cacheKey);
  if (cached && Date.now() - cached.ts < PUBMED_CACHE_TTL_MS) return cached.data;

  const params = new URLSearchParams({
    db: 'pubmed',
    id: ids.join(','),
    retmode: 'json',
  });

  const res = await fetch(`${PUBMED_SUMMARY_URL}?${params}`, { signal: AbortSignal.timeout(10000) });
  if (!res.ok) throw new Error(`PubMed fetch failed: ${res.status}`);
  const json = await res.json();

  const articles = [];
  for (const id of ids) {
    const doc = json?.result?.[id];
    if (!doc) continue;
    articles.push({
      pmid: id,
      title: doc.title || 'No title',
      authors: doc.authors?.map(a => a.name).slice(0, 3).join(', ') || 'Unknown authors',
      year: doc.pubdate?.split(' ')?.[0] || 'Unknown year',
      journal: doc.source || 'Unknown journal',
      abstract: doc.abstract || null,
    });
  }

  pubmedCache.set(cacheKey, { data: articles, ts: Date.now() });
  return articles;
}

function buildSystemPrompt(portalContext) {
  const portalId = portalContext.portal_id || 'doctor';
  const portalPrompt = PORTAL_PROMPTS[portalId] || PORTAL_PROMPTS.doctor;
  const sessionCtx = buildSessionContext(portalContext);
  return `${CORE_IDENTITY_PROMPT}\n\n${portalPrompt}\n\n${sessionCtx}`;
}

function buildUserPrompt(query, chunks, articles) {
  let prompt = '';

  if (articles && articles.length > 0) {
    prompt += `Retrieved from PubMed (${articles.length} articles):\n\n`;
    for (const art of articles) {
      prompt += `---\n`;
      prompt += `Title: ${art.title}\n`;
      prompt += `Authors: ${art.authors}\n`;
      prompt += `Year: ${art.year} | Journal: ${art.journal}\n`;
      if (art.abstract) prompt += `Abstract: ${art.abstract.slice(0, 600)}\n`;
      prompt += `PMID: ${art.pmid}\n\n`;
    }

    prompt += `Based on the above PubMed articles, please provide:\n`;
    prompt += `1. For each article: Title | Authors | Year | Study design (if identifiable) | Key finding | Clinical relevance\n`;
    prompt += `2. An overall evidence summary: strength of evidence, consistency across studies, clinical implications\n`;
    prompt += `3. Any important limitations or caveats\n\n`;
  } else {
    prompt += `PubMed search returned no results. Please answer based on current general medical knowledge and be explicit about evidence limitations.\n\n`;
  }

  if (chunks?.length > 0) {
    const ctx = chunks.map((c, i) => `[Ref ${i + 1}]: ${c.content}`).join('\n\n');
    prompt += `Additional knowledge base context:\n${ctx}\n\n`;
  }

  prompt += `Research query: ${query}`;
  return prompt;
}

async function run(query, chunks, patientContext, classification, portalContext) {
  // Search PubMed first
  let articles = [];
  try {
    const ids = await searchPubMed(query);
    if (ids.length > 0) {
      articles = await fetchPubMedSummaries(ids);
    }
  } catch (err) {
    // PubMed unavailable — continue without it, LLM will answer from general knowledge
    console.warn('[research_agent] PubMed unavailable:', err.message);
  }

  const systemPrompt = buildSystemPrompt(portalContext);
  const userPrompt = buildUserPrompt(query, chunks, articles);
  const history = portalContext.conversationHistory || [];
  return (await callLLM({ systemPrompt, userMessage: userPrompt, conversationHistory: history })).text;
}

module.exports = { run, buildSystemPrompt, buildUserPrompt, searchPubMed, fetchPubMedSummaries };
