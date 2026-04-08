import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const statusColors = { open: '#3b82f6', in_progress: '#8b5cf6', escalated: '#ec4899', resolved: '#10b981', closed: '#6b7280' };

export default function TasksChart({ data = [] }) {
  return (
    <div className="card">
      <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '20px' }}>Tasks by Status</h3>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
          <XAxis dataKey="status" tick={{ fontSize: 12 }} />
          <YAxis tick={{ fontSize: 12 }} />
          <Tooltip formatter={(v) => [v, 'Tasks']} />
          <Bar dataKey="count" radius={[4, 4, 0, 0]}>
            {data.map((entry, i) => (
              <Cell key={i} fill={statusColors[entry.status] || '#3b82f6'} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
