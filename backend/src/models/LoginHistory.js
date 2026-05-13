const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const User = require('./User');

const LoginHistory = sequelize.define('LoginHistory', {
  userId: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  identifier: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  ipAddress: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  userAgent: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  deviceFingerprint: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  success: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
  },
  failureReason: {
    type: DataTypes.STRING,
    allowNull: true,
  },
}, {
  timestamps: true,
  indexes: [
    { fields: ['userId', 'createdAt'] },
  ],
});

module.exports = LoginHistory;
