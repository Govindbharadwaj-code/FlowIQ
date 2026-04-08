const { query } = require('../config/database');
const { AppError } = require('../middleware/errorHandler');

const getDashboardStats = async (req, res, next) => {
  try {
    const [totalRes, openRes, resolvedRes, criticalRes, avgRes, byStatusRes, byPriorityRes, byTypeRes, recentRes, topAgentsRes] = await Promise.all([
      query('SELECT COUNT(*) FROM tasks'),
      query("SELECT COUNT(*) FROM tasks WHERE status NOT IN ('resolved', 'closed')"),
      query("SELECT COUNT(*) FROM tasks WHERE status = 'resolved'"),
      query("SELECT COUNT(*) FROM tasks WHERE priority = 'critical' AND status NOT IN ('resolved', 'closed')"),
      query(`SELECT AVG(EXTRACT(EPOCH FROM (resolved_at - created_at))/3600) as avg_hours FROM tasks WHERE resolved_at IS NOT NULL`),
      query("SELECT status, COUNT(*) as count FROM tasks GROUP BY status"),
      query("SELECT priority, COUNT(*) as count FROM tasks GROUP BY priority"),
      query("SELECT type, COUNT(*) as count FROM tasks GROUP BY type"),
      query(`SELECT t.id, t.title, t.status, t.priority, t.created_at, u.full_name as assignee_name
             FROM tasks t LEFT JOIN users u ON t.assigned_to = u.id ORDER BY t.created_at DESC LIMIT 5`),
      query(`SELECT u.id, u.full_name, COUNT(t.id) as total_tasks,
             COUNT(CASE WHEN t.status = 'resolved' THEN 1 END) as resolved_tasks
             FROM users u LEFT JOIN tasks t ON u.id = t.assigned_to
             WHERE u.is_active = true GROUP BY u.id, u.full_name ORDER BY total_tasks DESC LIMIT 10`),
    ]);

    res.json({
      success: true,
      stats: {
        totalTasks: parseInt(totalRes.rows[0].count),
        openTasks: parseInt(openRes.rows[0].count),
        resolvedTasks: parseInt(resolvedRes.rows[0].count),
        criticalTasks: parseInt(criticalRes.rows[0].count),
        avgResolutionTime: parseFloat(avgRes.rows[0].avg_hours || 0).toFixed(2),
        tasksByStatus: byStatusRes.rows,
        tasksByPriority: byPriorityRes.rows,
        tasksByType: byTypeRes.rows,
        recentTasks: recentRes.rows,
        topAgents: topAgentsRes.rows,
      },
    });
  } catch (err) {
    next(err);
  }
};

const getTaskTrends = async (req, res, next) => {
  try {
    const result = await query(`
      SELECT DATE(created_at) as date, COUNT(*) as count
      FROM tasks
      WHERE created_at >= NOW() - INTERVAL '30 days'
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `);

    res.json({ success: true, trends: result.rows });
  } catch (err) {
    next(err);
  }
};

const getAgentPerformance = async (req, res, next) => {
  try {
    const result = await query(`
      SELECT
        u.id, u.full_name, u.email, u.department,
        COUNT(t.id) as total_assigned,
        COUNT(CASE WHEN t.status = 'resolved' THEN 1 END) as resolved,
        COUNT(CASE WHEN t.status IN ('open', 'in_progress') THEN 1 END) as active,
        COUNT(CASE WHEN t.status = 'escalated' THEN 1 END) as escalated,
        ROUND(AVG(EXTRACT(EPOCH FROM (t.resolved_at - t.created_at))/3600)::numeric, 2) as avg_resolution_hours,
        ROUND(
          (COUNT(CASE WHEN t.status = 'resolved' THEN 1 END)::float / NULLIF(COUNT(t.id), 0) * 100)::numeric, 2
        ) as resolution_rate
      FROM users u
      LEFT JOIN tasks t ON u.id = t.assigned_to
      WHERE u.is_active = true AND u.role != 'admin'
      GROUP BY u.id, u.full_name, u.email, u.department
      ORDER BY total_assigned DESC
    `);

    res.json({ success: true, agents: result.rows });
  } catch (err) {
    next(err);
  }
};

module.exports = { getDashboardStats, getTaskTrends, getAgentPerformance };
