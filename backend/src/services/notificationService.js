const { query } = require('../config/database');
const logger = require('../config/logger');

const createNotification = async (userId, title, message, type = 'info', referenceType = null, referenceId = null) => {
  try {
    const result = await query(
      `INSERT INTO notifications (user_id, title, message, type, reference_type, reference_id)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [userId, title, message, type, referenceType, referenceId]
    );
    const notification = result.rows[0];

    // Emit via Socket.IO if io is available
    const app = require('../app');
    if (app.io) {
      app.io.to(`user:${userId}`).emit('notification', notification);
    }

    return notification;
  } catch (err) {
    logger.error('Failed to create notification', { err: err.message, userId });
    return null;
  }
};

module.exports = { createNotification };
