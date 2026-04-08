const { query } = require('../config/database');
const logger = require('../config/logger');

let _io = null;

const setSocketIO = (io) => {
  _io = io;
};

const createNotification = async (userId, title, message, type = 'info', referenceType = null, referenceId = null) => {
  try {
    const result = await query(
      `INSERT INTO notifications (user_id, title, message, type, reference_type, reference_id)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [userId, title, message, type, referenceType, referenceId]
    );
    const notification = result.rows[0];

    if (_io) {
      _io.to(`user:${userId}`).emit('notification', notification);
    }

    return notification;
  } catch (err) {
    logger.error('Failed to create notification', { err: err.message, userId });
    return null;
  }
};

module.exports = { createNotification, setSocketIO };
