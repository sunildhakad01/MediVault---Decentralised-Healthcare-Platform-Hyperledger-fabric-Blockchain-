const User = require('./User');
const LoginHistory = require('./LoginHistory');
const OTPLog = require('./OTPLog');
const Hospital = require('./Hospital');
const Doctor = require('./Doctor');
const Patient = require('./Patient');
const Appointment = require('./Appointment');
const Prescription = require('./Prescription');
const LabOrder = require('./LabOrder');
const LabReport = require('./LabReport');
const Invoice = require('./Invoice');
const Notification = require('./Notification');
const FabricPendingQueue = require('./FabricPendingQueue');
const AdminAuditLog = require('./AdminAuditLog');
const MedicationReminder = require('./MedicationReminder');

// Associations
Doctor.belongsTo(Hospital, { foreignKey: 'hospitalId', as: 'hospital', constraints: false });
Hospital.hasMany(Doctor, { foreignKey: 'hospitalId', as: 'doctors', constraints: false });
Patient.belongsTo(User, { foreignKey: 'userId', targetKey: 'userId', as: 'user', constraints: false });
Doctor.belongsTo(User, { foreignKey: 'userId', targetKey: 'userId', as: 'user', constraints: false });

module.exports = {
  User, LoginHistory, OTPLog,
  Hospital, Doctor, Patient,
  Appointment, Prescription,
  LabOrder, LabReport, Invoice,
  Notification, FabricPendingQueue, AdminAuditLog,
  MedicationReminder,
};
