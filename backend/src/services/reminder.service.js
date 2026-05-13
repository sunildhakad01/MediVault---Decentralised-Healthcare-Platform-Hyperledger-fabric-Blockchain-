const cron   = require('node-cron');
const prisma = require('../config/prisma');
const logger = require('../utils/logger.util');

let notify;
const loadNotify = () => {
  if (!notify) ({ notify } = require('./notification.service'));
};

const nowIST = () => {
  const d = new Date();
  const utcMs = d.getTime() + d.getTimezoneOffset() * 60_000;
  const istMs = utcMs + 5.5 * 60 * 60_000;
  const ist   = new Date(istMs);
  return `${String(ist.getHours()).padStart(2, '0')}:${String(ist.getMinutes()).padStart(2, '0')}`;
};

const fireReminders = async () => {
  loadNotify();
  const time = nowIST();
  try {
    const reminders = await prisma.medicationReminder.findMany({ where: { active: true } });
    for (const rem of reminders) {
      const times = Array.isArray(rem.reminderTimes) ? rem.reminderTimes : [];
      if (!times.includes(time)) continue;

      const patient = await prisma.patient.findUnique({ where: { id: rem.patientId } });
      if (!patient) continue;

      const message = `MediVault Reminder: Time to take ${rem.medicineName} (${rem.frequency})${rem.note ? ` – ${rem.note}` : ''}. Stay healthy!`;
      await notify({
        userId: rem.patientUserId, userType: 'patient', type: 'prescription',
        title: `Medicine Reminder: ${rem.medicineName}`, message,
        sendSmsFlag: true, phone: patient.phone,
        metadata: { prescriptionId: rem.prescriptionId, medicineName: rem.medicineName, reminderTime: time },
      });

      logger.info(`[Reminder] Sent reminder for ${rem.medicineName} to patient ${rem.patientId} at ${time} IST`);
    }
  } catch (err) {
    logger.error(`[Reminder] Error in fireReminders: ${err.message}`);
  }
};

const fireDailyDigest = async () => {
  loadNotify();
  try {
    const reminders = await prisma.medicationReminder.findMany({ where: { active: true } });
    const byPatient = {};
    for (const rem of reminders) {
      if (!byPatient[rem.patientUserId]) byPatient[rem.patientUserId] = { patientId: rem.patientId, medicines: [] };
      byPatient[rem.patientUserId].medicines.push(rem.medicineName);
    }

    for (const [userId, { patientId, medicines }] of Object.entries(byPatient)) {
      const unique  = [...new Set(medicines)];
      const patient = await prisma.patient.findUnique({ where: { id: patientId } });
      if (!patient) continue;

      const message = `Good morning! Today's medications: ${unique.join(', ')}. Take care and stay healthy!`;
      await notify({ userId, userType: 'patient', type: 'prescription', title: 'Daily Medication Reminder', message, metadata: { type: 'daily_digest' } });
      logger.info(`[Reminder] Daily digest sent to patient ${patientId} (${unique.length} medicines)`);
    }
  } catch (err) {
    logger.error(`[Reminder] Error in fireDailyDigest: ${err.message}`);
  }
};

const startReminderCron = () => {
  cron.schedule('* * * * *', () => fireReminders(), { timezone: 'Asia/Kolkata' });
  cron.schedule('0 9 * * *', () => fireDailyDigest(), { timezone: 'Asia/Kolkata' });
  logger.info('[Reminder] Medication reminder cron jobs started (every minute + daily 09:00 IST)');
};

module.exports = { startReminderCron, fireReminders, fireDailyDigest };
