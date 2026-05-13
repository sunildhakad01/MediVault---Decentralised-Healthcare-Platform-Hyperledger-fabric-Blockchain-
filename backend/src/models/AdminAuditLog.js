const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const AdminAuditLog = sequelize.define('AdminAuditLog', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  adminId: { type: DataTypes.STRING, allowNull: false },
  action: { type: DataTypes.STRING, allowNull: false },
  targetType: { type: DataTypes.STRING, allowNull: true },
  targetId: { type: DataTypes.STRING, allowNull: true },
  metadata: { type: DataTypes.JSON, defaultValue: {} },
  ipAddress: { type: DataTypes.STRING, allowNull: true },
}, { timestamps: true });

module.exports = AdminAuditLog;
