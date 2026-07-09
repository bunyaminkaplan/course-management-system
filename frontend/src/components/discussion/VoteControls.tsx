import React, { useState } from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';
import { discussionService } from '../../services/discussionService';

interface VoteControlsProps {
  id: number;
  initialScore: number;
  type: 'thread' | 'comment';
}

export const VoteControls: React.FC<VoteControlsProps> = ({ id, initialScore, type }) => {
  const [score, setScore] = useState(initialScore);
  const [loading, setLoading] = useState(false);

  const handleVote = async (value: number) => {
    if (loading) return;
    setLoading(true);
    try {
      let res;
      if (type === 'thread') {
        res = await discussionService.voteThread(id, value);
      } else {
        res = await discussionService.voteComment(id, value);
      }
      if (res && typeof res.score === 'number') {
        setScore(res.score);
      }
    } catch (error) {
      console.error('Vote failed:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-col" style={{ alignItems: 'center', gap: '0.2rem', minWidth: '40px' }}>
      <button 
        className="btn" 
        style={{ padding: '0.25rem', background: 'transparent', border: 'none' }}
        onClick={(e) => { e.preventDefault(); handleVote(1); }}
        disabled={loading}
        title="Upvote"
      >
        <ChevronUp size={24} style={{ color: 'hsl(var(--text-secondary))' }} />
      </button>
      <span style={{ fontWeight: 700, fontSize: '1rem', color: 'hsl(var(--text-primary))' }}>
        {score}
      </span>
      <button 
        className="btn" 
        style={{ padding: '0.25rem', background: 'transparent', border: 'none' }}
        onClick={(e) => { e.preventDefault(); handleVote(-1); }}
        disabled={loading}
        title="Downvote"
      >
        <ChevronDown size={24} style={{ color: 'hsl(var(--text-secondary))' }} />
      </button>
    </div>
  );
};
