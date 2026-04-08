import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Upload } from 'lucide-react';
import TaskCard from '../components/Tasks/TaskCard';
import TaskFilters from '../components/Tasks/TaskFilters';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

function CreateTaskModal({ onClose, onCreated }) {
  const [form, setForm] = useState({ title: '', description: '', type: 'general', priority: '', due_date: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = { ...form };
      if (!payload.priority) delete payload.priority;
      if (!payload.due_date) delete payload.due_date;
      const res = await api.post('/tasks', payload);
      onCreated(res.data.task);
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create task');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">Create New Task</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        {error && <div className="alert alert-error">{error}</div>}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div className="form-group">
            <label className="form-label">Title *</label>
            <input className="form-input" placeholder="Task title..." required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          </div>
          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea className="form-input" rows={3} placeholder="Describe the task..." value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div className="form-group">
              <label className="form-label">Type</label>
              <select className="form-input form-select" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                <option value="general">General</option>
                <option value="email">Email</option>
                <option value="ticket">Ticket</option>
                <option value="dataset">Dataset</option>
                <option value="code_review">Code Review</option>
                <option value="content">Content</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Priority (optional)</label>
              <select className="form-input form-select" value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}>
                <option value="">Auto (AI)</option>
                <option value="critical">Critical</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Due Date (optional)</label>
            <input type="datetime-local" className="form-input" value={form.due_date} onChange={(e) => setForm({ ...form, due_date: e.target.value })} />
          </div>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Creating...' : 'Create Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function TasksPage() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 20, pages: 1 });
  const [filters, setFilters] = useState({ status: '', priority: '', type: '', search: '', page: 1 });
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([k, v]) => { if (v) params.set(k, v); });
      const res = await api.get(`/tasks?${params}`);
      setTasks(res.data.tasks);
      setPagination(res.data.pagination);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => { fetchTasks(); }, [fetchTasks]);

  const handleFilterChange = (newFilters) => setFilters(newFilters);

  const canManage = user?.role === 'manager' || user?.role === 'admin';

  return (
    <div>
      <div className="page-header">
        <div>
          <h2 className="page-title">Tasks</h2>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '14px' }}>{pagination.total} total tasks</p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          {canManage && (
            <button className="btn btn-secondary" onClick={() => alert('Bulk ingest: Use the API POST /api/tasks/bulk-ingest with a JSON array of tasks')}>
              <Upload size={16} /> Bulk Ingest
            </button>
          )}
          <button className="btn btn-primary" onClick={() => setShowCreate(true)}>
            <Plus size={16} /> New Task
          </button>
        </div>
      </div>

      <TaskFilters filters={filters} onChange={handleFilterChange} />

      {loading ? (
        <div className="loading-container"><div className="spinner" /></div>
      ) : tasks.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📋</div>
          <p className="empty-state-text">No tasks found</p>
          <button className="btn btn-primary" style={{ marginTop: '16px' }} onClick={() => setShowCreate(true)}>
            <Plus size={16} /> Create your first task
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-4">
          {tasks.map((task) => <TaskCard key={task.id} task={task} />)}
        </div>
      )}

      {pagination.pages > 1 && (
        <div className="pagination">
          <button className="pagination-btn" onClick={() => setFilters((f) => ({ ...f, page: f.page - 1 }))} disabled={filters.page <= 1}>← Prev</button>
          {Array.from({ length: Math.min(pagination.pages, 7) }, (_, i) => i + 1).map((p) => (
            <button key={p} className={`pagination-btn ${filters.page === p ? 'active' : ''}`} onClick={() => setFilters((f) => ({ ...f, page: p }))}>{p}</button>
          ))}
          <button className="pagination-btn" onClick={() => setFilters((f) => ({ ...f, page: f.page + 1 }))} disabled={filters.page >= pagination.pages}>Next →</button>
        </div>
      )}

      {showCreate && <CreateTaskModal onClose={() => setShowCreate(false)} onCreated={(task) => setTasks((prev) => [task, ...prev])} />}
    </div>
  );
}
