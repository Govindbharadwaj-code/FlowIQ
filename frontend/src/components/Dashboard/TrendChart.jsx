import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { format, parseISO } from 'date-fns';

export default function TrendChart({ data = [] }) {
  const chartData = data.map((d) => ({ ...d, dateLabel: format(parseISO(d.date), 'MMM d') }));
  return (
    <div className="card">
      <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '20px' }}>30-Day Task Trend</h3>
      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
          <XAxis dataKey="dateLabel" tick={{ fontSize: 11 }} interval="preserveStartEnd" />
          <YAxis tick={{ fontSize: 12 }} />
          <Tooltip formatter={(v) => [v, 'Tasks']} />
          <Line type="monotone" dataKey="count" stroke="var(--color-primary)" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
