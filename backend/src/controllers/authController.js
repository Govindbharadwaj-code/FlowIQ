const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const { query } = require('../config/database');
const { AppError } = require('../middleware/errorHandler');
const logger = require('../config/logger');
const xss = require('xss');

const generateToken = (user) => {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

const register = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const error = new Error('Validation failed');
      error.errors = errors.array();
      return next(error);
    }

    const { email, password, full_name, role = 'user', department } = req.body;
    const sanitizedEmail = xss(email.toLowerCase().trim());
    const sanitizedName = xss(full_name.trim());
    const sanitizedDept = department ? xss(department.trim()) : null;

    const existing = await query('SELECT id FROM users WHERE email = $1', [sanitizedEmail]);
    if (existing.rows.length > 0) {
      return next(new AppError('Email already registered', 409));
    }

    const allowedRoles = ['user', 'manager', 'admin'];
    const userRole = allowedRoles.includes(role) ? role : 'user';

    const password_hash = await bcrypt.hash(password, 12);

    const result = await query(
      `INSERT INTO users (email, password_hash, full_name, role, department)
       VALUES ($1, $2, $3, $4, $5) RETURNING id, email, full_name, role, department, created_at`,
      [sanitizedEmail, password_hash, sanitizedName, userRole, sanitizedDept]
    );

    const user = result.rows[0];
    const token = generateToken(user);

    logger.info('User registered', { userId: user.id, email: user.email });

    res.status(201).json({
      success: true,
      message: 'Registration successful',
      token,
      user: { id: user.id, email: user.email, full_name: user.full_name, role: user.role, department: user.department },
    });
  } catch (err) {
    next(err);
  }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return next(new AppError('Email and password are required', 400));
    }

    const sanitizedEmail = xss(email.toLowerCase().trim());
    const result = await query(
      'SELECT id, email, password_hash, full_name, role, department, avatar_url, is_active FROM users WHERE email = $1',
      [sanitizedEmail]
    );

    if (result.rows.length === 0) {
      return next(new AppError('Invalid credentials', 401));
    }

    const user = result.rows[0];
    if (!user.is_active) {
      return next(new AppError('Account is deactivated', 403));
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return next(new AppError('Invalid credentials', 401));
    }

    await query('UPDATE users SET last_login = NOW() WHERE id = $1', [user.id]);

    const token = generateToken(user);

    logger.info('User logged in', { userId: user.id });

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        role: user.role,
        department: user.department,
        avatar_url: user.avatar_url,
      },
    });
  } catch (err) {
    next(err);
  }
};

const getProfile = async (req, res, next) => {
  try {
    const result = await query(
      'SELECT id, email, full_name, role, department, avatar_url, is_active, last_login, created_at FROM users WHERE id = $1',
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return next(new AppError('User not found', 404));
    }

    res.json({ success: true, user: result.rows[0] });
  } catch (err) {
    next(err);
  }
};

const updateProfile = async (req, res, next) => {
  try {
    const { full_name, department, avatar_url } = req.body;

    const updates = [];
    const values = [];
    let idx = 1;

    if (full_name) { updates.push(`full_name = $${idx++}`); values.push(xss(full_name.trim())); }
    if (department !== undefined) { updates.push(`department = $${idx++}`); values.push(department ? xss(department.trim()) : null); }
    if (avatar_url !== undefined) { updates.push(`avatar_url = $${idx++}`); values.push(avatar_url ? xss(avatar_url) : null); }

    if (updates.length === 0) {
      return next(new AppError('No fields to update', 400));
    }

    updates.push(`updated_at = NOW()`);
    values.push(req.user.id);

    const result = await query(
      `UPDATE users SET ${updates.join(', ')} WHERE id = $${idx} RETURNING id, email, full_name, role, department, avatar_url`,
      values
    );

    res.json({ success: true, user: result.rows[0] });
  } catch (err) {
    next(err);
  }
};

const changePassword = async (req, res, next) => {
  try {
    const { old_password, new_password } = req.body;
    if (!old_password || !new_password) {
      return next(new AppError('Old and new passwords are required', 400));
    }
    if (new_password.length < 8) {
      return next(new AppError('New password must be at least 8 characters', 400));
    }

    const result = await query('SELECT password_hash FROM users WHERE id = $1', [req.user.id]);
    if (result.rows.length === 0) return next(new AppError('User not found', 404));

    const isMatch = await bcrypt.compare(old_password, result.rows[0].password_hash);
    if (!isMatch) return next(new AppError('Old password is incorrect', 401));

    const newHash = await bcrypt.hash(new_password, 12);
    await query('UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2', [newHash, req.user.id]);

    res.json({ success: true, message: 'Password changed successfully' });
  } catch (err) {
    next(err);
  }
};

module.exports = { register, login, getProfile, updateProfile, changePassword };
