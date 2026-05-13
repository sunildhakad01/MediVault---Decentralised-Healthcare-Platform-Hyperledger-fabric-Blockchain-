const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

/**
 * MedicationReminder – stores per-medicine reminder schedules for patients.
 * Each row represents one medicine from an active prescription.
 */
const MedicationReminder = sequelize.define('MedicationReminder', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  patientId: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  patientUserId: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  prescriptionId: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  // Name of the medicine to remind about
  medicineName: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  // Frequency code from prescription (OD / BD / TDS / QID / SOS)
  frequency: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'OD',
  },
  // JSON array of "HH:MM" 24-h strings e.g. ["08:00","14:00","20:00"]
  reminderTimes: {
    type: DataTypes.JSON,
    allowNull: false,
    defaultValue: [],
  },
  active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
  // Optional note set by the patient
  note: {
    type: DataTypes.STRING,
    allowNull: true,
  },
}, {
  tableName: 'MedicationReminders',
  timestamps: true,
});

module.exports = MedicationReminder;
