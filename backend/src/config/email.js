const nodemailer = require('nodemailer');
const logger = require('../utils/logger.util');

let transporter;

const getTransporter = () => {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.EMAIL_PORT) || 587,
      secure: process.env.EMAIL_SECURE === 'true',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
    });

    transporter.verify(err => {
      if (err) logger.error('Email transporter error:', err);
      else logger.info('Email transporter ready');
    });
  }
  return transporter;
};

module.exports = { getTransporter };
