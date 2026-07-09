import React from 'react';
import { useNavigate } from 'react-router-dom';
import { type Thread } from '../../services/discussionService';
import { MessageSquare } from 'lucide-react';

interface ThreadCardProps {
  thread: Thread;
}

export const ThreadCard: React.FC<ThreadCardProps> = ({ thread }) => {
  const navigate = useNavigate();

  // Helper to count total nested comments deeply
  const countComments = (comments: any[] | undefined): number => {
    if (!comments) return 0;
    return comments.reduce((acc, comment) => acc + 1 + countComments(comment.replies), 0);
  };

  const totalComments = countComments(thread.comments);

  return (
    <div 
      className="card glass animate-fade flex-row" 
      style={{ cursor: 'pointer', marginBottom: '1rem', gap: '1.5rem', alignItems: 'center' }}
      onClick={() => navigate(`/forum/thread/${thread.id}`)}
      onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'hsl(var(--primary))'; }}
      onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'hsl(var(--border))'; }}
    >
      <div className="flex-col" style={{ alignItems: 'center', minWidth: '50px', color: 'hsl(var(--text-secondary))' }}>
        <span style={{ fontSize: '1.25rem', fontWeight: 700, color: 'hsl(var(--text-primary))' }}>{thread.score}</span>
        <span style={{ fontSize: '0.8rem' }}>oy</span>
      </div>

      <div className="flex-col" style={{ flex: 1, gap: '0.5rem' }}>
        <h3 style={{ color: 'hsl(var(--primary))', margin: 0, fontSize: '1.2rem' }}>{thread.title}</h3>
        <p style={{ color: 'hsl(var(--text-secondary))', fontSize: '0.95rem', margin: 0, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
          {thread.content}
        </p>
        <div className="flex-row" style={{ gap: '1.5rem', fontSize: '0.85rem', color: 'hsl(var(--text-tertiary))', marginTop: '0.5rem' }}>
          <span>Yazan: {thread.author.first_name || thread.author.username} {thread.author.last_name}</span>
          <span>{new Date(thread.created_at).toLocaleDateString()}</span>
          <span className="flex-row" style={{ gap: '0.4rem' }}>
            <MessageSquare size={14} /> 
            {totalComments} yanıt
          </span>
        </div>
      </div>
    </div>
  );
};
