import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

export default function StatsCard({ title, value, icon: Icon, color = 'var(--color-primary)', trend, trendLabel, subtitle }) {
  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: '14px', color: 'var(--color-text-secondary)', fontWeight: '500' }}>{title}</span>
        <div style={{ padding: '8px', background: `${color}18`, borderRadius: '8px' }}>
          <Icon size={18} color={color} />
        </div>
      </div>
      <div>
        <div style={{ fontSize: '32px', fontWeight: '700', color: 'var(--color-text-primary)', lineHeight: '1' }}>{value}</div>
        {subtitle && <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginTop: '4px' }}>{subtitle}</div>}
      </div>
      {trend !== undefined && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px' }}>
          {trend >= 0
            ? <TrendingUp size={14} color="var(--color-success)" />
            : <TrendingDown size={14} color="var(--color-error)" />}
          <span style={{ color: trend >= 0 ? 'var(--color-success)' : 'var(--color-error)', fontWeight: '500' }}>
            {Math.abs(trend)}%
          </span>
          {trendLabel && <span style={{ color: 'var(--color-text-secondary)' }}>{trendLabel}</span>}
        </div>
      )}
    </div>
  );
}
