const request = require('supertest');
const jwt = require('jsonwebtoken');

// Mock database and redis before importing app
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

jest.mock('../src/middleware/auditLog', () => ({
  logAction: jest.fn().mockResolvedValue(undefined),
  createAuditLog: jest.fn(() => (req, res, next) => next()),
}));

process.env.JWT_SECRET = 'test-jwt-secret-key-for-testing';
process.env.NODE_ENV = 'test';

const { query } = require('../src/config/database');
const { app } = require('../src/app');

const getAuthToken = (role = 'user') =>
  jwt.sign({ id: 'user-uuid-123', email: 'test@example.com', role }, process.env.JWT_SECRET, { expiresIn: '1h' });

describe('Tasks API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/tasks', () => {
    it('should create a task with AI classification', async () => {
      const token = getAuthToken('user');
      const mockTask = {
        id: 'task-uuid-123',
        title: 'Critical system outage',
        description: 'Production server is down',
        type: 'ticket',
        status: 'open',
        priority: 'critical',
        ai_priority: 'critical',
        ai_tags: ['general'],
        ai_summary: 'Critical system outage. Production server is down',
        ai_confidence: 0.92,
        created_by: 'user-uuid-123',
        created_at: new Date().toISOString(),
      };

      query.mockResolvedValueOnce({ rows: [mockTask] });

      const res = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${token}`)
        .send({
          title: 'Critical system outage',
          description: 'Production server is down',
          type: 'ticket',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.task).toBeDefined();
      expect(res.body.task.title).toBe('Critical system outage');
      // AI should classify as critical due to "Critical" and "outage" keywords
      expect(res.body.task.priority).toBe('critical');
      expect(res.body.task.ai_priority).toBe('critical');
      expect(res.body.task.ai_confidence).toBeGreaterThanOrEqual(0.9);
      expect(Array.isArray(res.body.task.ai_tags)).toBe(true);
      expect(res.body.task.ai_summary).toBeDefined();
    });

    it('should return 401 without authentication', async () => {
      const res = await request(app)
        .post('/api/tasks')
        .send({ title: 'Test Task' });

      expect(res.status).toBe(401);
    });

    it('should return 400 without title', async () => {
      const token = getAuthToken('user');

      const res = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${token}`)
        .send({ description: 'No title provided' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe('GET /api/tasks', () => {
    it('should list tasks with pagination', async () => {
      const token = getAuthToken('user');
      const mockTasks = [
        { id: 'task-1', title: 'Task 1', status: 'open', priority: 'medium' },
        { id: 'task-2', title: 'Task 2', status: 'in_progress', priority: 'high' },
      ];

      query
        .mockResolvedValueOnce({ rows: [{ count: '2' }] }) // count query
        .mockResolvedValueOnce({ rows: mockTasks }); // tasks query

      const res = await request(app)
        .get('/api/tasks')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.tasks).toHaveLength(2);
      expect(res.body.pagination).toBeDefined();
      expect(res.body.pagination.total).toBe(2);
    });

    it('should filter tasks by status', async () => {
      const token = getAuthToken('user');

      query
        .mockResolvedValueOnce({ rows: [{ count: '1' }] })
        .mockResolvedValueOnce({ rows: [{ id: 'task-1', title: 'Task 1', status: 'open' }] });

      const res = await request(app)
        .get('/api/tasks?status=open')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.tasks).toHaveLength(1);
    });
  });

  describe('POST /api/tasks/:id/resolve', () => {
    it('should resolve a task', async () => {
      const token = getAuthToken('user');
      const existingTask = {
        id: 'task-uuid-123',
        title: 'Test Task',
        status: 'in_progress',
        created_at: new Date().toISOString(),
      };
      const resolvedTask = { ...existingTask, status: 'resolved', resolved_at: new Date().toISOString() };

      query
        .mockResolvedValueOnce({ rows: [existingTask] }) // check task exists
        .mockResolvedValueOnce({ rows: [resolvedTask] }); // update task

      const res = await request(app)
        .post('/api/tasks/task-uuid-123/resolve')
        .set('Authorization', `Bearer ${token}`)
        .send({ feedback_score: 5, feedback_comment: 'Great resolution!' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.task.status).toBe('resolved');
    });

    it('should return 404 for non-existent task', async () => {
      const token = getAuthToken('user');
      query.mockResolvedValueOnce({ rows: [] });

      const res = await request(app)
        .post('/api/tasks/non-existent-id/resolve')
        .set('Authorization', `Bearer ${token}`)
        .send({});

      expect(res.status).toBe(404);
    });
  });
});
