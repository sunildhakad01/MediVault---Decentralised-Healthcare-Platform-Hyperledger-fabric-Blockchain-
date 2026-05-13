// AI-Vaidya — monitoring_agent.js | MediVault Platform
// =======================================================
// Patient monitoring, adherence tracking, alerts, and trend analysis.
// Covers: missed medications, vital anomalies, trend detection, alert generation.
// Used by: patient (own data), hospital (ward-level) portals.
// LLM: Gemini 2.0 Flash — used only for the final human-readable summary.

const { CORE_IDENTITY_PROMPT, PORTAL_PROMPTS, buildSessionContext } = require('../config/prompt_templates');
const { callLLM } = require('../core/llm_client');

// ─── Rule-based logic (no LLM) ───────────────────────────────────────────────

/**
 * Check medication adherence.
 * Returns an alert object if a dose is overdue.
 */
function checkAdherence(medications) {
  const alerts = [];
  if (!medications || medications.length === 0) return alerts;

  const now = Date.now();
  for (const med of medications) {
    const { name, frequency_hours, last_taken_at } = med;
    if (!frequency_hours || !last_taken_at) continue;

    const lastTakenMs = new Date(last_taken_at).getTime();
    const hoursElapsed = (now - lastTakenMs) / (1000 * 60 * 60);
    const hoursOverdue = hoursElapsed - frequency_hours;

    if (hoursOverdue > 0) {
      let severity = 'low';
      if (hoursOverdue > frequency_hours) severity = 'high';
      else if (hoursOverdue > frequency_hours * 0.5) severity = 'medium';

      alerts.push({
        type: 'adherence',
        severity,
        medication: name,
        hours_overdue: Math.round(hoursOverdue * 10) / 10,
        message: `${name} dose is ${Math.round(hoursOverdue)} hour(s) overdue.`,
        recommended_action: severity === 'high'
          ? `Contact patient/caregiver immediately regarding missed ${name} dose.`
          : `Remind patient to take their ${name} dose.`,
      });
    }
  }
  return alerts;
}

/**
 * Z-score vital anomaly detection against the patient's own 30-day baseline.
 */
function detectVitalAnomalies(currentVitals, baselineStats) {
  const alerts = [];
  if (!currentVitals || !baselineStats) return alerts;

  const vitalRanges = {
    systolic_bp: { low: 90, high: 180, unit: 'mmHg', name: 'Systolic BP' },
    diastolic_bp: { low: 60, high: 120, unit: 'mmHg', name: 'Diastolic BP' },
    heart_rate: { low: 40, high: 120, unit: 'bpm', name: 'Heart Rate' },
    spo2: { low: 92, high: 100, unit: '%', name: 'SpO2' },
    temperature: { low: 36.0, high: 38.5, unit: '°C', name: 'Temperature' },
    blood_glucose: { low: 70, high: 250, unit: 'mg/dL', name: 'Blood Glucose' },
  };

  for (const [key, val] of Object.entries(currentVitals)) {
    const range = vitalRanges[key];
    if (!range) continue;

    // Absolute range check
    if (val < range.low || val > range.high) {
      const direction = val < range.low ? 'low' : 'high';
      const severity = Math.abs(val - (direction === 'low' ? range.low : range.high)) > 20 ? 'high' : 'medium';
      alerts.push({
        type: 'vital_anomaly',
        severity,
        vital: key,
        value: val,
        unit: range.unit,
        direction,
        message: `${range.name} is ${direction}: ${val} ${range.unit} (normal: ${range.low}–${range.high} ${range.unit})`,
        recommended_action: severity === 'high'
          ? `Immediate clinical review for abnormal ${range.name}.`
          : `Monitor ${range.name} closely and review if persistent.`,
      });
      continue;
    }

    // Z-score against patient's personal baseline (if available)
    const stats = baselineStats[key];
    if (stats?.mean && stats?.std && stats.std > 0) {
      const z = Math.abs((val - stats.mean) / stats.std);
      if (z > 3) {
        alerts.push({
          type: 'vital_trend_anomaly',
          severity: 'medium',
          vital: key,
          value: val,
          unit: range.unit,
          z_score: Math.round(z * 10) / 10,
          message: `${range.name} is unusually ${val > stats.mean ? 'high' : 'low'} compared to this patient's recent baseline (z=${z.toFixed(1)}).`,
          recommended_action: `Review recent changes for ${range.name} deviation from personal baseline.`,
        });
      }
    }
  }
  return alerts;
}

/**
 * Simple linear regression direction for trend analysis.
 * Returns: 'improving' | 'worsening' | 'stable' | 'insufficient_data'
 */
function analyzeTrend(readings, isHigherBetter = false) {
  if (!readings || readings.length < 3) return 'insufficient_data';

  const n = readings.length;
  const xs = readings.map((_, i) => i);
  const ys = readings.map(r => r.value);

  const sumX = xs.reduce((a, b) => a + b, 0);
  const sumY = ys.reduce((a, b) => a + b, 0);
  const sumXY = xs.reduce((acc, x, i) => acc + x * ys[i], 0);
  const sumX2 = xs.reduce((acc, x) => acc + x * x, 0);

  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);

  const threshold = 0.05; // 5% per reading = significant trend
  const relSlope = Math.abs(slope) / (sumY / n);

  if (relSlope < threshold) return 'stable';
  if (isHigherBetter) return slope > 0 ? 'improving' : 'worsening';
  return slope < 0 ? 'improving' : 'worsening';
}

// ─── LLM summary ─────────────────────────────────────────────────────────────

function buildSystemPrompt(portalContext) {
  const portalId = portalContext.portal_id || 'patient';
  const portalPrompt = PORTAL_PROMPTS[portalId] || PORTAL_PROMPTS.patient;
  const sessionCtx = buildSessionContext(portalContext);
  return `${CORE_IDENTITY_PROMPT}\n\n${portalPrompt}\n\n${sessionCtx}`;
}

async function run(query, chunks, patientContext, classification, portalContext) {
  const isHospital = portalContext.portal_id === 'hospital';
  const alerts = [];

  // Adherence check
  if (patientContext?.current_medications) {
    const adherenceAlerts = checkAdherence(patientContext.current_medications);
    alerts.push(...adherenceAlerts);
  }

  // Vital anomaly detection
  if (patientContext?.current_vitals && patientContext?.baseline_stats) {
    const vitalAlerts = detectVitalAnomalies(patientContext.current_vitals, patientContext.baseline_stats);
    alerts.push(...vitalAlerts);
  }

  // Trend analysis for key metrics
  const trends = {};
  const trendMetrics = [
    { key: 'blood_glucose', isHigherBetter: false },
    { key: 'systolic_bp', isHigherBetter: false },
    { key: 'hba1c', isHigherBetter: false },
    { key: 'spo2', isHigherBetter: true },
  ];
  for (const { key, isHigherBetter } of trendMetrics) {
    if (patientContext?.trend_data?.[key]?.length >= 3) {
      trends[key] = analyzeTrend(patientContext.trend_data[key], isHigherBetter);
    }
  }

  // Build LLM prompt for human-readable summary
  const systemPrompt = buildSystemPrompt(portalContext);
  let userPrompt = `Query: ${query}\n\n`;

  if (alerts.length > 0) {
    userPrompt += `Rule-based alerts detected:\n`;
    for (const alert of alerts) {
      const icon = alert.severity === 'high' ? '🔴' : alert.severity === 'medium' ? '🟠' : '🟡';
      userPrompt += `${icon} [${alert.severity.toUpperCase()}] ${alert.message} — ${alert.recommended_action}\n`;
    }
    userPrompt += '\n';
  } else {
    userPrompt += 'No critical alerts detected from rule-based checks.\n\n';
  }

  if (Object.keys(trends).length > 0) {
    userPrompt += 'Trend analysis:\n';
    for (const [metric, trend] of Object.entries(trends)) {
      const icon = trend === 'improving' ? '✅' : trend === 'worsening' ? '⚠️' : '➡️';
      userPrompt += `${icon} ${metric.replace(/_/g, ' ')}: ${trend}\n`;
    }
    userPrompt += '\n';
  }

  if (isHospital) {
    userPrompt += 'Please generate a ward-level monitoring summary suitable for clinical staff. Use structured table format if listing multiple patients.';
  } else {
    userPrompt += 'Please generate a patient-friendly summary of their monitoring status, adherence, and any areas needing attention.';
  }

  return (await callLLM({ systemPrompt, userMessage: userPrompt })).text;
}

module.exports = { run, checkAdherence, detectVitalAnomalies, analyzeTrend };
