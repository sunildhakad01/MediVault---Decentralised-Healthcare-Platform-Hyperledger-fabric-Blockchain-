const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const FabricPendingQueue = sequelize.define('FabricPendingQueue', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  channel: { type: DataTypes.STRING, allowNull: false },
  chaincode: { type: DataTypes.STRING, defaultValue: 'healthcare' },
  functionName: { type: DataTypes.STRING, allowNull: false },
  args: { type: DataTypes.JSON, defaultValue: [] },
  initiatedById: { type: DataTypes.STRING, allowNull: false },
  initiatedByRole: { type: DataTypes.STRING, allowNull: false },
  retryCount: { type: DataTypes.INTEGER, defaultValue: 0 },
  lastError: { type: DataTypes.TEXT, allowNull: true },
  status: { type: DataTypes.ENUM('pending','success','failed'), defaultValue: 'pending' },
  lastAttemptedAt: { type: DataTypes.DATE, allowNull: true },
}, { timestamps: true });

module.exports = FabricPendingQueue;
