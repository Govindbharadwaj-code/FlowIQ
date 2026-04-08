const request = require('supertest');

// Mock the database before importing app
jest.mock('../src/config/database', () => ({
  query: jest.fn(),
  pool: { on: jest.fn() },
  testConnection: jest.fn().mockResolvedValue(true),
}));

jest.mock('../src/config/redis', () => ({
  redisClient: { on: jest.fn(), isOpen: false, connect: jest.fn() },
  connectRedis: jest.fn().mockResolvedValue(true),
  getCache: jest.fn().mockResolvedValue(null),
  setCache: jest.fn().mockResolvedValue(true),
  deleteCache: jest.fn().mockResolvedValue(true),
}));

jest.mock('../src/services/notificationService', () => ({
  createNotification: jest.fn().mockResolvedValue({}),
  setSocketIO: jest.fn(),
}));

// Set test environment variables
process.env.JWT_SECRET = 'test-jwt-secret-key-for-testing';
process.env.NODE_ENV = 'test';

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { query } = require('../src/config/database');
const { app } = require('../src/app');

describe('Auth API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user successfully', async () => {
      // Mock no existing user
      query
        .mockResolvedValueOnce({ rows: [] }) // check existing email
        .mockResolvedValueOnce({
          rows: [{
            id: 'test-uuid-123',
            email: 'test@example.com',
            full_name: 'Test User',
            role: 'user',
            department: null,
            created_at: new Date().toISOString(),
          }],
        }); // insert user

      const res = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test@example.com',
          password: 'password123',
          full_name: 'Test User',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.token).toBeDefined();
      expect(res.body.user.email).toBe('test@example.com');
    });

    it('should return 409 for duplicate email', async () => {
      query.mockResolvedValueOnce({ rows: [{ id: 'existing-uuid' }] });

      const res = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'existing@example.com',
          password: 'password123',
          full_name: 'Existing User',
        });

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/already registered/i);
    });

    it('should return 400 for invalid email', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'not-an-email',
          password: 'password123',
          full_name: 'Test User',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should return 400 for short password', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test@example.com',
          password: 'short',
          full_name: 'Test User',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe('POST /api/auth/login', () => {
    it('should login successfully with correct credentials', async () => {
      const hashedPassword = await bcrypt.hash('password123', 12);

      query.mockResolvedValueOnce({
        rows: [{
          id: 'test-uuid-123',
          email: 'test@example.com',
          password_hash: hashedPassword,
          full_name: 'Test User',
          role: 'user',
          department: null,
          avatar_url: null,
          is_active: true,
        }],
      }); // select user

      query.mockResolvedValueOnce({ rows: [] }); // update last_login

      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'test@example.com', password: 'password123' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.token).toBeDefined();
      expect(res.body.user.email).toBe('test@example.com');
    });

    it('should return 401 for wrong password', async () => {
      const hashedPassword = await bcrypt.hash('correctpassword', 12);

      query.mockResolvedValueOnce({
        rows: [{
          id: 'test-uuid-123',
          email: 'test@example.com',
          password_hash: hashedPassword,
          full_name: 'Test User',
          role: 'user',
          is_active: true,
        }],
      });

      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'test@example.com', password: 'wrongpassword' });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('should return 401 for non-existent user', async () => {
      query.mockResolvedValueOnce({ rows: [] });

      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'nobody@example.com', password: 'password123' });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });

  describe('GET /api/auth/profile', () => {
    it('should return profile for authenticated user', async () => {
      const token = jwt.sign(
        { id: 'test-uuid-123', email: 'test@example.com', role: 'user' },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      );

      query.mockResolvedValueOnce({
        rows: [{
          id: 'test-uuid-123',
          email: 'test@example.com',
          full_name: 'Test User',
          role: 'user',
          department: null,
          avatar_url: null,
          is_active: true,
          last_login: null,
          created_at: new Date().toISOString(),
        }],
      });

      const res = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.user.email).toBe('test@example.com');
    });

    it('should return 401 without token', async () => {
      const res = await request(app).get('/api/auth/profile');

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });
});
