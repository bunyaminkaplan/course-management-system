import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { discussionService, type Thread } from '../services/discussionService';
import { CommentItem } from '../components/discussion/CommentItem';
import { VoteControls } from '../components/discussion/VoteControls';
import { ArrowLeft } from 'lucide-react';

export const ThreadPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [thread, setThread] = useState<Thread | null>(null);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchThread = async () => {
    if (!id) return;
    try {
      const data = await discussionService.getThreadDetails(Number(id));
      // Sort top level comments by score
      if (data.comments) {
        data.comments.sort((a: any, b: any) => b.score - a.score);
      }
      setThread(data);
    } catch (err) {
      console.error('Failed to load thread', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchThread();
  }, [id]);

  const handlePostComment = async () => {
    if (!thread || !newComment.trim()) return;
    setSubmitting(true);
    try {
      await discussionService.createComment(thread.id, newComment);
      setNewComment('');
      await fetchThread(); // Reload to see new comment
    } catch (err) {
      console.error('Failed to post comment', err);
    } finally {
      setSubmitting(false);
    }
  };

  // Helper to count total nested comments deeply
  const countComments = (comments: any[] | undefined): number => {
    if (!comments) return 0;
    return comments.reduce((acc, comment) => acc + 1 + countComments(comment.replies), 0);
  };

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '3rem', color: 'hsl(var(--text-secondary))' }}>Başlık yükleniyor...</div>;
  }

  if (!thread) {
    return <div style={{ textAlign: 'center', padding: '3rem', color: 'hsl(var(--danger))' }}>Başlık bulunamadı.</div>;
  }

  const totalComments = countComments(thread.comments);

  return (
    <div className="animate-fade" style={{ maxWidth: '900px', margin: '0 auto', padding: '2rem 1rem' }}>
      <button 
        className="btn" 
        onClick={() => navigate('/forum')} 
        style={{ background: 'transparent', border: 'none', color: 'hsl(var(--text-secondary))', marginBottom: '1.5rem', padding: 0 }}
      >
        <ArrowLeft size={20} /> Forumlara Dön
      </button>

      {/* Main Thread Content */}
      <div className="card glass flex-row" style={{ alignItems: 'flex-start', gap: '1.5rem', marginBottom: '2rem' }}>
        <VoteControls id={thread.id} initialScore={thread.score} type="thread" />
        
        <div className="flex-col" style={{ flex: 1 }}>
          <h1 style={{ color: 'hsl(var(--primary))', marginBottom: '0.5rem', fontSize: '1.8rem' }}>
            {thread.title}
          </h1>
          <div className="flex-row" style={{ gap: '1rem', color: 'hsl(var(--text-tertiary))', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
            <span>Yazan: {thread.author.first_name || thread.author.username} {thread.author.last_name}</span>
            <span>{new Date(thread.created_at).toLocaleString()}</span>
          </div>
          
          <div style={{ color: 'hsl(var(--text-primary))', fontSize: '1.05rem', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>
            {thread.content}
          </div>
        </div>
      </div>

      {/* Reply Box */}
      <div className="card" style={{ marginBottom: '3rem' }}>
        <h3 style={{ marginBottom: '1rem', fontSize: '1.1rem', color: 'hsl(var(--primary))' }}>Bu başlığa cevap yaz</h3>
        <textarea
          style={{ width: '100%', minHeight: '100px', marginBottom: '1rem' }}
          placeholder="Düşüncelerinizi buraya yazın..."
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
        />
        <button 
          className="btn primary" 
          onClick={handlePostComment}
          disabled={submitting || !newComment.trim()}
        >
          Cevabı Gönder
        </button>
      </div>

      {/* Comments List */}
      <div>
        <h3 style={{ marginBottom: '1.5rem', borderBottom: '1px solid hsl(var(--border))', paddingBottom: '0.5rem' }}>
          Tüm Yanıtlar ({totalComments})
        </h3>
        {thread.comments && thread.comments.length > 0 ? (
          <div className="flex-col">
            {thread.comments.map(comment => (
              <CommentItem 
                key={comment.id} 
                comment={comment} 
                onReplyAdded={fetchThread} 
              />
            ))}
          </div>
        ) : (
          <div style={{ color: 'hsl(var(--text-tertiary))', fontStyle: 'italic', textAlign: 'center', padding: '2rem' }}>
            Henüz kimse cevap vermemiş. İlk cevap veren sen ol!
          </div>
        )}
      </div>
    </div>
  );
};

export default ThreadPage;
