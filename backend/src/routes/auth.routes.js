const express = require('express');
const router  = express.Router();

const authController = require('../controllers/auth.controller');
const {
  validateInitiate,
  validateVerifyOTP,
  validateSetPin,
  validateLogin,
  validateResetPin,
} = require('../validators/auth.validator');
const { authLimiter } = require('../middlewares/rateLimit.middleware');
const { authenticate } = require('../middlewares/auth.middleware');

// ── Registration ──────────────────────────────────────────────────────────────
router.post('/register/initiate',   authLimiter, validateInitiate,  authController.initiateRegistration);
router.post('/register/verify-otp', authLimiter, validateVerifyOTP, authController.verifyOTP);
router.post('/register/set-pin',                 validateSetPin,    authController.setPin);

// ── Auth ──────────────────────────────────────────────────────────────────────
router.post('/login',      authLimiter, validateLogin, authController.login);
router.post('/verify-otp', authLimiter, authController.verify2FAOTP);
router.get ('/verify',                  authController.verifyToken);
router.post('/refresh',                 authController.refreshToken);
router.post('/logout',     authenticate, authController.logout);

// ── Forgot PIN ────────────────────────────────────────────────────────────────
router.post('/forgot-pin/initiate',   authLimiter, authController.initiateForgotPin);
router.post('/forgot-pin/verify-otp', authLimiter, validateVerifyOTP, authController.verifyForgotPinOTP);
router.post('/forgot-pin/reset',      validateResetPin, authController.resetPin);

// ── Secondary Contact Verification (requires login) ───────────────────────────
router.post('/verify-secondary/initiate', authenticate, authLimiter, authController.initiateSecondaryVerification);
router.post('/verify-secondary/confirm',  authenticate, authLimiter, authController.confirmSecondaryVerification);

module.exports = router;
