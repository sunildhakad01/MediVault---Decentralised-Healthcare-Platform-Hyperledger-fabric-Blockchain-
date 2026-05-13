const fabricService = require('../services/fabric.service');
const prisma = require('../config/prisma');

// Helper: load full user from JWT payload
const loadUser = async (userId) => {
  const user = await prisma.user.findFirst({ where: { userId } });
  if (!user || !user.isActive) {
    const err = new Error('User not found'); err.statusCode = 404; throw err;
  }
  return user;
};

// Helper: tag Fabric unavailability errors clearly
const handleFabricError = (err, next) => {
  if (err.fabricUnavailable || err.statusCode === 503) {
    err.message = `Hyperledger Fabric is not reachable: ${err.message}`;
    err.statusCode = 503;
  }
  next(err);
};

// ── Doctor ────────────────────────────────────────────────────────────────────

exports.registerDoctor = async (req, res, next) => {
  try {
    const user = await loadUser(req.user.userId);
    const result = await fabricService.registerDoctor(user, req.body);
    res.status(201).json({ success: true, ...result });
  } catch (err) { handleFabricError(err, next); }
};

exports.getDoctor = async (req, res, next) => {
  try {
    const user = await loadUser(req.user.userId);
    const doctor = await fabricService.getDoctor(user, req.params.doctorID);
    res.status(200).json({ success: true, data: doctor });
  } catch (err) { handleFabricError(err, next); }
};

// ── Patient ───────────────────────────────────────────────────────────────────

exports.registerPatient = async (req, res, next) => {
  try {
    const user = await loadUser(req.user.userId);
    const result = await fabricService.registerPatient(user, req.body);
    res.status(201).json({ success: true, ...result });
  } catch (err) { handleFabricError(err, next); }
};

exports.getPatient = async (req, res, next) => {
  try {
    const user = await loadUser(req.user.userId);
    const patient = await fabricService.getPatient(user, req.params.patientID);
    res.status(200).json({ success: true, data: patient });
  } catch (err) { handleFabricError(err, next); }
};

exports.getPatientHistory = async (req, res, next) => {
  try {
    const user = await loadUser(req.user.userId);
    const history = await fabricService.getPatientHistory(user, req.params.patientID);
    res.status(200).json({ success: true, data: history });
  } catch (err) { handleFabricError(err, next); }
};

// ── Prescription ──────────────────────────────────────────────────────────────

exports.issuePrescription = async (req, res, next) => {
  try {
    const user = await loadUser(req.user.userId);
    const result = await fabricService.issuePrescription(user, req.body);
    res.status(201).json({ success: true, ...result });
  } catch (err) { handleFabricError(err, next); }
};

// ── Appointment ───────────────────────────────────────────────────────────────

exports.bookAppointment = async (req, res, next) => {
  try {
    const user = await loadUser(req.user.userId);
    const result = await fabricService.bookAppointment(user, req.body);
    res.status(201).json({ success: true, ...result });
  } catch (err) { handleFabricError(err, next); }
};

// ── Generic get ───────────────────────────────────────────────────────────────

exports.getUserData = async (req, res, next) => {
  try {
    const user = await loadUser(req.user.userId);
    const { dataType, id } = req.query;
    const data = await fabricService.getUserData(user, dataType, id);
    res.status(200).json({ success: true, data });
  } catch (err) { handleFabricError(err, next); }
};
