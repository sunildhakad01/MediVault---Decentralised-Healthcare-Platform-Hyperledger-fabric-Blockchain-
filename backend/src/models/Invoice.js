const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Invoice = sequelize.define('Invoice', {
  id: { type: DataTypes.STRING, primaryKey: true },
  patientId: { type: DataTypes.STRING, allowNull: false },
  doctorId: { type: DataTypes.STRING, allowNull: false },
  hospitalId: { type: DataTypes.STRING, allowNull: true },
  appointmentId: { type: DataTypes.STRING, allowNull: true },
  lineItems: { type: DataTypes.JSON, defaultValue: [] },
  subtotal: { type: DataTypes.DECIMAL(12,2), allowNull: false },
  gstPercent: { type: DataTypes.DECIMAL(5,2), defaultValue: 18 },
  gstAmount: { type: DataTypes.DECIMAL(12,2), allowNull: false },
  totalAmount: { type: DataTypes.DECIMAL(12,2), allowNull: false },
  currency: { type: DataTypes.STRING(3), defaultValue: 'INR' },
  status: { type: DataTypes.ENUM('pending','paid','failed','refunded'), defaultValue: 'pending' },
  paymentMethod: { type: DataTypes.STRING, allowNull: true },
  paymentReference: { type: DataTypes.STRING, allowNull: true },
  upiRef: { type: DataTypes.STRING, allowNull: true },
  gstin: { type: DataTypes.STRING(15), allowNull: true },
  paidAt: { type: DataTypes.DATE, allowNull: true },
}, { timestamps: true });

module.exports = Invoice;
