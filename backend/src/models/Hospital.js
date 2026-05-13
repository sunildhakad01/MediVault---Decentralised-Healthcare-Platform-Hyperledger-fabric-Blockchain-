const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Hospital = sequelize.define('Hospital', {
  id: { type: DataTypes.STRING, primaryKey: true },
  name: { type: DataTypes.STRING, allowNull: false },
  logoUrl: { type: DataTypes.STRING, allowNull: true },
  hospitalType: { type: DataTypes.ENUM('government','private','clinic','diagnostic','trust','charitable'), allowNull: false },
  addressLine1: { type: DataTypes.STRING, allowNull: false },
  addressLine2: { type: DataTypes.STRING, allowNull: true },
  city: { type: DataTypes.STRING, allowNull: false },
  state: { type: DataTypes.STRING, allowNull: false },
  pincode: { type: DataTypes.STRING(6), allowNull: false },
  phone: { type: DataTypes.STRING, allowNull: false },
  altPhone: { type: DataTypes.STRING, allowNull: true },
  emergencyPhone: { type: DataTypes.STRING, allowNull: true },
  email: { type: DataTypes.STRING, allowNull: false },
  website: { type: DataTypes.STRING, allowNull: true },
  registrationNumber: { type: DataTypes.STRING, allowNull: false, unique: true },
  licenseNumber: { type: DataTypes.STRING, allowNull: true },
  gstin: { type: DataTypes.STRING(15), allowNull: true },
  yearEstablished: { type: DataTypes.INTEGER, allowNull: true },
  numberOfBeds: { type: DataTypes.INTEGER, allowNull: true },
  landmark: { type: DataTypes.STRING, allowNull: true },
  googleMapsLink: { type: DataTypes.STRING, allowNull: true },
  workingHours: { type: DataTypes.JSON, defaultValue: {} },
  emergencyAvailable: { type: DataTypes.BOOLEAN, defaultValue: false },
  specialisations: { type: DataTypes.TEXT, allowNull: true },
  documents: { type: DataTypes.JSON, defaultValue: [] },
  status: { type: DataTypes.ENUM('pending','approved','rejected','suspended'), defaultValue: 'pending' },
  verifiedByAdminId: { type: DataTypes.STRING, allowNull: true },
  verifiedAt: { type: DataTypes.DATE, allowNull: true },
  rejectionReason: { type: DataTypes.TEXT, allowNull: true },
  suspensionReason: { type: DataTypes.TEXT, allowNull: true },
  fabricTxId: { type: DataTypes.STRING, allowNull: true },
  submittedAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  // Admin account reference
  adminName: { type: DataTypes.STRING, allowNull: true },
  adminEmail: { type: DataTypes.STRING, allowNull: true },
  adminPhone: { type: DataTypes.STRING, allowNull: true },
  adminUserId: { type: DataTypes.STRING, allowNull: true },
}, { timestamps: true });

module.exports = Hospital;
