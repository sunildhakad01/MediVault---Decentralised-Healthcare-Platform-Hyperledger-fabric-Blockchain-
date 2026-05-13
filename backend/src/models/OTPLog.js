const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const OTPLog = sequelize.define('OTPLog', {
  identifier: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  sessionId: {
    type: DataTypes.STRING,
    unique: true,
    allowNull: false,
  },
  otpHash: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  type: {
    type: DataTypes.ENUM('registration', 'forgot_pin', 'secondary_verification', 'admin_2fa'),
    allowNull: false,
  },
  expiresAt: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  verifiedAt: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  attempts: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  isUsed: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
}, {
  timestamps: true,
  indexes: [
    { fields: ['sessionId'] },
    { fields: ['identifier'] },
  ],
  hooks: {
    afterCreate: async (otpLog) => {
      // Auto-delete after 30 minutes (1800 seconds)
      setTimeout(async () => {
        try {
          await OTPLog.destroy({
            where: { id: otpLog.id },
          });
        } catch (error) {
          // Silently fail if already deleted
        }
      }, 1800000);
    },
  },
});

module.exports = OTPLog;
