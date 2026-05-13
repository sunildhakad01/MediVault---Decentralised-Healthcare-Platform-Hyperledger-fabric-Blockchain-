const Joi = require('joi');

const validate = (schema) => (req, res, next) => {
  const { error } = schema.validate(req.body, { abortEarly: false });
  if (error) {
    const message = error.details.map(d => d.message).join('; ');
    return res.status(400).json({ success: false, message });
  }
  next();
};

const initiateSchema = Joi.object({
  contactMethod: Joi.string().valid('email', 'mobile').required(),
  contactValue:  Joi.alternatives().conditional('contactMethod', {
    is: 'email',
    then: Joi.string().email().required(),
    otherwise: Joi.string().pattern(/^\+\d{10,15}$/).required(),
  }),
});

const verifyOTPSchema = Joi.object({
  sessionId: Joi.string().required(),
  otp:       Joi.string().pattern(/^\d{6}$/).required(),
});

const setPinSchema = Joi.object({
  pin:       Joi.string().pattern(/^\d{4}$|^\d{6}$/).required(),
  pinLength: Joi.number().valid(4, 6).required(),
  userType:  Joi.string().valid('patient', 'doctor', 'admin', 'pharmacy', 'hospital', 'hospital_admin').required(),
  additionalData: Joi.object({
    firstName:     Joi.string().optional(),
    lastName:      Joi.string().optional(),
    hospital:      Joi.string().optional(),
    department:    Joi.string().optional(),
    licenseNumber: Joi.string().optional(),
  }).optional(),
});

const loginSchema = Joi.object({
  identifier: Joi.string().required(),
  pin:        Joi.string().pattern(/^\d{4}$|^\d{6}$/).required(),
  deviceInfo: Joi.object({
    fingerprint: Joi.string().optional(),
    userAgent:   Joi.string().optional(),
    platform:    Joi.string().optional(),
  }).optional(),
});

const resetPinSchema = Joi.object({
  newPin:    Joi.string().pattern(/^\d{4}$|^\d{6}$/).required(),
  pinLength: Joi.number().valid(4, 6).required(),
});

module.exports = {
  validateInitiate:     validate(initiateSchema),
  validateVerifyOTP:    validate(verifyOTPSchema),
  validateSetPin:       validate(setPinSchema),
  validateLogin:        validate(loginSchema),
  validateResetPin:     validate(resetPinSchema),
};
