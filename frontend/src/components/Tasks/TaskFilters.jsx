import React from 'react';
import { Search } from 'lucide-react';

export default function TaskFilters({ filters, onChange }) {
  const handleChange = (key, value) => onChange({ ...filters, [key]: value, page: 1 });

  return (
    <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '20px' }}>
      <div style={{ position: 'relative', flex: '1', minWidth: '200px' }}>
        <Search size={16} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-secondary)' }} />
        <input
          type="text"
          placeholder="Search tasks..."
          value={filters.search || ''}
          onChange={(e) => handleChange('search', e.target.value)}
          className="form-input"
          style={{ paddingLeft: '34px' }}
        />
      </div>
      <select className="form-input form-select" style={{ width: 'auto', minWidth: '140px' }} value={filters.status || ''} onChange={(e) => handleChange('status', e.target.value)}>
        <option value="">All Status</option>
        <option value="open">Open</option>
        <option value="in_progress">In Progress</option>
        <option value="escalated">Escalated</option>
        <option value="resolved">Resolved</option>
        <option value="closed">Closed</option>
      </select>
      <select className="form-input form-select" style={{ width: 'auto', minWidth: '140px' }} value={filters.priority || ''} onChange={(e) => handleChange('priority', e.target.value)}>
        <option value="">All Priority</option>
        <option value="critical">Critical</option>
        <option value="high">High</option>
        <option value="medium">Medium</option>
        <option value="low">Low</option>
      </select>
      <select className="form-input form-select" style={{ width: 'auto', minWidth: '140px' }} value={filters.type || ''} onChange={(e) => handleChange('type', e.target.value)}>
        <option value="">All Types</option>
        <option value="email">Email</option>
        <option value="ticket">Ticket</option>
        <option value="dataset">Dataset</option>
        <option value="code_review">Code Review</option>
        <option value="content">Content</option>
        <option value="general">General</option>
      </select>
    </div>
  );
}
