const express = require('express');
const router  = express.Router();

const contractController = require('../controllers/contract.controller');
const { authenticate, authorize } = require('../middlewares/auth.middleware');
const { apiLimiter } = require('../middlewares/rateLimit.middleware');

router.use(authenticate, apiLimiter);

// ── Doctor ────────────────────────────────────────────────────────────────────
router.post('/register-doctor',  authorize('doctor', 'admin'), contractController.registerDoctor);
router.get ('/doctor/:doctorID',                               contractController.getDoctor);

// ── Patient ───────────────────────────────────────────────────────────────────
router.post('/register-patient',         authorize('patient', 'admin'), contractController.registerPatient);
router.get ('/patient/:patientID',                                       contractController.getPatient);
router.get ('/patient/:patientID/history',                               contractController.getPatientHistory);

// ── Prescription ──────────────────────────────────────────────────────────────
router.post('/prescriptions', authorize('doctor'), contractController.issuePrescription);

// ── Appointment ───────────────────────────────────────────────────────────────
router.post('/appointments', contractController.bookAppointment);

// ── Generic ───────────────────────────────────────────────────────────────────
router.get('/get-user-data', contractController.getUserData);

module.exports = router;
