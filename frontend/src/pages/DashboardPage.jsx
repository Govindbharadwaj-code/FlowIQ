import React, { useState, useEffect } from 'react';
import { CheckSquare, AlertTriangle, CheckCircle, Clock, Activity } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import StatsCard from '../components/Dashboard/StatsCard';
import TasksChart from '../components/Dashboard/TasksChart';
import PriorityChart from '../components/Dashboard/PriorityChart';
import TrendChart from '../components/Dashboard/TrendChart';
import PriorityBadge from '../components/Tasks/PriorityBadge';
import StatusBadge from '../components/Tasks/StatusBadge';
import api from '../services/api';
import { formatDistanceToNow } from 'date-fns';

export default function DashboardPage() {
  const [stats, setStats] = useState(null);
  const [trends, setTrends] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    Promise.all([
      api.get('/analytics/dashboard'),
      api.get('/analytics/trends'),
    ]).then(([statsRes, trendsRes]) => {
      setStats(statsRes.data.stats);
      setTrends(trendsRes.data.trends);
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading-container"><div className="spinner" /></div>;
  if (!stats) return <div className="empty-state"><p>Failed to load dashboard</p></div>;

  return (
    <div>
      <div className="page-header">
        <div>
          <h2 className="page-title">Dashboard</h2>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '14px' }}>Overview of your workflow operations</p>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-6">
        <StatsCard title="Total Tasks" value={stats.totalTasks} icon={CheckSquare} color="var(--color-primary)" />
        <StatsCard title="Open Tasks" value={stats.openTasks} icon={Activity} color="#8b5cf6" />
        <StatsCard title="Critical" value={stats.criticalTasks} icon={AlertTriangle} color="var(--color-critical)" />
        <StatsCard title="Resolved" value={stats.resolvedTasks} icon={CheckCircle} color="var(--color-success)" subtitle={`Avg ${stats.avgResolutionTime}h resolution`} />
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6" style={{ gridTemplateColumns: '2fr 1fr 1fr' }}>
        <TrendChart data={trends} />
        <TasksChart data={stats.tasksByStatus} />
        <PriorityChart data={stats.tasksByPriority} />
      </div>

      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: '600' }}>Recent Tasks</h3>
          <button className="btn btn-secondary btn-sm" onClick={() => navigate('/tasks')}>View all</button>
        </div>
        {stats.recentTasks.length === 0 ? (
          <div className="empty-state"><p className="empty-state-text">No tasks yet</p></div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Priority</th>
                <th>Status</th>
                <th>Assignee</th>
                <th>Created</th>
              </tr>
            </thead>
            <tbody>
              {stats.recentTasks.map((task) => (
                <tr key={task.id} style={{ cursor: 'pointer' }} onClick={() => navigate(`/tasks/${task.id}`)}>
                  <td style={{ fontWeight: '500', maxWidth: '280px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{task.title}</td>
                  <td><PriorityBadge priority={task.priority} /></td>
                  <td><StatusBadge status={task.status} /></td>
                  <td style={{ color: 'var(--color-text-secondary)' }}>{task.assignee_name || '—'}</td>
                  <td style={{ color: 'var(--color-text-secondary)', fontSize: '13px' }}>{formatDistanceToNow(new Date(task.created_at), { addSuffix: true })}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
