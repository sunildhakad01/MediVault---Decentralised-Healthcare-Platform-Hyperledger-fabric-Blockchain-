const { getTransporter } = require('../config/email');
const logger = require('../utils/logger.util');

const FROM = process.env.EMAIL_FROM || 'noreply@medivault.health';
const APP_NAME = process.env.APP_NAME || 'MediVault';

/**
 * Send OTP email.
 */
const sendOTPEmail = async (to, otp, type = 'registration') => {
  const subject =
    type === 'registration' ? `${APP_NAME} - Verify Your Email` :
    type === 'admin_2fa'    ? `${APP_NAME} - Admin Login OTP` :
                              `${APP_NAME} - PIN Reset OTP`;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto;">
      <h2 style="color: #7C3AED;">${APP_NAME}</h2>
      <p>Your one-time password (OTP) is:</p>
      <div style="background: #F3F0FF; border-radius: 8px; padding: 20px; text-align: center;">
        <span style="font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #7C3AED;">${otp}</span>
      </div>
      <p style="color: #666; margin-top: 16px;">
        This OTP is valid for <strong>5 minutes</strong> and can only be used once.
      </p>
      <p style="color: #999; font-size: 12px;">
        If you did not request this, please ignore this email.
      </p>
    </div>
  `;

  await getTransporter().sendMail({ from: FROM, to, subject, html });
  logger.info(`OTP email sent to ${to}`);
};

/**
 * Send PIN change notification.
 */
const sendPinChangedEmail = async (to, name) => {
  const subject = `${APP_NAME} - Your PIN Was Changed`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto;">
      <h2 style="color: #7C3AED;">${APP_NAME}</h2>
      <p>Hi ${name || 'User'},</p>
      <p>Your MediVault PIN was changed successfully.</p>
      <p style="color: #dc2626;">
        If you did not make this change, please contact support immediately.
      </p>
    </div>
  `;
  await getTransporter().sendMail({ from: FROM, to, subject, html });
};

/**
 * Send account locked notification.
 */
const sendAccountLockedEmail = async (to, name, lockDurationMinutes) => {
  const subject = `${APP_NAME} - Account Temporarily Locked`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto;">
      <h2 style="color: #7C3AED;">${APP_NAME}</h2>
      <p>Hi ${name || 'User'},</p>
      <p>Your account has been temporarily locked for ${lockDurationMinutes} minutes due to multiple failed login attempts.</p>
      <p>It will automatically unlock after the lockout period ends.</p>
    </div>
  `;
  await getTransporter().sendMail({ from: FROM, to, subject, html });
};

module.exports = { sendOTPEmail, sendPinChangedEmail, sendAccountLockedEmail };
