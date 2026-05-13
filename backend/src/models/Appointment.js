const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Appointment = sequelize.define('Appointment', {
  id: { type: DataTypes.STRING, primaryKey: true },
  patientId: { type: DataTypes.STRING, allowNull: false },
  doctorId: { type: DataTypes.STRING, allowNull: false },
  hospitalId: { type: DataTypes.STRING, allowNull: true },
  appointmentDate: { type: DataTypes.DATEONLY, allowNull: false },
  slotStart: { type: DataTypes.STRING, allowNull: false },
  slotEnd: { type: DataTypes.STRING, allowNull: false },
  tokenNumber: { type: DataTypes.INTEGER, allowNull: true },
  reason: { type: DataTypes.TEXT, allowNull: true },
  status: { type: DataTypes.ENUM('scheduled','confirmed','in_progress','completed','cancelled','no_show','rescheduled'), defaultValue: 'scheduled' },
  notes: { type: DataTypes.TEXT, allowNull: true },
  cancelledBy: { type: DataTypes.STRING, allowNull: true },
  cancellationReason: { type: DataTypes.TEXT, allowNull: true },
  fabricTxId: { type: DataTypes.STRING, allowNull: true },
}, { timestamps: true });

module.exports = Appointment;
