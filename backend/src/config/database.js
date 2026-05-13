// Prisma is the data layer — this file re-exports the singleton for
// any legacy code that still imports from config/database.
const prisma = require('./prisma');

const connectDB    = () => prisma.$connect();
const disconnectDB = () => prisma.$disconnect();

module.exports = { prisma, connectDB, disconnectDB };
