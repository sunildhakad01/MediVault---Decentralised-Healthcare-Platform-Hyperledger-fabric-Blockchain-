const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Patient = sequelize.define('Patient', {
  id: { type: DataTypes.STRING, primaryKey: true },
  userId: { type: DataTypes.STRING, allowNull: false, unique: true },
  uniquePatientId: { type: DataTypes.STRING, allowNull: false, unique: true },
  fullName: { type: DataTypes.STRING, allowNull: false },
  dob: { type: DataTypes.DATEONLY, allowNull: true },
  gender: { type: DataTypes.ENUM('Male','Female','Other','Prefer not to say'), allowNull: true },
  bloodGroup: { type: DataTypes.ENUM('A+','A-','B+','B-','AB+','AB-','O+','O-','Unknown'), allowNull: true },
  phone: { type: DataTypes.STRING, allowNull: false },
  alternatePhone: { type: DataTypes.STRING, allowNull: true },
  email: { type: DataTypes.STRING, allowNull: true },
  address: { type: DataTypes.TEXT, allowNull: true },
  city: { type: DataTypes.STRING, allowNull: true },
  state: { type: DataTypes.STRING, allowNull: true },
  pincode: { type: DataTypes.STRING(6), allowNull: true },
  aadhaarLast4: { type: DataTypes.STRING(4), allowNull: true },
  profilePhotoUrl: { type: DataTypes.STRING, allowNull: true },
  emergencyContact: { type: DataTypes.JSON, defaultValue: {} },
  status: { type: DataTypes.ENUM('active','inactive','flagged'), defaultValue: 'active' },
}, { timestamps: true });

module.exports = Patient;
