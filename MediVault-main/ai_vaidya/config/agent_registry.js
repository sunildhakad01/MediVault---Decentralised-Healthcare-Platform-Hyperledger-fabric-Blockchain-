// AI-Vaidya — agent_registry.js | MediVault Platform
// ====================================================
// Maps agent name strings → agent handler modules.
// The orchestrator uses this to dispatch queries to the correct agent.
// To add a new agent: import it and add an entry below.

const generalHealthAgent = require('../agents/general_health_agent');
const clinicalDecisionAgent = require('../agents/clinical_decision_agent');
const drugSafetyAgent = require('../agents/drug_safety_agent');
const researchAgent = require('../agents/research_agent');
const monitoringAgent = require('../agents/monitoring_agent');
const documentAnalysisAgent = require('../agents/document_analysis_agent');

const AGENT_REGISTRY = {
  general_health: generalHealthAgent,
  clinical_decision: clinicalDecisionAgent,
  drug_safety: drugSafetyAgent,
  research: researchAgent,
  monitoring: monitoringAgent,
  document_analysis: documentAnalysisAgent,
};

module.exports = AGENT_REGISTRY;
