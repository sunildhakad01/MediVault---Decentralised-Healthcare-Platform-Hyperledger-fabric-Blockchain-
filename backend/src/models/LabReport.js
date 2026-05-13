const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const LabReport = sequelize.define('LabReport', {
  id: { type: DataTypes.STRING, primaryKey: true },
  labOrderId: { type: DataTypes.STRING, allowNull: true },
  patientId: { type: DataTypes.STRING, allowNull: false },
  uploadedBy: { type: DataTypes.STRING, allowNull: false },
  hospitalId: { type: DataTypes.STRING, allowNull: true },
  ipfsCid: { type: DataTypes.STRING, allowNull: false },
  pinataUrl: { type: DataTypes.STRING, allowNull: true },
  reportDate: { type: DataTypes.DATEONLY, allowNull: false },
  testName: { type: DataTypes.STRING, allowNull: false },
  fabricTxId: { type: DataTypes.STRING, allowNull: true },
}, { timestamps: true });

module.exports = LabReport;
