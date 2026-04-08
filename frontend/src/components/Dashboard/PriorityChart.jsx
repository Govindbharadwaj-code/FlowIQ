import React from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const COLORS = { critical: '#dc2626', high: '#ea580c', medium: '#d97706', low: '#16a34a' };

export default function PriorityChart({ data = [] }) {
  return (
    <div className="card">
      <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '20px' }}>Tasks by Priority</h3>
      <ResponsiveContainer width="100%" height={220}>
        <PieChart>
          <Pie data={data} dataKey="count" nameKey="priority" cx="50%" cy="50%" outerRadius={80} label={({ priority, percent }) => `${priority} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
            {data.map((entry) => (
              <Cell key={entry.priority} fill={COLORS[entry.priority] || '#6b7280'} />
            ))}
          </Pie>
          <Tooltip formatter={(v, name) => [v, name]} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
