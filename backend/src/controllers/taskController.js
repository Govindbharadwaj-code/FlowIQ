const { query } = require('../config/database');
const { AppError } = require('../middleware/errorHandler');
const { classifyTask } = require('../utils/aiEngine');
const { createNotification } = require('../services/notificationService');
const { logAction } = require('../middleware/auditLog');
const logger = require('../config/logger');
const xss = require('xss');

const createTask = async (req, res, next) => {
  try {
    const { title, description, type = 'general', priority, assigned_to, due_date, sla_hours = 24, source } = req.body;

    if (!title) return next(new AppError('Title is required', 400));

    const sanitizedTitle = xss(title.trim());
    const sanitizedDesc = description ? xss(description.trim()) : null;

    const aiResult = classifyTask(sanitizedTitle, sanitizedDesc || '');
    const finalPriority = priority || aiResult.priority;

    const result = await query(
      `INSERT INTO tasks (title, description, type, priority, status, ai_priority, ai_tags, ai_summary, ai_confidence,
        assigned_to, created_by, due_date, sla_hours, source)
       VALUES ($1, $2, $3, $4, 'open', $5, $6, $7, $8, $9, $10, $11, $12, $13)
       RETURNING *`,
      [
        sanitizedTitle, sanitizedDesc, type, finalPriority,
        aiResult.priority, aiResult.tags, aiResult.summary, aiResult.confidence,
        assigned_to || null, req.user.id, due_date || null, sla_hours, source || null,
      ]
    );

    const task = result.rows[0];

    if (assigned_to) {
      await createNotification(
        assigned_to,
        'New Task Assigned',
        `You have been assigned task: ${sanitizedTitle}`,
        'info',
        'task',
        task.id
      );
    }

    await logAction(req.user.id, 'CREATE_TASK', 'task', task.id, null, task, req.ip, req.headers['user-agent']);

    res.status(201).json({ success: true, task });
  } catch (err) {
    next(err);
  }
};

const getTasks = async (req, res, next) => {
  try {
    const { status, priority, type, search, assigned_to, page = 1, limit = 20 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    const conditions = [];
    const values = [];
    let idx = 1;

    if (status) { conditions.push(`t.status = $${idx++}`); values.push(status); }
    if (priority) { conditions.push(`t.priority = $${idx++}`); values.push(priority); }
    if (type) { conditions.push(`t.type = $${idx++}`); values.push(type); }
    if (assigned_to) { conditions.push(`t.assigned_to = $${idx++}`); values.push(assigned_to); }
    if (search) {
      conditions.push(`(t.title ILIKE $${idx} OR t.description ILIKE $${idx})`);
      values.push(`%${xss(search)}%`);
      idx++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const countResult = await query(`SELECT COUNT(*) FROM tasks t ${whereClause}`, values);
    const total = parseInt(countResult.rows[0].count);

    values.push(parseInt(limit));
    values.push(offset);

    const tasksResult = await query(
      `SELECT t.*, u.full_name as assignee_name, u.email as assignee_email,
              c.full_name as creator_name
       FROM tasks t
       LEFT JOIN users u ON t.assigned_to = u.id
       LEFT JOIN users c ON t.created_by = c.id
       ${whereClause}
       ORDER BY t.created_at DESC
       LIMIT $${idx++} OFFSET $${idx++}`,
      values
    );

    res.json({
      success: true,
      tasks: tasksResult.rows,
      pagination: { total, page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(total / parseInt(limit)) },
    });
  } catch (err) {
    next(err);
  }
};

const getTask = async (req, res, next) => {
  try {
    const taskResult = await query(
      `SELECT t.*, u.full_name as assignee_name, u.email as assignee_email,
              c.full_name as creator_name
       FROM tasks t
       LEFT JOIN users u ON t.assigned_to = u.id
       LEFT JOIN users c ON t.created_by = c.id
       WHERE t.id = $1`,
      [req.params.id]
    );

    if (taskResult.rows.length === 0) return next(new AppError('Task not found', 404));

    const commentsResult = await query(
      `SELECT tc.*, u.full_name as user_name, u.avatar_url
       FROM task_comments tc
       LEFT JOIN users u ON tc.user_id = u.id
       WHERE tc.task_id = $1
       ORDER BY tc.created_at ASC`,
      [req.params.id]
    );

    res.json({ success: true, task: taskResult.rows[0], comments: commentsResult.rows });
  } catch (err) {
    next(err);
  }
};

const updateTask = async (req, res, next) => {
  try {
    const existing = await query('SELECT * FROM tasks WHERE id = $1', [req.params.id]);
    if (existing.rows.length === 0) return next(new AppError('Task not found', 404));

    const oldTask = existing.rows[0];
    const { title, description, type, priority, status, due_date, sla_hours } = req.body;

    const updates = [];
    const values = [];
    let idx = 1;

    if (title) { updates.push(`title = $${idx++}`); values.push(xss(title.trim())); }
    if (description !== undefined) { updates.push(`description = $${idx++}`); values.push(description ? xss(description) : null); }
    if (type) { updates.push(`type = $${idx++}`); values.push(type); }
    if (priority) { updates.push(`priority = $${idx++}`); values.push(priority); }
    if (status) { updates.push(`status = $${idx++}`); values.push(status); }
    if (due_date !== undefined) { updates.push(`due_date = $${idx++}`); values.push(due_date || null); }
    if (sla_hours) { updates.push(`sla_hours = $${idx++}`); values.push(sla_hours); }

    if (updates.length === 0) return next(new AppError('No fields to update', 400));

    updates.push(`updated_at = NOW()`);
    values.push(req.params.id);

    const result = await query(
      `UPDATE tasks SET ${updates.join(', ')} WHERE id = $${idx} RETURNING *`,
      values
    );

    await logAction(req.user.id, 'UPDATE_TASK', 'task', req.params.id, oldTask, result.rows[0], req.ip, req.headers['user-agent']);

    res.json({ success: true, task: result.rows[0] });
  } catch (err) {
    next(err);
  }
};

const assignTask = async (req, res, next) => {
  try {
    const { assigned_to } = req.body;
    if (!assigned_to) return next(new AppError('assigned_to is required', 400));

    const userCheck = await query('SELECT id, full_name FROM users WHERE id = $1 AND is_active = true', [assigned_to]);
    if (userCheck.rows.length === 0) return next(new AppError('User not found or inactive', 404));

    const taskCheck = await query('SELECT * FROM tasks WHERE id = $1', [req.params.id]);
    if (taskCheck.rows.length === 0) return next(new AppError('Task not found', 404));

    const result = await query(
      `UPDATE tasks SET assigned_to = $1, status = CASE WHEN status = 'open' THEN 'in_progress' ELSE status END,
       updated_at = NOW() WHERE id = $2 RETURNING *`,
      [assigned_to, req.params.id]
    );

    await createNotification(
      assigned_to,
      'Task Assigned to You',
      `Task "${result.rows[0].title}" has been assigned to you`,
      'info', 'task', req.params.id
    );

    await logAction(req.user.id, 'ASSIGN_TASK', 'task', req.params.id, { assigned_to: taskCheck.rows[0].assigned_to }, { assigned_to }, req.ip, req.headers['user-agent']);

    res.json({ success: true, task: result.rows[0] });
  } catch (err) {
    next(err);
  }
};

const escalateTask = async (req, res, next) => {
  try {
    const taskCheck = await query('SELECT * FROM tasks WHERE id = $1', [req.params.id]);
    if (taskCheck.rows.length === 0) return next(new AppError('Task not found', 404));

    const result = await query(
      `UPDATE tasks SET status = 'escalated', escalated_at = NOW(), updated_at = NOW()
       WHERE id = $1 RETURNING *`,
      [req.params.id]
    );

    // Notify managers
    const managers = await query("SELECT id FROM users WHERE role IN ('manager', 'admin') AND is_active = true");
    for (const manager of managers.rows) {
      await createNotification(
        manager.id,
        'Task Escalated',
        `Task "${result.rows[0].title}" has been escalated and requires attention`,
        'warning', 'task', req.params.id
      );
    }

    await logAction(req.user.id, 'ESCALATE_TASK', 'task', req.params.id, null, { status: 'escalated' }, req.ip, req.headers['user-agent']);

    res.json({ success: true, task: result.rows[0] });
  } catch (err) {
    next(err);
  }
};

const resolveTask = async (req, res, next) => {
  try {
    const { feedback_score, feedback_comment } = req.body;

    const taskCheck = await query('SELECT * FROM tasks WHERE id = $1', [req.params.id]);
    if (taskCheck.rows.length === 0) return next(new AppError('Task not found', 404));

    const updates = [`status = 'resolved'`, `resolved_at = NOW()`, `resolved_by = $1`, `updated_at = NOW()`];
    const values = [req.user.id];
    let idx = 2;

    if (feedback_score) { updates.push(`feedback_score = $${idx++}`); values.push(parseInt(feedback_score)); }
    if (feedback_comment) { updates.push(`feedback_comment = $${idx++}`); values.push(xss(feedback_comment)); }

    values.push(req.params.id);
    const result = await query(
      `UPDATE tasks SET ${updates.join(', ')} WHERE id = $${idx} RETURNING *`,
      values
    );

    await logAction(req.user.id, 'RESOLVE_TASK', 'task', req.params.id, null, { status: 'resolved' }, req.ip, req.headers['user-agent']);

    res.json({ success: true, task: result.rows[0] });
  } catch (err) {
    next(err);
  }
};

const deleteTask = async (req, res, next) => {
  try {
    const result = await query('DELETE FROM tasks WHERE id = $1 RETURNING id', [req.params.id]);
    if (result.rows.length === 0) return next(new AppError('Task not found', 404));

    await logAction(req.user.id, 'DELETE_TASK', 'task', req.params.id, null, null, req.ip, req.headers['user-agent']);

    res.json({ success: true, message: 'Task deleted successfully' });
  } catch (err) {
    next(err);
  }
};

const bulkIngest = async (req, res, next) => {
  try {
    const { tasks } = req.body;
    if (!Array.isArray(tasks) || tasks.length === 0) {
      return next(new AppError('tasks array is required', 400));
    }

    const results = [];
    for (const taskData of tasks.slice(0, 100)) {
      const { title, description, type = 'general', source, source_metadata } = taskData;
      if (!title) continue;

      const sanitizedTitle = xss(title.trim());
      const sanitizedDesc = description ? xss(description.trim()) : null;
      const aiResult = classifyTask(sanitizedTitle, sanitizedDesc || '');

      const result = await query(
        `INSERT INTO tasks (title, description, type, priority, status, ai_priority, ai_tags, ai_summary, ai_confidence, created_by, source, source_metadata)
         VALUES ($1, $2, $3, $4, 'open', $5, $6, $7, $8, $9, $10, $11) RETURNING *`,
        [
          sanitizedTitle, sanitizedDesc, type, aiResult.priority,
          aiResult.priority, aiResult.tags, aiResult.summary, aiResult.confidence,
          req.user.id, source || 'bulk_ingest', source_metadata ? JSON.stringify(source_metadata) : '{}',
        ]
      );
      results.push(result.rows[0]);
    }

    res.status(201).json({ success: true, message: `${results.length} tasks ingested`, tasks: results });
  } catch (err) {
    next(err);
  }
};

const addComment = async (req, res, next) => {
  try {
    const { comment, is_internal = false } = req.body;
    if (!comment) return next(new AppError('Comment is required', 400));

    const taskCheck = await query('SELECT id FROM tasks WHERE id = $1', [req.params.id]);
    if (taskCheck.rows.length === 0) return next(new AppError('Task not found', 404));

    const result = await query(
      `INSERT INTO task_comments (task_id, user_id, comment, is_internal) VALUES ($1, $2, $3, $4)
       RETURNING *, (SELECT full_name FROM users WHERE id = $2) as user_name`,
      [req.params.id, req.user.id, xss(comment), is_internal]
    );

    res.status(201).json({ success: true, comment: result.rows[0] });
  } catch (err) {
    next(err);
  }
};

module.exports = { createTask, getTasks, getTask, updateTask, assignTask, escalateTask, resolveTask, deleteTask, bulkIngest, addComment };
