// lib/migrations.js — run once on server startup to create tables
const { query } = require('./db');

async function runMigrations() {
  await query(`
    CREATE TABLE IF NOT EXISTS sequences (
      name    TEXT PRIMARY KEY,
      value   INTEGER NOT NULL DEFAULT 0
    );
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS doctors (
      id                        TEXT PRIMARY KEY,
      user_id                   TEXT,
      full_name                 TEXT NOT NULL DEFAULT '',
      email                     TEXT NOT NULL DEFAULT '',
      phone                     TEXT NOT NULL DEFAULT '',
      specialization            TEXT NOT NULL DEFAULT '',
      degree                    TEXT NOT NULL DEFAULT '',
      medical_council_reg_no    TEXT NOT NULL DEFAULT '',
      medical_council           TEXT NOT NULL DEFAULT '',
      experience_years          INTEGER NOT NULL DEFAULT 0,
      consultation_fee          NUMERIC NOT NULL DEFAULT 0,
      languages_spoken          JSONB NOT NULL DEFAULT '[]',
      bio                       TEXT NOT NULL DEFAULT '',
      hospital_id               TEXT,
      hospital_name             TEXT NOT NULL DEFAULT '',
      clinic_name               TEXT NOT NULL DEFAULT '',
      clinic_address            TEXT NOT NULL DEFAULT '',
      clinic_city               TEXT NOT NULL DEFAULT '',
      clinic_state              TEXT NOT NULL DEFAULT '',
      is_approved               BOOLEAN NOT NULL DEFAULT FALSE,
      is_active                 BOOLEAN NOT NULL DEFAULT TRUE,
      appointment_count         INTEGER NOT NULL DEFAULT 0,
      successful_treatment_count INTEGER NOT NULL DEFAULT 0,
      source                    TEXT NOT NULL DEFAULT 'self',
      created_at                TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS patients (
      id                TEXT PRIMARY KEY,
      user_id           TEXT,
      full_name         TEXT NOT NULL DEFAULT '',
      email             TEXT NOT NULL DEFAULT '',
      phone             TEXT NOT NULL DEFAULT '',
      dob               TEXT NOT NULL DEFAULT '',
      gender            TEXT NOT NULL DEFAULT '',
      blood_group       TEXT NOT NULL DEFAULT '',
      address           TEXT NOT NULL DEFAULT '',
      city              TEXT NOT NULL DEFAULT '',
      state             TEXT NOT NULL DEFAULT '',
      pincode           TEXT NOT NULL DEFAULT '',
      aadhaar_last4     TEXT NOT NULL DEFAULT '',
      emergency_contact JSONB NOT NULL DEFAULT '{}',
      is_active         BOOLEAN NOT NULL DEFAULT TRUE,
      created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS hospitals (
      id                  TEXT PRIMARY KEY,
      name                TEXT NOT NULL DEFAULT '',
      hospital_type       TEXT NOT NULL DEFAULT '',
      registration_number TEXT NOT NULL DEFAULT '',
      email               TEXT NOT NULL DEFAULT '',
      phone               TEXT NOT NULL DEFAULT '',
      address_line1       TEXT NOT NULL DEFAULT '',
      address_line2       TEXT NOT NULL DEFAULT '',
      city                TEXT NOT NULL DEFAULT '',
      state               TEXT NOT NULL DEFAULT '',
      pincode             TEXT NOT NULL DEFAULT '',
      admin_user_id       TEXT,
      admin_name          TEXT NOT NULL DEFAULT '',
      admin_email         TEXT NOT NULL DEFAULT '',
      documents           JSONB NOT NULL DEFAULT '[]',
      status              TEXT NOT NULL DEFAULT 'pending',
      is_approved         BOOLEAN NOT NULL DEFAULT FALSE,
      submitted_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS appointments (
      id               TEXT PRIMARY KEY,
      doctor_id        TEXT NOT NULL DEFAULT '',
      patient_id       TEXT NOT NULL DEFAULT '',
      patient_name     TEXT NOT NULL DEFAULT '',
      patient_phone    TEXT NOT NULL DEFAULT '',
      patient_email    TEXT NOT NULL DEFAULT '',
      date             TEXT NOT NULL DEFAULT '',
      time_slot_start  TEXT NOT NULL DEFAULT '09:00',
      time_slot_end    TEXT NOT NULL DEFAULT '09:30',
      token_number     INTEGER NOT NULL DEFAULT 0,
      reason           TEXT NOT NULL DEFAULT '',
      condition        TEXT NOT NULL DEFAULT '',
      message          TEXT NOT NULL DEFAULT '',
      status           TEXT NOT NULL DEFAULT 'scheduled',
      consultation_note TEXT,
      fabric_tx_id     TEXT,
      created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS prescriptions (
      id              TEXT PRIMARY KEY,
      patient_id      TEXT NOT NULL DEFAULT '',
      patient_name    TEXT NOT NULL DEFAULT '',
      patient_age     TEXT NOT NULL DEFAULT '',
      patient_gender  TEXT NOT NULL DEFAULT '',
      patient_blood   TEXT NOT NULL DEFAULT '',
      doctor_id       TEXT NOT NULL DEFAULT '',
      appointment_id  TEXT,
      medicines       JSONB NOT NULL DEFAULT '[]',
      diagnosis       TEXT NOT NULL DEFAULT '',
      notes           TEXT NOT NULL DEFAULT '',
      follow_up_date  TEXT,
      date            TEXT NOT NULL DEFAULT '',
      created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  console.log('[MediVault] PostgreSQL migrations complete');
}

module.exports = { runMigrations };
