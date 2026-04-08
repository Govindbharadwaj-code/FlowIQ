const { query } = require('../config/database');
const { AppError } = require('../middleware/errorHandler');

const getNotifications = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, unread_only } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    const conditions = ['user_id = $1'];
    const values = [req.user.id];
    let idx = 2;

    if (unread_only === 'true') {
      conditions.push(`is_read = false`);
    }

    const whereClause = `WHERE ${conditions.join(' AND ')}`;

    const countResult = await query(`SELECT COUNT(*) FROM notifications ${whereClause}`, values);
    const unreadCount = await query('SELECT COUNT(*) FROM notifications WHERE user_id = $1 AND is_read = false', [req.user.id]);

    values.push(parseInt(limit));
    values.push(offset);

    const result = await query(
      `SELECT * FROM notifications ${whereClause} ORDER BY created_at DESC LIMIT $${idx++} OFFSET $${idx++}`,
      values
    );

    res.json({
      success: true,
      notifications: result.rows,
      unreadCount: parseInt(unreadCount.rows[0].count),
      pagination: {
        total: parseInt(countResult.rows[0].count),
        page: parseInt(page),
        limit: parseInt(limit),
      },
    });
  } catch (err) {
    next(err);
  }
};

const markRead = async (req, res, next) => {
  try {
    const result = await query(
      'UPDATE notifications SET is_read = true WHERE id = $1 AND user_id = $2 RETURNING *',
      [req.params.id, req.user.id]
    );

    if (result.rows.length === 0) return next(new AppError('Notification not found', 404));

    res.json({ success: true, notification: result.rows[0] });
  } catch (err) {
    next(err);
  }
};

const markAllRead = async (req, res, next) => {
  try {
    await query('UPDATE notifications SET is_read = true WHERE user_id = $1', [req.user.id]);
    res.json({ success: true, message: 'All notifications marked as read' });
  } catch (err) {
    next(err);
  }
};

module.exports = { getNotifications, markRead, markAllRead };
