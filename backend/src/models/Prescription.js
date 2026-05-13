const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Prescription = sequelize.define('Prescription', {
  id: { type: DataTypes.STRING, primaryKey: true },
  appointmentId: { type: DataTypes.STRING, allowNull: true },
  patientId: { type: DataTypes.STRING, allowNull: false },
  doctorId: { type: DataTypes.STRING, allowNull: false },
  hospitalId: { type: DataTypes.STRING, allowNull: true },
  medicines: { type: DataTypes.JSON, defaultValue: [] },
  specialInstructions: { type: DataTypes.TEXT, allowNull: true },
  followUpDate: { type: DataTypes.DATEONLY, allowNull: true },
  pdfUrl: { type: DataTypes.STRING, allowNull: true },
  fabricTxId: { type: DataTypes.STRING, allowNull: true },
}, { timestamps: true });

module.exports = Prescription;
