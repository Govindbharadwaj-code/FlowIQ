const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const {
  createTask, getTasks, getTask, updateTask, assignTask,
  escalateTask, resolveTask, deleteTask, bulkIngest, addComment
} = require('../controllers/taskController');

router.post('/bulk-ingest', authenticate, authorize('manager', 'admin'), bulkIngest);
router.post('/', authenticate, createTask);
router.get('/', authenticate, getTasks);
router.get('/:id', authenticate, getTask);
router.put('/:id', authenticate, updateTask);
router.post('/:id/assign', authenticate, authorize('manager', 'admin'), assignTask);
router.post('/:id/escalate', authenticate, escalateTask);
router.post('/:id/resolve', authenticate, resolveTask);
router.delete('/:id', authenticate, authorize('admin'), deleteTask);
router.post('/:id/comments', authenticate, addComment);

module.exports = router;
