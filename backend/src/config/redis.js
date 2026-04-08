const { createClient } = require('redis');
const logger = require('./logger');

const redisClient = createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379',
});

redisClient.on('error', (err) => logger.error('Redis Client Error', err));
redisClient.on('connect', () => logger.info('Redis connected successfully'));

const connectRedis = async () => {
  if (!redisClient.isOpen) {
    await redisClient.connect();
  }
};

const getCache = async (key) => {
  try {
    const data = await redisClient.get(key);
    return data ? JSON.parse(data) : null;
  } catch (err) {
    logger.error('Redis getCache error', { key, err: err.message });
    return null;
  }
};

const setCache = async (key, value, ttl = 3600) => {
  try {
    await redisClient.setEx(key, ttl, JSON.stringify(value));
    return true;
  } catch (err) {
    logger.error('Redis setCache error', { key, err: err.message });
    return false;
  }
};

const deleteCache = async (key) => {
  try {
    await redisClient.del(key);
    return true;
  } catch (err) {
    logger.error('Redis deleteCache error', { key, err: err.message });
    return false;
  }
};

module.exports = { redisClient, connectRedis, getCache, setCache, deleteCache };
