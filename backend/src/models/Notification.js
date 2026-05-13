const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Notification = sequelize.define('Notification', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  userId: { type: DataTypes.STRING, allowNull: false },
  userType: { type: DataTypes.STRING, allowNull: false },
  type: { type: DataTypes.ENUM('appointment','report','prescription','payment','system','verification'), allowNull: false },
  title: { type: DataTypes.STRING, allowNull: false },
  message: { type: DataTypes.TEXT, allowNull: false },
  read: { type: DataTypes.BOOLEAN, defaultValue: false },
  metadata: { type: DataTypes.JSON, defaultValue: {} },
  sentSms: { type: DataTypes.BOOLEAN, defaultValue: false },
  sentPush: { type: DataTypes.BOOLEAN, defaultValue: false },
}, { timestamps: true });

module.exports = Notification;
