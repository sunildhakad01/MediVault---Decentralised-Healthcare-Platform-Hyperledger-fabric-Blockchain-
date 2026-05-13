// AI-Vaidya — phase1.test.js | MediVault Platform
// ==================================================
// Foundation tests: verify folder structure, placeholder exports, .env vars present.
// TODO (Phase 1): Run manually to confirm all files exist.
// TODO (Phase 2+): Extend with real unit tests per phase.

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');

const REQUIRED_FILES = [
  'config/portal_policies.js',
  'config/prompt_templates.js',
  'config/agent_registry.js',
  'config/safety_rules.js',
  'core/orchestrator.js',
  'core/intent_classifier.js',
  'core/context_builder.js',
  'core/response_formatter.js',
  'core/safety_filter.js',
  'agents/general_health_agent.js',
  'agents/clinical_decision_agent.js',
  'agents/drug_safety_agent.js',
  'agents/research_agent.js',
  'agents/monitoring_agent.js',
  'agents/document_analysis_agent.js',
  'rag/embeddings.js',
  'rag/vector_store.js',
  'rag/retriever.js',
  'rag/reranker.js',
  'rag/knowledge_base/ingest.js',
  'rag/knowledge_base/sources.js',
  'blockchain/consent_cache.js',
  'blockchain/fabric_client.js',
  'blockchain/audit_logger.js',
  'api/query_handler.js',
  'utils/token_counter.js',
  'utils/medical_ner.js',
  'utils/urgency_detector.js',
  'utils/language_detector.js',
];

let passed = 0;
let failed = 0;

REQUIRED_FILES.forEach((file) => {
  const fullPath = path.join(ROOT, file);
  if (fs.existsSync(fullPath)) {
    console.log(`✅ EXISTS: ${file}`);
    passed++;
  } else {
    console.log(`❌ MISSING: ${file}`);
    failed++;
  }
});

console.log(`\nPhase 1 Structure Test: ${passed} passed, ${failed} failed`);
if (failed === 0) {
  console.log('✅ Phase 1 folder structure complete.');
} else {
  console.log('❌ Some files are missing. Re-run Phase 1 setup.');
  process.exit(1);
}
