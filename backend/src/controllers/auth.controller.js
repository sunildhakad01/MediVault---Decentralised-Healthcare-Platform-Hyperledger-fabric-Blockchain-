const authService   = require('../services/auth.service');
const { verifyToken } = require('../utils/jwt.util');
const prisma        = require('../config/prisma');

exports.initiateRegistration = async (req, res, next) => {
  try {
    const { contactMethod, contactValue } = req.body;
    const result = await authService.initiateRegistration({ contactMethod, contactValue });
    res.status(200).json({ success: true, message: `OTP sent to ${contactMethod}`, ...result });
  } catch (err) { next(err); }
};

exports.verifyOTP = async (req, res, next) => {
  try {
    const { sessionId, otp } = req.body;
    const result = await authService.verifyRegistrationOTP({ sessionId, otp });
    res.status(200).json({ success: true, message: 'OTP verified successfully', nextStep: 'set-pin', ...result });
  } catch (err) { next(err); }
};

exports.setPin = async (req, res, next) => {
  try {
    const tempToken = req.headers.authorization?.replace('Bearer ', '');
    if (!tempToken) return res.status(401).json({ success: false, message: 'Token required' });
    const { pin, pinLength, userType, additionalData } = req.body;
    const result = await authService.setPin({ tempToken, pin, pinLength, userType, additionalData });
    res.status(201).json({ success: true, message: 'Account created successfully', ...result });
  } catch (err) { next(err); }
};

exports.login = async (req, res, next) => {
  try {
    const { identifier, pin, deviceInfo } = req.body;
    const result = await authService.login({
      identifier, pin, deviceInfo,
      ipAddress: req.ip || req.connection?.remoteAddress,
      userAgent: req.headers['user-agent'],
    });
    res.status(200).json({ success: true, ...result });
  } catch (err) { next(err); }
};

exports.verifyToken = async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) return res.status(401).json({ success: false, valid: false });
    const decoded = verifyToken(token);
    const user = await prisma.user.findFirst({
      where: { userId: decoded.userId },
      select: { userId: true, userType: true, email: true, isActive: true },
    });
    if (!user || !user.isActive) return res.status(401).json({ success: false, valid: false });
    res.status(200).json({ success: true, valid: true, user: { userId: user.userId, userType: user.userType, email: user.email }, expiresAt: decoded.exp });
  } catch {
    res.status(401).json({ success: false, valid: false, message: 'Invalid or expired token' });
  }
};

exports.refreshToken = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    const result = await authService.refreshToken(refreshToken);
    res.status(200).json({ success: true, ...result });
  } catch (err) { next(err); }
};

exports.logout = async (req, res) => {
  res.status(200).json({ success: true, message: 'Logged out successfully' });
};

exports.initiateForgotPin = async (req, res, next) => {
  try {
    const result = await authService.initiateForgotPin({ identifier: req.body.identifier });
    res.status(200).json({ success: true, ...result });
  } catch (err) { next(err); }
};

exports.verifyForgotPinOTP = async (req, res, next) => {
  try {
    const result = await authService.verifyForgotPinOTP({ sessionId: req.body.sessionId, otp: req.body.otp });
    res.status(200).json({ success: true, ...result });
  } catch (err) { next(err); }
};

exports.resetPin = async (req, res, next) => {
  try {
    const resetToken = req.headers.authorization?.replace('Bearer ', '');
    if (!resetToken) return res.status(401).json({ success: false, message: 'Token required' });
    const result = await authService.resetPin({ resetToken, newPin: req.body.newPin, pinLength: req.body.pinLength });
    res.status(200).json({ success: true, ...result });
  } catch (err) { next(err); }
};

exports.initiateSecondaryVerification = async (req, res, next) => {
  try {
    const { contactValue } = req.body;
    if (!contactValue) return res.status(400).json({ success: false, message: 'contactValue required' });
    const result = await authService.initiateSecondaryVerification(req.user.userId, contactValue);
    res.status(200).json({ success: true, message: 'OTP sent', ...result });
  } catch (err) { next(err); }
};

exports.confirmSecondaryVerification = async (req, res, next) => {
  try {
    const { sessionId, otp, contactValue } = req.body;
    if (!sessionId || !otp || !contactValue)
      return res.status(400).json({ success: false, message: 'sessionId, otp, contactValue required' });
    const result = await authService.confirmSecondaryVerification(req.user.userId, sessionId, otp, contactValue);
    res.status(200).json({ success: true, ...result });
  } catch (err) { next(err); }
};

exports.verify2FAOTP = async (req, res, next) => {
  try {
    const result = await authService.verify2FAAdminOTP(req.body);
    res.status(200).json({ success: true, ...result });
  } catch (err) { next(err); }
};
