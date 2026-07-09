import React, { useState } from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';
import { discussionService } from '../../services/discussionService';

interface VoteControlsProps {
  id: number;
  initialScore: number;
  initialUserVote?: number;
  type: 'thread' | 'comment';
}

export const VoteControls: React.FC<VoteControlsProps> = ({ id, initialScore, initialUserVote = 0, type }) => {
  const [score, setScore] = useState(initialScore);
  const [userVote, setUserVote] = useState(initialUserVote);
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
        if (typeof res.user_vote === 'number') {
          setUserVote(res.user_vote);
        }
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
        <ChevronUp size={24} style={{ color: userVote === 1 ? 'hsl(var(--success))' : 'hsl(var(--text-secondary))' }} />
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
        <ChevronDown size={24} style={{ color: userVote === -1 ? 'hsl(var(--danger))' : 'hsl(var(--text-secondary))' }} />
      </button>
    </div>
  );
};
