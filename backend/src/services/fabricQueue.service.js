const prisma = require('../config/prisma');
const { submitTransaction } = require('../config/fabric');
const logger = require('../utils/logger.util');

const FABRIC_USER = () => process.env.FABRIC_USER_ID || 'admin@hospital1.medivault.local';

const submitFabric = async ({ functionName, args = [], initiatedById, initiatedByRole, channel, chaincode }) => {
  const channelName   = channel   || process.env.FABRIC_CHANNEL_NAME   || 'medicalrecords-channel';
  const chaincodeName = chaincode || process.env.FABRIC_CHAINCODE_NAME || 'healthcare';

  try {
    const result = await submitTransaction(FABRIC_USER(), functionName, ...args.map(String));
    logger.info(`Fabric TX success: ${functionName}`);
    return { success: true, txId: result };
  } catch (err) {
    logger.error(`Fabric TX failed (${functionName}): ${err.message} — queuing for retry`);
    try {
      await prisma.fabricPendingQueue.create({
        data: {
          channel: channelName, chaincode: chaincodeName,
          functionName, args,
          initiatedById: initiatedById || 'system',
          initiatedByRole: initiatedByRole || 'system',
          lastError: err.message, lastAttemptedAt: new Date(),
        },
      });
    } catch (qErr) {
      logger.error(`Failed to queue Fabric TX: ${qErr.message}`);
    }
    return { success: false, error: err.message };
  }
};

const retryPending = async () => {
  try {
    const pending = await prisma.fabricPendingQueue.findMany({ where: { status: 'pending' }, take: 50 });
    for (const item of pending) {
      if (item.retryCount >= 5) {
        await prisma.fabricPendingQueue.update({ where: { id: item.id }, data: { status: 'failed' } });
        continue;
      }
      try {
        await submitTransaction(FABRIC_USER(), item.functionName, ...(item.args || []).map(String));
        await prisma.fabricPendingQueue.update({ where: { id: item.id }, data: { status: 'completed' } });
        logger.info(`Fabric retry success: ${item.functionName} (id: ${item.id})`);
      } catch (err) {
        await prisma.fabricPendingQueue.update({
          where: { id: item.id },
          data: { retryCount: { increment: 1 }, lastError: err.message, lastAttemptedAt: new Date() },
        });
      }
    }
  } catch (err) {
    logger.error(`Fabric retry batch failed: ${err.message}`);
  }
};

module.exports = { submitFabric, retryPending };
