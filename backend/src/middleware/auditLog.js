const { query } = require('../config/database');
const logger = require('../config/logger');

const logAction = async (userId, action, resourceType, resourceId, oldValue, newValue, ip, userAgent) => {
  try {
    await query(
      `INSERT INTO audit_logs (user_id, action, resource_type, resource_id, old_value, new_value, ip_address, user_agent)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        userId || null,
        action,
        resourceType || null,
        resourceId || null,
        oldValue ? JSON.stringify(oldValue) : null,
        newValue ? JSON.stringify(newValue) : null,
        ip || null,
        userAgent || null,
      ]
    );
  } catch (err) {
    logger.error('Failed to write audit log', { err: err.message, action, resourceType });
  }
};

const createAuditLog = (action, resourceType) => {
  return async (req, res, next) => {
    const originalJson = res.json.bind(res);
    res.json = (data) => {
      const userId = req.user?.id || null;
      const resourceId = req.params?.id || null;
      const ip = req.ip || req.socket?.remoteAddress;
      const userAgent = req.headers['user-agent'];
      logAction(userId, action, resourceType, resourceId, null, null, ip, userAgent);
      return originalJson(data);
    };
    next();
  };
};

module.exports = { createAuditLog, logAction };
