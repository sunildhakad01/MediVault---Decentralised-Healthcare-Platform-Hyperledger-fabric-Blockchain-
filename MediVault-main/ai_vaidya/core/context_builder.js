// AI-Vaidya — context_builder.js | MediVault Platform
// =====================================================
// Assembles patient/doctor context from the backend API.
// Calls the existing MediVault Express backend at NEXT_PUBLIC_API_URL.

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

/**
 * Fetch a resource from the MediVault backend.
 * Passes the user's JWT for authentication.
 */
async function backendFetch(path, token, options = {}) {
  const res = await fetch(`${API_URL}/api${path}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    signal: AbortSignal.timeout(10000),
    ...options,
  });

  if (res.status === 401) throw new Error('AUTH_EXPIRED');
  if (res.status === 403) throw new Error('ACCESS_DENIED');
  if (!res.ok) return null;

  return res.json();
}

/**
 * Build patient context for use in AI responses.
 * Queries the backend for the patient's current health data.
 *
 * @param {object} portalContext
 * @param {string[]} entities - Medical entities detected in the query
 * @returns {object|null} patientContext
 */
async function buildContext(portalContext, entities = []) {
  const { portal_id, patient_id, user_id, auth_token, data_scope } = portalContext;

  // Admin portal — no patient context
  if (portal_id === 'admin') return null;

  // If no patient ID, return minimal context
  if (!patient_id && portal_id === 'patient') {
    return buildMinimalContext(portalContext);
  }

  const targetPatientId = patient_id || user_id;
  if (!targetPatientId) return null;

  const ctx = {
    patient_id: targetPatientId,
    patient_name: null,
    patient_age: null,
    patient_gender: null,
    active_conditions: [],
    current_medications: [],
    allergies: [],
    recent_labs: null,
    vitals: null,
    baseline_stats: null,
    trend_data: {},
    available_records: [],
    renal_function: null,
    hepatic_function: null,
    doctor_speciality: portalContext.doctor_speciality || null,
    ward: portalContext.ward || null,
  };

  // Fetch patient profile
  try {
    const profilePath = portal_id === 'patient'
      ? '/patient/profile'
      : `/patient/${targetPatientId}/profile`;

    const profile = await backendFetch(profilePath, auth_token);
    if (profile) {
      ctx.patient_name = profile.name || profile.firstName || profile.fullName || null;
      ctx.patient_age = profile.age || (profile.dateOfBirth ? calculateAge(profile.dateOfBirth) : null);
      ctx.patient_gender = profile.gender || null;
    }
  } catch (_) { /* non-fatal */ }

  // Fetch active conditions / medical history
  try {
    const historyPath = portal_id === 'patient'
      ? '/patient/history'
      : `/patient/${targetPatientId}/history`;

    const history = await backendFetch(historyPath, auth_token);
    if (history?.conditions) ctx.active_conditions = normalizeConditions(history.conditions);
    if (history?.allergies) ctx.allergies = normalizeAllergies(history.allergies);
  } catch (_) { /* non-fatal */ }

  // Fetch current medications
  try {
    const rxPath = portal_id === 'patient'
      ? '/patient/prescriptions'
      : `/patient/${targetPatientId}/prescriptions`;

    const prescriptions = await backendFetch(rxPath, auth_token);
    if (prescriptions) ctx.current_medications = normalizeMedications(prescriptions);
  } catch (_) { /* non-fatal */ }

  // Fetch recent lab results (last 90 days)
  try {
    const labPath = portal_id === 'patient'
      ? '/patient/lab-reports'
      : `/patient/${targetPatientId}/lab-reports`;

    const labs = await backendFetch(labPath, auth_token);
    if (labs) {
      ctx.recent_labs = summarizeLabs(labs);
      ctx.available_records.push('lab_results');

      // Extract renal/hepatic function for drug dosing
      ctx.renal_function = extractRenalFunction(labs);
      ctx.hepatic_function = extractHepaticFunction(labs);
    }
  } catch (_) { /* non-fatal */ }

  // Fetch recent vitals
  try {
    const vitalsPath = portal_id === 'patient'
      ? '/patient/vitals'
      : `/patient/${targetPatientId}/vitals`;

    const vitals = await backendFetch(vitalsPath, auth_token);
    if (vitals) {
      ctx.vitals = normalizeVitals(vitals);
      ctx.available_records.push('vitals');
    }
  } catch (_) { /* non-fatal */ }

  return ctx;
}

// ─── Normalizers ─────────────────────────────────────────────────────────────

function calculateAge(dob) {
  const birth = new Date(dob);
  const now = new Date();
  const years = now.getFullYear() - birth.getFullYear();
  const m = now.getMonth() - birth.getMonth();
  return (m < 0 || (m === 0 && now.getDate() < birth.getDate())) ? years - 1 : years;
}

function normalizeConditions(conditions) {
  if (!conditions) return [];
  if (Array.isArray(conditions)) {
    return conditions
      .map(c => (typeof c === 'string' ? c : c.name || c.condition || c.diagnosis))
      .filter(Boolean)
      .slice(0, 10);
  }
  return [];
}

function normalizeAllergies(allergies) {
  if (!Array.isArray(allergies)) return [];
  return allergies.map(a => (typeof a === 'string' ? a : a.allergen || a.substance)).filter(Boolean);
}

function normalizeMedications(prescriptions) {
  const meds = [];
  const data = Array.isArray(prescriptions) ? prescriptions : prescriptions?.data || prescriptions?.prescriptions || [];

  for (const rx of data.slice(0, 20)) {
    const medicines = rx.medicines || rx.medications || (rx.medicine ? [rx.medicine] : []);
    for (const med of medicines) {
      meds.push({
        name: med.name || med.medicineName || med.drug_name,
        dose: med.dose || med.dosage,
        frequency: med.frequency || med.times_per_day,
        duration: med.duration,
        instructions: med.instructions || med.remarks,
        prescribed_date: rx.date || rx.createdAt,
        last_taken_at: med.last_taken_at || null,
        frequency_hours: parseFrequencyToHours(med.frequency),
      });
    }
  }
  return meds;
}

function parseFrequencyToHours(frequency) {
  if (!frequency) return null;
  const lower = (frequency || '').toLowerCase();
  if (/once.*day|od|qd|daily/.test(lower)) return 24;
  if (/twice.*day|bd|bid/.test(lower)) return 12;
  if (/three.*day|tds|tid/.test(lower)) return 8;
  if (/four.*day|qid/.test(lower)) return 6;
  if (/sos|as needed|prn/.test(lower)) return null;
  return null;
}

function summarizeLabs(labs) {
  const data = Array.isArray(labs) ? labs : labs?.data || labs?.reports || [];
  if (!data.length) return null;

  // Get most recent 5 reports
  const recent = data.slice(0, 5);
  const summary = {};

  for (const report of recent) {
    const tests = report.tests || report.results || report.parameters || [];
    for (const test of tests) {
      const name = test.name || test.test_name || test.parameter;
      const value = test.value || test.result;
      if (name && value !== undefined) {
        summary[name] = {
          value,
          unit: test.unit || '',
          reference_range: test.reference_range || test.normal_range || '',
          date: report.date || report.createdAt || '',
        };
      }
    }
  }
  return Object.keys(summary).length > 0 ? summary : null;
}

function normalizeVitals(vitals) {
  const data = Array.isArray(vitals) ? vitals : vitals?.data || [];
  if (!data.length) return null;

  const latest = data[0];
  return {
    systolic_bp: latest.systolicBP || latest.systolic || null,
    diastolic_bp: latest.diastolicBP || latest.diastolic || null,
    heart_rate: latest.heartRate || latest.pulse || null,
    spo2: latest.spo2 || latest.oxygen_saturation || null,
    temperature: latest.temperature || null,
    blood_glucose: latest.bloodGlucose || latest.glucose || null,
    date: latest.date || latest.createdAt || null,
  };
}

function extractRenalFunction(labs) {
  const data = Array.isArray(labs) ? labs : labs?.data || [];
  for (const report of data) {
    const tests = report.tests || report.results || report.parameters || [];
    const creatinine = tests.find(t => /creatinine/i.test(t.name || t.test_name));
    const egfr = tests.find(t => /egfr|gfr/i.test(t.name || t.test_name));
    if (creatinine || egfr) {
      return {
        creatinine: creatinine ? parseFloat(creatinine.value) : null,
        egfr: egfr ? parseFloat(egfr.value) : null,
        date: report.date || report.createdAt,
      };
    }
  }
  return null;
}

function extractHepaticFunction(labs) {
  const data = Array.isArray(labs) ? labs : labs?.data || [];
  for (const report of data) {
    const tests = report.tests || report.results || report.parameters || [];
    const alt = tests.find(t => /\balt\b|sgpt/i.test(t.name || t.test_name));
    const ast = tests.find(t => /\bast\b|sgot/i.test(t.name || t.test_name));
    if (alt || ast) {
      return {
        alt: alt ? parseFloat(alt.value) : null,
        ast: ast ? parseFloat(ast.value) : null,
        date: report.date || report.createdAt,
      };
    }
  }
  return null;
}

function buildMinimalContext(portalContext) {
  return {
    patient_id: portalContext.user_id || null,
    patient_name: portalContext.user_name || null,
    active_conditions: [],
    current_medications: [],
    allergies: [],
    recent_labs: null,
    vitals: null,
    available_records: [],
  };
}

module.exports = { buildContext };
