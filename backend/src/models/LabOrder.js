const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const LabOrder = sequelize.define('LabOrder', {
  id: { type: DataTypes.STRING, primaryKey: true },
  appointmentId: { type: DataTypes.STRING, allowNull: true },
  patientId: { type: DataTypes.STRING, allowNull: false },
  doctorId: { type: DataTypes.STRING, allowNull: false },
  hospitalId: { type: DataTypes.STRING, allowNull: true },
  tests: { type: DataTypes.JSON, defaultValue: [] },
  urgency: { type: DataTypes.ENUM('routine','urgent','STAT'), defaultValue: 'routine' },
  clinicalNotes: { type: DataTypes.TEXT, allowNull: true },
  fastingRequired: { type: DataTypes.BOOLEAN, defaultValue: false },
  status: { type: DataTypes.ENUM('ordered','sample_collected','processing','completed','report_uploaded'), defaultValue: 'ordered' },
  fabricTxId: { type: DataTypes.STRING, allowNull: true },
}, { timestamps: true });

module.exports = LabOrder;
