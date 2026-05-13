// AI-Vaidya — sources.js | MediVault Platform
// =============================================
// Knowledge source definitions and initial seeding.
// Run: node ai_vaidya/rag/knowledge_base/sources.js
// Estimated first-run time: 20-30 minutes.

const { ingestText } = require('./ingest');

// ─── Knowledge sources ────────────────────────────────────────────────────────

const KNOWLEDGE_SOURCES = [
  {
    id: 'lab_reference_ranges_india',
    name: 'Indian Population Lab Reference Ranges',
    type: 'inline',
    doc_type: 'guideline',
    content: `# Common Lab Reference Ranges (Indian Adult Population)

## Complete Blood Count (CBC)
- Haemoglobin (Hb): Men 13.0–17.0 g/dL | Women 12.0–15.0 g/dL (ICMR India)
- RBC Count: Men 4.5–5.5 million/µL | Women 4.0–5.0 million/µL
- WBC (Total Leukocytes): 4,000–11,000 cells/µL
  - Neutrophils: 40–70%
  - Lymphocytes: 20–40%
  - Monocytes: 2–8%
  - Eosinophils: 1–4%
  - Basophils: 0–1%
- Platelets: 150,000–400,000/µL
- MCV: 80–100 fL | MCH: 27–32 pg | MCHC: 32–36 g/dL
- PCV/Haematocrit: Men 40–50% | Women 36–46%

## Blood Glucose
- Fasting Plasma Glucose (FPG): Normal <100 mg/dL | Prediabetes 100–125 mg/dL | Diabetes ≥126 mg/dL
- Post-prandial (2h): Normal <140 mg/dL | Prediabetes 140–199 mg/dL | Diabetes ≥200 mg/dL
- HbA1c: Normal <5.7% | Prediabetes 5.7–6.4% | Diabetes ≥6.5% | Target for diabetics <7.0%
- Random blood glucose: Diabetes suspected if ≥200 mg/dL with symptoms

## Lipid Profile
- Total Cholesterol: Desirable <200 mg/dL | Borderline 200–239 | High ≥240
- LDL Cholesterol: Optimal <100 mg/dL | Near-optimal 100–129 | Borderline 130–159 | High 160–189 | Very high ≥190
- HDL Cholesterol: Low risk ≥60 mg/dL | Low (risk factor): Men <40 | Women <50
- Triglycerides: Normal <150 mg/dL | Borderline 150–199 | High 200–499 | Very high ≥500
- Non-HDL Cholesterol: Target <130 mg/dL (for high-risk patients)

## Liver Function Tests (LFT)
- ALT (SGPT): 7–56 U/L
- AST (SGOT): 10–40 U/L
- Alkaline Phosphatase (ALP): 44–147 U/L
- Gamma-GT (GGT): Men 8–61 U/L | Women 5–36 U/L
- Total Bilirubin: 0.2–1.2 mg/dL | Direct: 0–0.3 mg/dL | Indirect: 0.2–0.9 mg/dL
- Total Protein: 6.0–8.3 g/dL | Albumin: 3.5–5.0 g/dL | Globulin: 2.0–3.5 g/dL

## Kidney Function Tests (KFT/RFT)
- Serum Creatinine: Men 0.7–1.2 mg/dL | Women 0.6–1.1 mg/dL
- Blood Urea Nitrogen (BUN): 7–20 mg/dL | Urea: 15–40 mg/dL
- eGFR: ≥90 Normal | 60–89 Mildly reduced | 45–59 Mild-moderate decrease | 30–44 Moderate-severe | 15–29 Severe | <15 Kidney failure
- Uric Acid: Men 3.5–7.2 mg/dL | Women 2.6–6.0 mg/dL
- Sodium: 135–145 mEq/L | Potassium: 3.5–5.1 mEq/L | Chloride: 98–107 mEq/L
- Bicarbonate: 22–29 mEq/L | Calcium: 8.6–10.2 mg/dL

## Thyroid Function Tests
- TSH: 0.4–4.0 mIU/L (subclinical hypothyroidism if 4–10, hypothyroidism if >10)
- Free T4 (FT4): 0.8–1.8 ng/dL | Total T4: 5.0–12.0 µg/dL
- Free T3 (FT3): 2.3–4.2 pg/mL | Total T3: 80–200 ng/dL
- Anti-TPO antibodies: <35 IU/mL (elevated suggests autoimmune thyroid disease)

## Coagulation
- PT (Prothrombin Time): 11–13.5 seconds | INR: 0.8–1.2 (therapeutic range for anticoagulation: 2–3)
- aPTT: 25–35 seconds
- D-Dimer: <0.5 µg/mL FEU

## Cardiac Markers
- Troponin I (high-sensitivity): <0.04 ng/mL (lab-specific cutoffs vary)
- CK-MB: <5% of total CK | <25 U/L
- BNP: <100 pg/mL (heart failure unlikely) | >400 pg/mL (heart failure likely)
- NT-proBNP: <125 pg/mL (<75 years) | <450 pg/mL (≥75 years)

## Inflammatory Markers
- CRP (C-Reactive Protein): <5 mg/L (high-sensitivity: <1.0 low CV risk, 1–3 average, >3 high risk)
- ESR: Men <15 mm/hr (increases with age: age/2) | Women <20 mm/hr (age+10/2)
- Ferritin: Men 20–250 ng/mL | Women 10–120 ng/mL
- Serum Iron: Men 60–170 µg/dL | Women 50–170 µg/dL | TIBC: 250–370 µg/dL
`,
  },

  {
    id: 'indian_immunization_schedule',
    name: 'Indian National Immunization Schedule (NIS)',
    type: 'inline',
    doc_type: 'guideline',
    content: `# National Immunization Schedule — India (Ministry of Health & Family Welfare)

## At Birth
- BCG: 0.1 mL intradermal (left upper arm) — protects against tuberculosis
- OPV-0 (Zero dose): 2 drops oral
- Hepatitis B (Birth dose): 0.5 mL IM — given within 24 hours

## 6 Weeks (1.5 months)
- OPV-1, DPT-1 (Diphtheria, Pertussis, Tetanus)
- Hepatitis B-2
- Hib-1 (Haemophilus influenzae type b)
- PCV-1 (Pneumococcal Conjugate Vaccine)
- Rotavirus-1

## 10 Weeks (2.5 months)
- OPV-2, DPT-2, Hepatitis B-3, Hib-2, PCV-2, Rotavirus-2

## 14 Weeks (3.5 months)
- OPV-3, DPT-3, Hepatitis B-4, Hib-3, PCV-3, Rotavirus-3
- IPV-1 (Inactivated Polio Vaccine)

## 6 Months
- Hepatitis B-4 (if birth dose not given)

## 9 Months
- Measles-Rubella (MR-1) vaccine
- Vitamin A first dose (100,000 IU)

## 12 Months
- Hepatitis A-1 (in select states/private)

## 15–18 Months
- DPT Booster-1 | OPV Booster | MR-2 | PCV Booster
- Vitamin A second dose (200,000 IU) — continued every 6 months until 5 years

## 2 Years
- Typhoid Conjugate Vaccine (TCV) booster

## 5 Years
- DPT Booster-2

## 10 Years & 16 Years
- Td (Tetanus-diphtheria) booster

## Adult Vaccination Recommendations (India)
- Influenza: Annual, especially for elderly (>60), healthcare workers, chronic disease patients
- Hepatitis B: 3-dose series if not previously vaccinated
- Pneumococcal (PPSV23/PCV13): Adults >65, or chronic lung/heart/kidney disease, immunocompromised
- Tetanus-diphtheria (Td): Booster every 10 years
- COVID-19: Per current NTAGI guidelines
- Hepatitis A: 2-dose series for at-risk adults
- HPV: Recommended for girls/women 9–26 years (Gardasil/Cervarix)
- Meningococcal: Pilgrims, students in hostels, travel to endemic areas
`,
  },

  {
    id: 'diabetes_management_india',
    name: 'Type 2 Diabetes Management — ICMR/RSSDI Guidelines India',
    type: 'inline',
    doc_type: 'guideline',
    content: `# Type 2 Diabetes Management — India (ICMR/RSSDI Guidelines)

## Diagnostic Criteria (ADA/WHO)
- FPG ≥126 mg/dL on two occasions, OR
- 2-hour plasma glucose ≥200 mg/dL during OGTT, OR
- HbA1c ≥6.5% on two occasions, OR
- Random glucose ≥200 mg/dL with classic symptoms

## Glycaemic Targets (ICMR India)
- HbA1c: <7.0% for most patients | <7.5–8% for elderly/fragile | <6.5% if achievable without hypoglycaemia
- Fasting glucose: 80–130 mg/dL
- Post-prandial (2h): <180 mg/dL
- Self-monitoring frequency: Twice daily for insulin users; 1–2/week for diet/oral therapy

## First-Line Treatment (T2DM)
1. Lifestyle modification: Medical nutrition therapy + 150 min/week moderate physical activity
2. Metformin: First-line pharmacotherapy if no contraindications (eGFR ≥30)
   - Start 500 mg OD/BD with meals, titrate to 2000 mg/day
   - Contraindicated: eGFR <30, hepatic failure, contrast procedures
3. If HbA1c >9% at diagnosis: Start dual therapy or insulin

## Second-Line Agents (when metformin insufficient)
- SGLT2 inhibitors (empagliflozin, dapagliflozin, canagliflozin): Preferred if HF or CKD
- GLP-1 receptor agonists (liraglutide, semaglutide): Preferred if CV disease, obesity
- DPP-4 inhibitors (sitagliptin, vildagliptin): Well-tolerated, neutral on weight, renal-dose adjustment
- Sulfonylureas (glipizide, gliclazide, glimepiride): Low cost, risk of hypoglycaemia
- Thiazolidinediones (pioglitazone): Avoid in heart failure, osteoporosis
- Insulin: Required for HbA1c >10%, severe hyperglycaemia, pregnancy, organ failure

## HbA1c-Based Escalation
- <7.5%: Continue current + lifestyle reinforcement
- 7.5–9%: Add second agent
- >9%: Dual/triple therapy or insulin

## Complication Screening (Annual)
- Eyes: Dilated fundoscopy (diabetic retinopathy)
- Kidneys: Urine microalbumin/creatinine ratio + eGFR
- Feet: Monofilament test, ABI (peripheral artery disease)
- Cardiovascular: ECG, BP, lipids
- Neuropathy: Symptom assessment + vibration sense

## BP Target in Diabetes: <130/80 mmHg (ACE inhibitor/ARB preferred)
## Lipid Target in Diabetes: LDL <70 mg/dL if high CV risk; statin therapy recommended for all T2DM >40 years
`,
  },

  {
    id: 'hypertension_india',
    name: 'Hypertension Management — India Guidelines',
    type: 'inline',
    doc_type: 'guideline',
    content: `# Hypertension Management — India (CSI/ISH Guidelines)

## Classification (2023)
- Normal: <120/80 mmHg
- Elevated BP: 120–129/<80 mmHg
- Stage 1 HTN: 130–139/80–89 mmHg
- Stage 2 HTN: ≥140/≥90 mmHg
- Hypertensive Crisis: >180/120 mmHg

## Indian Population Notes
- High salt intake (average 8–10 g/day vs. WHO target <5 g/day)
- Early onset, higher risk of stroke than CHD compared to Western populations
- Vegetarian diet may be protective

## Treatment Thresholds
- Start pharmacotherapy: Stage 2 or Stage 1 with CV risk factors/target organ damage
- Lifestyle only: Stage 1 without CV risk for 3–6 months trial

## First-Line Drugs (preferred in Indian context)
1. ACE inhibitors/ARBs: Ramipril, enalapril, telmisartan, losartan — preferred in diabetes, CKD, post-MI
2. Calcium Channel Blockers (CCBs): Amlodipine — preferred in elderly, isolated systolic HTN
3. Thiazide diuretics: Hydrochlorothiazide, indapamide — useful in combination
4. Beta-blockers: Atenolol, metoprolol — second-line unless angina, post-MI, tachyarrhythmia

## Combination Strategy
- Most patients need 2–3 drugs
- Preferred combinations: ACEi/ARB + CCB + diuretic (A+C+D)
- Single pill combinations improve adherence (e.g., telmisartan + amlodipine)
- Avoid ACEi + ARB combination (increased adverse effects, no benefit)

## BP Targets
- General: <130/80 mmHg (AHA/ACC 2017) or <140/90 mmHg (ESC 2018)
- Elderly ≥65 years: Systolic 130–139 mmHg (not lower — J-curve risk)
- Diabetes: <130/80 mmHg | CKD: <130/80 mmHg | Stroke history: <130/80 mmHg

## Lifestyle Modifications (DASH-style)
- Salt restriction: <5 g NaCl/day
- Weight loss: 1 mmHg per kg lost
- Exercise: 150 min/week moderate intensity
- Alcohol: ≤2 units/day (men), ≤1 unit/day (women)
- Smoking cessation: No direct BP effect, but reduces CV risk
- DASH diet: Fruits, vegetables, low-fat dairy, reduced saturated fat
`,
  },
];

// ─── Seeding function ─────────────────────────────────────────────────────────

/**
 * Ingest all built-in knowledge sources into the vector store.
 * Run once on initial setup (takes 20-30 min on free-tier HuggingFace).
 * Safe to re-run — existing documents are not duplicated (checked by source ID).
 */
async function ingestAllSources() {
  console.log('[sources] Starting knowledge base ingestion...');
  console.log(`[sources] ${KNOWLEDGE_SOURCES.length} sources to ingest.`);

  for (const source of KNOWLEDGE_SOURCES) {
    console.log(`[sources] Ingesting: ${source.name}`);
    try {
      await ingestText(source.content, {
        source: source.id,
        source_name: source.name,
        doc_type: source.doc_type,
      });
      console.log(`[sources] ✓ Done: ${source.name}`);
    } catch (err) {
      console.error(`[sources] ✗ Failed: ${source.name} — ${err.message}`);
    }
  }

  console.log('[sources] Knowledge base ingestion complete.');
}

// Allow running directly: node ai_vaidya/rag/knowledge_base/sources.js
if (require.main === module) {
  ingestAllSources().catch(console.error);
}

module.exports = { KNOWLEDGE_SOURCES, ingestAllSources };
