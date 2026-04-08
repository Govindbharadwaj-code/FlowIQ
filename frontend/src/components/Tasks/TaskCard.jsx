import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Ticket, Database, Code, FileText, Tag, Calendar, User } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import PriorityBadge from './PriorityBadge';
import StatusBadge from './StatusBadge';

const typeIcons = {
  email: Mail,
  ticket: Ticket,
  dataset: Database,
  code_review: Code,
  content: FileText,
  general: Tag,
};

export default function TaskCard({ task }) {
  const navigate = useNavigate();
  const TypeIcon = typeIcons[task.type] || Tag;

  return (
    <div
      onClick={() => navigate(`/tasks/${task.id}`)}
      className="card"
      style={{ cursor: 'pointer', transition: 'all 0.15s ease', padding: '16px' }}
      onMouseEnter={(e) => { e.currentTarget.style.boxShadow = 'var(--shadow-md)'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
      onMouseLeave={(e) => { e.currentTarget.style.boxShadow = 'var(--shadow-sm)'; e.currentTarget.style.transform = 'translateY(0)'; }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px', marginBottom: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
          <div style={{ padding: '6px', background: 'var(--color-bg)', borderRadius: '6px', flexShrink: 0 }}>
            <TypeIcon size={14} color="var(--color-text-secondary)" />
          </div>
          <h3 style={{ fontSize: '14px', fontWeight: '600', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{task.title}</h3>
        </div>
        <PriorityBadge priority={task.priority} />
      </div>

      {task.description && (
        <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)', marginBottom: '12px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
          {task.description}
        </p>
      )}

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', flexWrap: 'wrap' }}>
        <StatusBadge status={task.status} />
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '12px', color: 'var(--color-text-secondary)' }}>
          {task.assignee_name && (
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <User size={12} />
              {task.assignee_name}
            </span>
          )}
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Calendar size={12} />
            {formatDistanceToNow(new Date(task.created_at), { addSuffix: true })}
          </span>
        </div>
      </div>

      {task.ai_tags && task.ai_tags.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '10px' }}>
          {task.ai_tags.slice(0, 3).map((tag) => (
            <span key={tag} style={{ padding: '2px 6px', background: 'var(--color-bg)', borderRadius: '4px', fontSize: '11px', color: 'var(--color-text-secondary)' }}>
              #{tag}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
