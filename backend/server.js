require('dotenv').config();
const app    = require('./src/app');
const prisma = require('./src/config/prisma');
const logger = require('./src/utils/logger.util');

const PORT = process.env.PORT || 3002;

async function startServer() {
  try {
    await prisma.$connect();
    logger.info('PostgreSQL connected via Prisma');

    // Start medication reminder cron jobs
    try {
      const { startReminderCron } = require('./src/services/reminder.service');
      startReminderCron();
    } catch (cronErr) {
      logger.warn('Reminder cron not started:', cronErr.message);
    }

    const server = app.listen(PORT, () => {
      logger.info(`MediVault API Server running on port ${PORT}`);
      logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
    });

    server.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        logger.error(`Port ${PORT} already in use. Run: npx kill-port ${PORT}`);
      } else {
        logger.error('Server error:', err);
      }
      process.exit(1);
    });

    process.on('SIGTERM', async () => {
      await prisma.$disconnect();
      server.close(() => process.exit(0));
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

startServer();
