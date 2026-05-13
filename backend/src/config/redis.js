const Redis = require('ioredis');
const logger = require('../utils/logger.util');

let client;

const getRedisClient = () => {
  if (!client) {
    client = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
      retryStrategy: times => times > 3 ? null : Math.min(times * 200, 2000),
      lazyConnect: true,
      maxRetriesPerRequest: 1,
      enableOfflineQueue: false,
    });

    client.on('connect', () => logger.info('Redis connected'));
    client.on('error', err => logger.error('Redis error:', err));
  }
  return client;
};

module.exports = { getRedisClient };
