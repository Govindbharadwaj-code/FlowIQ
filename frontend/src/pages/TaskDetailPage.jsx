import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, User, Brain, Tag, Send, AlertTriangle, CheckCircle, UserCheck } from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import PriorityBadge from '../components/Tasks/PriorityBadge';
import StatusBadge from '../components/Tasks/StatusBadge';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function TaskDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [task, setTask] = useState(null);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [comment, setComment] = useState('');
  const [assignUserId, setAssignUserId] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [actionLoading, setActionLoading] = useState('');

  const canManage = user?.role === 'manager' || user?.role === 'admin';

  useEffect(() => {
    api.get(`/tasks/${id}`).then((res) => {
      setTask(res.data.task);
      setComments(res.data.comments || []);
    }).catch(() => navigate('/tasks')).finally(() => setLoading(false));
  }, [id, navigate]);

  const handleAction = async (action, data = {}) => {
    setActionLoading(action);
    try {
      const res = await api.post(`/tasks/${id}/${action}`, data);
      setTask(res.data.task);
    } catch (err) {
      alert(err.response?.data?.message || `Failed to ${action} task`);
    } finally {
      setActionLoading('');
    }
  };

  const handleComment = async (e) => {
    e.preventDefault();
    if (!comment.trim()) return;
    setSubmitting(true);
    try {
      const res = await api.post(`/tasks/${id}/comments`, { comment });
      setComments((prev) => [...prev, res.data.comment]);
      setComment('');
    } catch (err) {
      alert('Failed to add comment');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="loading-container"><div className="spinner" /></div>;
  if (!task) return null;

  return (
    <div>
      <button className="btn btn-secondary btn-sm" onClick={() => navigate('/tasks')} style={{ marginBottom: '20px' }}>
        <ArrowLeft size={16} /> Back to Tasks
      </button>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '24px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="card">
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px', marginBottom: '16px' }}>
              <h1 style={{ fontSize: '22px', fontWeight: '700', lineHeight: '1.3' }}>{task.title}</h1>
              <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                <PriorityBadge priority={task.priority} />
                <StatusBadge status={task.status} />
              </div>
            </div>

            {task.description && (
              <p style={{ color: 'var(--color-text-secondary)', lineHeight: '1.7', marginBottom: '16px' }}>{task.description}</p>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', padding: '16px', background: 'var(--color-bg)', borderRadius: '8px' }}>
              <div>
                <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>Type</div>
                <div style={{ fontSize: '14px', fontWeight: '500', textTransform: 'capitalize' }}>{task.type?.replace('_', ' ')}</div>
              </div>
              <div>
                <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>Assignee</div>
                <div style={{ fontSize: '14px', fontWeight: '500' }}>{task.assignee_name || 'Unassigned'}</div>
              </div>
              <div>
                <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>Created</div>
                <div style={{ fontSize: '14px', fontWeight: '500' }}>{format(new Date(task.created_at), 'MMM d, yyyy')}</div>
              </div>
              {task.due_date && (
                <div>
                  <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>Due Date</div>
                  <div style={{ fontSize: '14px', fontWeight: '500' }}>{format(new Date(task.due_date), 'MMM d, yyyy')}</div>
                </div>
              )}
              <div>
                <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>SLA</div>
                <div style={{ fontSize: '14px', fontWeight: '500' }}>{task.sla_hours}h</div>
              </div>
              <div>
                <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>Source</div>
                <div style={{ fontSize: '14px', fontWeight: '500' }}>{task.source || 'Manual'}</div>
              </div>
            </div>
          </div>

          {/* AI Analysis */}
          {(task.ai_priority || task.ai_summary) && (
            <div className="card" style={{ borderLeft: '4px solid var(--color-primary)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                <Brain size={18} color="var(--color-primary)" />
                <h3 style={{ fontSize: '16px', fontWeight: '600' }}>AI Analysis</h3>
                {task.ai_confidence && (
                  <span style={{ marginLeft: 'auto', fontSize: '12px', color: 'var(--color-text-secondary)' }}>
                    Confidence: {(task.ai_confidence * 100).toFixed(0)}%
                  </span>
                )}
              </div>
              {task.ai_summary && <p style={{ fontSize: '14px', color: 'var(--color-text-secondary)', marginBottom: '12px' }}>{task.ai_summary}</p>}
              {task.ai_priority && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <span style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>Suggested Priority:</span>
                  <PriorityBadge priority={task.ai_priority} />
                </div>
              )}
              {task.ai_tags && task.ai_tags.length > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <Tag size={14} color="var(--color-text-secondary)" />
                  {task.ai_tags.map((tag) => (
                    <span key={tag} style={{ padding: '2px 8px', background: 'var(--color-bg)', border: '1px solid var(--color-border)', borderRadius: '4px', fontSize: '12px' }}>
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Comments */}
          <div className="card">
            <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '16px' }}>Comments ({comments.length})</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '16px' }}>
              {comments.length === 0 ? (
                <p style={{ color: 'var(--color-text-secondary)', fontSize: '14px' }}>No comments yet. Be the first to comment!</p>
              ) : (
                comments.map((c) => (
                  <div key={c.id} style={{ display: 'flex', gap: '10px' }}>
                    <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '12px', fontWeight: '600', flexShrink: 0 }}>
                      {c.user_name?.[0]?.toUpperCase() || 'U'}
                    </div>
                    <div style={{ flex: 1, background: 'var(--color-bg)', borderRadius: '8px', padding: '10px 12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                        <span style={{ fontSize: '13px', fontWeight: '600' }}>{c.user_name || 'User'}</span>
                        <span style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>{formatDistanceToNow(new Date(c.created_at), { addSuffix: true })}</span>
                        {c.is_internal && <span style={{ fontSize: '10px', background: '#e0e7ff', color: '#4338ca', padding: '1px 6px', borderRadius: '4px' }}>Internal</span>}
                      </div>
                      <p style={{ fontSize: '14px', lineHeight: '1.5' }}>{c.comment}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
            <form onSubmit={handleComment} style={{ display: 'flex', gap: '10px' }}>
              <input className="form-input" placeholder="Add a comment..." value={comment} onChange={(e) => setComment(e.target.value)} style={{ flex: 1 }} />
              <button type="submit" className="btn btn-primary" disabled={submitting || !comment.trim()}>
                <Send size={16} />
              </button>
            </form>
          </div>
        </div>

        {/* Sidebar Actions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="card">
            <h3 style={{ fontSize: '15px', fontWeight: '600', marginBottom: '12px' }}>Actions</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {canManage && task.status !== 'resolved' && task.status !== 'closed' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <input className="form-input" placeholder="User UUID to assign" style={{ fontSize: '12px' }} value={assignUserId} onChange={(e) => setAssignUserId(e.target.value)} />
                  <button className="btn btn-secondary" style={{ justifyContent: 'center', width: '100%' }} onClick={() => {
                    if (assignUserId) { handleAction('assign', { assigned_to: assignUserId }); setAssignUserId(''); }
                  }} disabled={actionLoading === 'assign'}>
                    <UserCheck size={15} /> {actionLoading === 'assign' ? 'Assigning...' : 'Assign Task'}
                  </button>
                </div>
              )}
              {task.status !== 'escalated' && task.status !== 'resolved' && task.status !== 'closed' && (
                <button className="btn btn-warning" style={{ justifyContent: 'center', width: '100%', background: '#f59e0b', color: 'white' }} onClick={() => handleAction('escalate')} disabled={actionLoading === 'escalate'}>
                  <AlertTriangle size={15} /> {actionLoading === 'escalate' ? 'Escalating...' : 'Escalate'}
                </button>
              )}
              {task.status !== 'resolved' && task.status !== 'closed' && (
                <button className="btn btn-success" style={{ justifyContent: 'center', width: '100%' }} onClick={() => handleAction('resolve', { feedback_score: 5 })} disabled={actionLoading === 'resolve'}>
                  <CheckCircle size={15} /> {actionLoading === 'resolve' ? 'Resolving...' : 'Mark Resolved'}
                </button>
              )}
            </div>
          </div>

          {task.feedback_score && (
            <div className="card">
              <h3 style={{ fontSize: '15px', fontWeight: '600', marginBottom: '8px' }}>Feedback</h3>
              <div style={{ display: 'flex', gap: '2px', marginBottom: '8px' }}>
                {Array.from({ length: 5 }).map((_, i) => (
                  <span key={i} style={{ fontSize: '18px' }}>{i < task.feedback_score ? '⭐' : '☆'}</span>
                ))}
              </div>
              {task.feedback_comment && <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>{task.feedback_comment}</p>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
