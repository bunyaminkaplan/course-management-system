import React, { useState } from 'react';
import { type Comment, discussionService } from '../../services/discussionService';
import { VoteControls } from './VoteControls';
import { MessageSquare } from 'lucide-react';

interface CommentItemProps {
  comment: Comment;
  onReplyAdded: () => void;
}

export const CommentItem: React.FC<CommentItemProps> = ({ comment, onReplyAdded }) => {
  const [isReplying, setIsReplying] = useState(false);
  const [replyContent, setReplyContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmitReply = async () => {
    if (!replyContent.trim()) return;
    setIsSubmitting(true);
    try {
      await discussionService.createComment(comment.thread, replyContent, comment.id);
      setReplyContent('');
      setIsReplying(false);
      onReplyAdded();
    } catch (err) {
      console.error('Error adding reply', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex-col animate-fade" style={{ marginTop: '1rem' }}>
      <div className="flex-row" style={{ alignItems: 'flex-start', gap: '1rem' }}>
        <VoteControls id={comment.id} initialScore={comment.score} initialUserVote={comment.user_vote} type="comment" />
        
        <div className="flex-col" style={{ flex: 1 }}>
          <div className="flex-row" style={{ gap: '0.5rem', marginBottom: '0.5rem' }}>
            <span style={{ fontWeight: 600, color: 'hsl(var(--primary))' }}>
              {comment.author.first_name || comment.author.username} {comment.author.last_name}
            </span>
            <span style={{ fontSize: '0.85rem', color: 'hsl(var(--text-tertiary))' }}>
              {new Date(comment.created_at).toLocaleString()}
            </span>
          </div>
          
          <div style={{ color: 'hsl(var(--text-secondary))', lineHeight: 1.6, marginBottom: '0.75rem', whiteSpace: 'pre-wrap' }}>
            {comment.content}
          </div>
          
          <button 
            className="btn" 
            style={{ padding: '0.25rem 0.5rem', fontSize: '0.85rem', background: 'transparent', border: 'none', color: 'hsl(var(--text-tertiary))', width: 'fit-content' }}
            onClick={() => setIsReplying(!isReplying)}
          >
            <MessageSquare size={16} /> {isReplying ? 'İptal' : 'Yanıtla'}
          </button>

          {isReplying && (
            <div className="card" style={{ marginTop: '0.5rem', padding: '1rem' }}>
              <textarea
                style={{ width: '100%', minHeight: '80px', marginBottom: '0.5rem' }}
                placeholder="Yanıtınızı yazın..."
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
              />
              <button 
                className="btn primary" 
                onClick={handleSubmitReply}
                disabled={isSubmitting || !replyContent.trim()}
              >
                Yanıt Gönder
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Nested Replies (Recursive Rendering) */}
      {comment.replies && comment.replies.length > 0 && (
        <div className="flex-col" style={{ 
          marginLeft: '1.5rem', 
          paddingLeft: '1rem', 
          borderLeft: '2px solid hsl(var(--border))',
          marginTop: '0.5rem'
        }}>
          {comment.replies.map(reply => (
            <CommentItem key={reply.id} comment={reply} onReplyAdded={onReplyAdded} />
          ))}
        </div>
      )}
    </div>
  );
};
