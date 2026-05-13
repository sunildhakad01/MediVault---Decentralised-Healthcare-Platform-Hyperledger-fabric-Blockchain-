const { submitTransaction, evaluateTransaction } = require('../config/fabric');
const { v4: uuidv4 } = require('uuid');
const logger = require('../utils/logger.util');
const { submitFabric } = require('./fabricQueue.service');

const getFabricUserId = (user) =>
  user.fabricUserId || (process.env.FABRIC_USER_ID || 'admin@hospital1.medivault.local');

// ── Doctor operations ─────────────────────────────────────────────────────────

const registerDoctor = async (user, { ipfsURL, name, specialization, hospital, licenseNumber }) => {
  const doctorID = `DOC-${uuidv4()}`;
  const fabricId = getFabricUserId(user);

  await submitTransaction(
    fabricId,
    'AddDoctor',
    doctorID, user.userId, ipfsURL || '', name, specialization, hospital, licenseNumber
  );

  logger.info(`Doctor ${doctorID} registered on Fabric by ${user.userId}`);
  return { doctorID };
};

const getDoctor = async (user, doctorID) => {
  const fabricId = getFabricUserId(user);
  const result = await evaluateTransaction(fabricId, 'QueryDoctor', doctorID);
  return JSON.parse(result);
};

// ── Patient operations ────────────────────────────────────────────────────────

const registerPatient = async (user, { ipfsURL, name, dob, bloodGroup }) => {
  const patientID = `PAT-${uuidv4()}`;
  const fabricId = getFabricUserId(user);

  await submitTransaction(
    fabricId,
    'RegisterPatient',
    patientID, user.userId, ipfsURL || '', name, dob, bloodGroup
  );

  logger.info(`Patient ${patientID} registered on Fabric by ${user.userId}`);
  return { patientID };
};

const getPatient = async (user, patientID) => {
  const fabricId = getFabricUserId(user);
  const result = await evaluateTransaction(fabricId, 'QueryPatient', patientID);
  return JSON.parse(result);
};

const getPatientHistory = async (user, patientID) => {
  const fabricId = getFabricUserId(user);
  const result = await evaluateTransaction(fabricId, 'QueryPatientHistory', patientID);
  return JSON.parse(result);
};

// ── Prescription operations ───────────────────────────────────────────────────

const issuePrescription = async (user, { doctorID, patientID, medicines, instructions, expiryDays }) => {
  const prescriptionID = `PRE-${uuidv4()}`;
  const fabricId = getFabricUserId(user);

  await submitTransaction(
    fabricId,
    'IssuePrescription',
    prescriptionID,
    doctorID,
    patientID,
    JSON.stringify(medicines),
    instructions,
    String(expiryDays || 30)
  );

  logger.info(`Prescription ${prescriptionID} issued by doctor ${doctorID}`);
  return { prescriptionID };
};

// ── Appointment operations ────────────────────────────────────────────────────

const bookAppointment = async (user, { doctorID, patientID, appointmentDate, timeSlot, reason }) => {
  const appointmentID = `APT-${uuidv4()}`;
  const fabricId = getFabricUserId(user);

  await submitTransaction(
    fabricId,
    'BookAppointment',
    appointmentID, doctorID, patientID, appointmentDate, timeSlot, reason
  );

  logger.info(`Appointment ${appointmentID} booked by ${user.userId}`);
  return { appointmentID };
};

// ── Generic query ─────────────────────────────────────────────────────────────

const getUserData = async (user, dataType, id) => {
  const fabricId = getFabricUserId(user);
  let fnName;
  switch (dataType) {
    case 'doctor':      fnName = 'QueryDoctor';         break;
    case 'patient':     fnName = 'QueryPatientHistory'; break;
    default: throw new Error(`Unknown data type: ${dataType}`);
  }
  const result = await evaluateTransaction(fabricId, fnName, id);
  return JSON.parse(result);
};

// ── Domain-specific channel functions (non-blocking via queue) ─────────────────

/**
 * Record a hospital verification status change on Fabric.
 * Channel: admin-hospital
 * @param {string} hospitalId
 * @param {string} status       - e.g. 'verified' | 'rejected' | 'suspended'
 * @param {string} adminId      - ID of the admin performing the action
 * @param {string} timestamp    - ISO timestamp string
 * @param {string} [reason]     - Optional reason for status change
 * @param {string} [userId]     - Fabric identity to use (defaults to adminId)
 * @returns {{ success: true, queued: true }}
 */
const updateHospitalStatus = async (hospitalId, status, adminId, timestamp, reason, userId) => {
  try {
    await submitFabric({
      channel:         'admin-hospital',
      chaincode:       'healthcare',
      functionName:    'updateHospitalStatus',
      args:            [hospitalId, status, adminId, timestamp, reason || ''],
      initiatedById:   userId || adminId,
      initiatedByRole: 'admin',
    });
  } catch (err) {
    logger.error(`updateHospitalStatus Fabric enqueue failed: ${err.message}`);
  }
  return { success: true, queued: true };
};

/**
 * Record a doctor verification status change on Fabric.
 * Channel: admin-doctor or hospital-doctor depending on verifier role.
 * @param {string} doctorId
 * @param {string} status       - e.g. 'verified' | 'rejected'
 * @param {string} verifiedBy   - Role of verifier ('admin' | 'hospital')
 * @param {string} verifierId   - ID of the verifier
 * @param {string} timestamp    - ISO timestamp string
 * @param {string} [reason]
 * @param {string} [userId]     - Fabric identity
 * @returns {{ success: true, queued: true }}
 */
const updateDoctorStatus = async (doctorId, status, verifiedBy, verifierId, timestamp, reason, userId) => {
  const channel = verifiedBy === 'hospital' ? 'hospital-doctor' : 'admin-doctor';
  try {
    await submitFabric({
      channel,
      chaincode:       'healthcare',
      functionName:    'updateDoctorStatus',
      args:            [doctorId, status, verifiedBy, verifierId, timestamp, reason || ''],
      initiatedById:   userId || verifierId,
      initiatedByRole: verifiedBy || 'admin',
    });
  } catch (err) {
    logger.error(`updateDoctorStatus Fabric enqueue failed: ${err.message}`);
  }
  return { success: true, queued: true };
};

/**
 * Record a prescription creation on Fabric.
 * Channel: prescriptions
 * @param {string} prescriptionId
 * @param {string} patientId
 * @param {string} doctorId
 * @param {string} hospitalOrClinicId
 * @param {string} medicineHash        - Hash of medicine list (do not store raw PII on chain)
 * @param {string} timestamp           - ISO timestamp string
 * @param {string} [userId]            - Fabric identity
 * @returns {{ success: true, queued: true }}
 */
const recordPrescription = async (prescriptionId, patientId, doctorId, hospitalOrClinicId, medicineHash, timestamp, userId) => {
  try {
    await submitFabric({
      channel:         'prescriptions',
      chaincode:       'healthcare',
      functionName:    'createPrescription',
      args:            [prescriptionId, patientId, doctorId, hospitalOrClinicId, medicineHash, timestamp],
      initiatedById:   userId || doctorId,
      initiatedByRole: 'doctor',
    });
  } catch (err) {
    logger.error(`recordPrescription Fabric enqueue failed: ${err.message}`);
  }
  return { success: true, queued: true };
};

/**
 * Record a lab report on Fabric.
 * Channel: lab-reports
 * @param {string} reportId
 * @param {string} patientId
 * @param {string} doctorId
 * @param {string} hospitalId
 * @param {string} cid         - IPFS Content ID of the report
 * @param {string} testName
 * @param {string} timestamp   - ISO timestamp string
 * @param {string} [userId]    - Fabric identity
 * @returns {{ success: true, queued: true }}
 */
const recordLabReport = async (reportId, patientId, doctorId, hospitalId, cid, testName, timestamp, userId) => {
  try {
    await submitFabric({
      channel:         'lab-reports',
      chaincode:       'healthcare',
      functionName:    'recordLabReport',
      args:            [reportId, patientId, doctorId, hospitalId, cid, testName, timestamp],
      initiatedById:   userId || doctorId,
      initiatedByRole: 'doctor',
    });
  } catch (err) {
    logger.error(`recordLabReport Fabric enqueue failed: ${err.message}`);
  }
  return { success: true, queued: true };
};

/**
 * Log an appointment lifecycle event on Fabric.
 * Channel: appointments
 * @param {string} appointmentId
 * @param {string} patientId
 * @param {string} doctorId
 * @param {string} hospitalId
 * @param {string} status       - e.g. 'booked' | 'completed' | 'cancelled'
 * @param {string} changedBy    - ID of user who triggered the change
 * @param {string} timestamp    - ISO timestamp string
 * @param {string} [userId]     - Fabric identity
 * @returns {{ success: true, queued: true }}
 */
const logAppointmentEvent = async (appointmentId, patientId, doctorId, hospitalId, status, changedBy, timestamp, userId) => {
  try {
    await submitFabric({
      channel:         'appointments',
      chaincode:       'healthcare',
      functionName:    'logAppointmentEvent',
      args:            [appointmentId, patientId, doctorId, hospitalId, status, changedBy, timestamp],
      initiatedById:   userId || changedBy,
      initiatedByRole: 'system',
    });
  } catch (err) {
    logger.error(`logAppointmentEvent Fabric enqueue failed: ${err.message}`);
  }
  return { success: true, queued: true };
};

/**
 * Log a medical record access event on Fabric.
 * Channel: access-logs
 * @param {string} patientId
 * @param {string} recordId
 * @param {string} accessorId
 * @param {string} accessorRole  - e.g. 'doctor' | 'hospital' | 'admin' | 'patient'
 * @param {string} recordType    - e.g. 'prescription' | 'lab_report' | 'profile'
 * @param {string} timestamp     - ISO timestamp string
 * @param {string} [userId]      - Fabric identity
 * @returns {{ success: true, queued: true }}
 */
const logRecordAccess = async (patientId, recordId, accessorId, accessorRole, recordType, timestamp, userId) => {
  try {
    await submitFabric({
      channel:         'access-logs',
      chaincode:       'healthcare',
      functionName:    'logAccess',
      args:            [patientId, recordId, accessorId, accessorRole, recordType, timestamp],
      initiatedById:   userId || accessorId,
      initiatedByRole: accessorRole || 'system',
    });
  } catch (err) {
    logger.error(`logRecordAccess Fabric enqueue failed: ${err.message}`);
  }
  return { success: true, queued: true };
};

/**
 * Record a patient consent grant or revocation on Fabric.
 * Channel: consent
 * @param {string}  patientId
 * @param {string}  consentType  - e.g. 'data_sharing' | 'treatment'
 * @param {string}  grantedTo    - ID of entity being granted/revoked consent
 * @param {string}  timestamp    - ISO timestamp string
 * @param {boolean} revoked      - true if this is a revocation
 * @param {string}  [userId]     - Fabric identity
 * @returns {{ success: true, queued: true }}
 */
const recordConsent = async (patientId, consentType, grantedTo, timestamp, revoked, userId) => {
  try {
    await submitFabric({
      channel:         'consent',
      chaincode:       'healthcare',
      functionName:    'recordConsent',
      args:            [patientId, consentType, grantedTo, timestamp, String(!!revoked)],
      initiatedById:   userId || patientId,
      initiatedByRole: 'patient',
    });
  } catch (err) {
    logger.error(`recordConsent Fabric enqueue failed: ${err.message}`);
  }
  return { success: true, queued: true };
};

module.exports = {
  // Legacy direct-submit operations
  registerDoctor,
  getDoctor,
  registerPatient,
  getPatient,
  getPatientHistory,
  issuePrescription,
  bookAppointment,
  getUserData,
  // Non-blocking channel-specific operations
  updateHospitalStatus,
  updateDoctorStatus,
  recordPrescription,
  recordLabReport,
  logAppointmentEvent,
  logRecordAccess,
  recordConsent,
};
