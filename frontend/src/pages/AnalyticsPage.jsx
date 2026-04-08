import React, { useState, useEffect } from 'react';
import TasksChart from '../components/Dashboard/TasksChart';
import PriorityChart from '../components/Dashboard/PriorityChart';
import TrendChart from '../components/Dashboard/TrendChart';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function AnalyticsPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [trends, setTrends] = useState([]);
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const canManage = user?.role === 'manager' || user?.role === 'admin';

  useEffect(() => {
    const requests = [
      api.get('/analytics/dashboard'),
      api.get('/analytics/trends'),
    ];
    if (canManage) requests.push(api.get('/analytics/agent-performance'));

    Promise.all(requests).then(([statsRes, trendsRes, agentsRes]) => {
      setStats(statsRes.data.stats);
      setTrends(trendsRes.data.trends);
      if (agentsRes) setAgents(agentsRes.data.agents);
    }).catch(console.error).finally(() => setLoading(false));
  }, [canManage]);

  if (loading) return <div className="loading-container"><div className="spinner" /></div>;

  return (
    <div>
      <div className="page-header">
        <h2 className="page-title">Analytics</h2>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <TrendChart data={trends} />
        <TasksChart data={stats?.tasksByStatus || []} />
        <PriorityChart data={stats?.tasksByPriority || []} />
      </div>

      {/* Task type distribution */}
      {stats?.tasksByType && (
        <div className="card mb-6">
          <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '16px' }}>Tasks by Type</h3>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            {stats.tasksByType.map((item) => (
              <div key={item.type} style={{ flex: '1', minWidth: '120px', padding: '16px', background: 'var(--color-bg)', borderRadius: '8px', textAlign: 'center' }}>
                <div style={{ fontSize: '24px', fontWeight: '700', color: 'var(--color-primary)' }}>{item.count}</div>
                <div style={{ fontSize: '13px', color: 'var(--color-text-secondary)', marginTop: '4px', textTransform: 'capitalize' }}>{item.type?.replace('_', ' ')}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {canManage && agents.length > 0 && (
        <div className="card">
          <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '16px' }}>Agent Performance</h3>
          <div style={{ overflowX: 'auto' }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Agent</th>
                  <th>Department</th>
                  <th>Total Assigned</th>
                  <th>Resolved</th>
                  <th>Active</th>
                  <th>Escalated</th>
                  <th>Avg Resolution (h)</th>
                  <th>Resolution Rate</th>
                </tr>
              </thead>
              <tbody>
                {agents.map((agent) => (
                  <tr key={agent.id}>
                    <td>
                      <div style={{ fontWeight: '500' }}>{agent.full_name}</div>
                      <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>{agent.email}</div>
                    </td>
                    <td style={{ color: 'var(--color-text-secondary)' }}>{agent.department || '—'}</td>
                    <td style={{ fontWeight: '600' }}>{agent.total_assigned}</td>
                    <td style={{ color: 'var(--color-success)', fontWeight: '500' }}>{agent.resolved}</td>
                    <td>{agent.active}</td>
                    <td style={{ color: agent.escalated > 0 ? 'var(--color-warning)' : 'inherit' }}>{agent.escalated}</td>
                    <td>{agent.avg_resolution_hours || '—'}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ flex: 1, height: '6px', background: 'var(--color-border)', borderRadius: '3px', overflow: 'hidden' }}>
                          <div style={{ width: `${agent.resolution_rate || 0}%`, height: '100%', background: 'var(--color-success)', borderRadius: '3px' }} />
                        </div>
                        <span style={{ fontSize: '13px', fontWeight: '500', whiteSpace: 'nowrap' }}>{agent.resolution_rate || 0}%</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
