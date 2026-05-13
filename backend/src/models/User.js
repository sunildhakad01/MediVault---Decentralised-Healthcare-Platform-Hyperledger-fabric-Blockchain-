const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const User = sequelize.define('User', {
  userId: {
    type: DataTypes.STRING,
    unique: true,
    allowNull: false,
  },
  mobile: {
    type: DataTypes.STRING,
    unique: true,
    sparse: true,
    allowNull: true,
  },
  email: {
    type: DataTypes.STRING,
    unique: true,
    sparse: true,
    allowNull: true,
  },
  isMobileVerified: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  isEmailVerified: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  verificationDate: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  pinHash: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  pinLength: {
    type: DataTypes.ENUM('4', '6'),
    allowNull: false,
  },
  userType: {
    type: DataTypes.ENUM('patient', 'doctor', 'admin', 'pharmacy', 'hospital_admin'),
    allowNull: false,
  },
  role: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  hospital: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  department: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  firstName: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  lastName: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  licenseNumber: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  fabricCertPath: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  fabricMSPID: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  fabricUserId: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  abhaId: {
    type: DataTypes.STRING,
    unique: true,
    sparse: true,
    allowNull: true,
  },
  abhaVerified: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  failedLoginAttempts: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  lockedUntil: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  lastLoginAt: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  lastLoginIP: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  registeredDevices: {
    type: DataTypes.JSON,
    defaultValue: [],
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
  isBlocked: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  blockReason: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  metadata: {
    type: DataTypes.JSON,
    defaultValue: {
      preferredLanguage: 'en',
      notificationPreferences: {},
    },
  },
}, {
  timestamps: true,
  indexes: [
    { fields: ['userId'] },
    { fields: ['email'] },
    { fields: ['mobile'] },
    { fields: ['abhaId'] },
  ],
});

module.exports = User;
