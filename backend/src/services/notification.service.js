const nodemailer = require('nodemailer');
const prisma     = require('../config/prisma');
const logger     = require('../utils/logger.util');

const getTransporter = () => {
  if (process.env.EMAIL_HOST) {
    return nodemailer.createTransport({
      host:   process.env.EMAIL_HOST,
      port:   parseInt(process.env.EMAIL_PORT || '587'),
      secure: process.env.EMAIL_SECURE === 'true',
      auth:   { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASSWORD || process.env.EMAIL_PASS },
    });
  }
  return null;
};

const sendSMS = async (phone, message) => {
  try {
    if (!process.env.MSG91_API_KEY) {
      logger.info(`[SMS fallback] To: ${phone} | ${message}`);
      return;
    }
    const axios = require('axios');
    await axios.post('https://api.msg91.com/api/v5/flow/', {
      template_id: process.env.MSG91_TEMPLATE_ID || '',
      recipients: [{ mobiles: phone.replace('+', ''), message }],
    }, { headers: { authkey: process.env.MSG91_API_KEY, 'Content-Type': 'application/json' } });
    logger.info(`SMS sent to ${phone}`);
  } catch (err) {
    logger.error(`SMS send failed to ${phone}: ${err.message}`);
  }
};

const sendEmail = async (to, subject, htmlBody) => {
  try {
    const transporter = getTransporter();
    if (!transporter) {
      logger.info(`[Email fallback] To: ${to} | Subject: ${subject}`);
      return;
    }
    await transporter.sendMail({
      from: process.env.EMAIL_FROM || '"MediVault" <noreply@medivault.in>',
      to, subject, html: htmlBody,
    });
    logger.info(`Email sent to ${to}`);
  } catch (err) {
    logger.error(`Email send failed to ${to}: ${err.message}`);
  }
};

const createNotification = async ({ userId, userType, type, title, message, metadata = {} }) => {
  try {
    await prisma.notification.create({ data: { userId, userType, type, title, message, metadata } });
  } catch (err) {
    logger.error(`Failed to create notification: ${err.message}`);
  }
};

const notify = async ({
  userId, userType, type, title, message, metadata = {},
  phone = null, email = null, emailSubject = null, emailBody = null,
  sendSmsFlag = false, sendEmailFlag = false,
}) => {
  await createNotification({ userId, userType, type, title, message, metadata });
  if (sendSmsFlag && phone)   await sendSMS(phone, message);
  if (sendEmailFlag && email) await sendEmail(email, emailSubject || title, emailBody || `<p>${message}</p>`);
};

module.exports = { notify, sendSMS, sendEmail, createNotification };
