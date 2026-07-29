import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { discussionService, type Thread } from '../services/discussionService';
import { ThreadCard } from '../components/discussion/ThreadCard';
import { Pagination } from '../components/Pagination';

export const ForumPage: React.FC = () => {
  const [classrooms, setClassrooms] = useState<any[]>([]);
  const [selectedClassroomId, setSelectedClassroomId] = useState<number | null>(null);
  const [threads, setThreads] = useState<Thread[]>([]);
  const [loading, setLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');

  // Pagination state
  const [threadPage, setThreadPage] = useState(1);
  const THREADS_PER_PAGE = 5;

  const totalThreadPages = Math.ceil(threads.length / THREADS_PER_PAGE);
  const paginatedThreads = threads.slice((threadPage - 1) * THREADS_PER_PAGE, threadPage * THREADS_PER_PAGE);

  // Fetch classrooms on mount
  useEffect(() => {
    const fetchClassrooms = async () => {
      try {
        // Assume /api/classrooms/ returns classes the user is enrolled in/instructs
        const data = await api.get('/api/classrooms/');
        setClassrooms(data);
        if (data && data.length > 0) {
          setSelectedClassroomId(data[0].id);
        }
      } catch (err) {
        console.error('Error fetching classrooms', err);
      }
    };
    fetchClassrooms();
  }, []);

  // Fetch threads when classroom changes
  useEffect(() => {
    const fetchThreads = async () => {
      if (!selectedClassroomId) return;
      setLoading(true);
      setThreadPage(1);
      try {
        const data = await discussionService.getThreadsByClassroom(selectedClassroomId);
        // Sort threads by score descending
        data.sort((a: Thread, b: Thread) => b.score - a.score);
        setThreads(data);
      } catch (err) {
        console.error('Error fetching threads', err);
      } finally {
        setLoading(false);
      }
    };
    fetchThreads();
  }, [selectedClassroomId]);

  const handleCreateThread = async () => {
    if (!selectedClassroomId || !newTitle.trim() || !newContent.trim()) return;
    try {
      const thread = await discussionService.createThread(selectedClassroomId, newTitle, newContent);
      setThreads([thread, ...threads].sort((a, b) => b.score - a.score));
      setNewTitle('');
      setNewContent('');
      setIsCreating(false);
      setThreadPage(1);
    } catch (err) {
      console.error('Failed to create thread', err);
    }
  };

  return (
    <div className="animate-fade" style={{ maxWidth: '900px', margin: '0 auto', padding: 'var(--space-xl) var(--space-md)' }}>
      <div className="flex-row" style={{ justifyContent: 'space-between', marginBottom: 'var(--space-xl)' }}>
        <h2>Soru & Cevap (Forum)</h2>
        
        <select 
          value={selectedClassroomId || ''} 
          onChange={(e) => setSelectedClassroomId(Number(e.target.value))}
          style={{ minWidth: '200px' }}
        >
          {classrooms.map(c => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>

      <div style={{ marginBottom: 'var(--space-xl)' }}>
        {!isCreating ? (
          <button className="btn primary" onClick={() => setIsCreating(true)}>+ Yeni Başlık Aç</button>
        ) : (
          <div className="card glass animate-fade">
            <h3 style={{ marginBottom: 'var(--space-md)', color: 'hsl(var(--primary))' }}>Yeni Başlık</h3>
            <label>Konu Başlığı</label>
            <input 
              style={{ width: '100%', marginBottom: 'var(--space-md)' }} 
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Örn: Vize Sınavı Konuları"
            />
            <label>İçerik</label>
            <textarea 
              style={{ width: '100%', minHeight: '120px', marginBottom: 'var(--space-md)' }}
              value={newContent}
              onChange={(e) => setNewContent(e.target.value)}
              placeholder="Sorunuzu veya düşüncenizi detaylıca yazın..."
            />
            <div className="flex-row" style={{ gap: 'var(--space-md)' }}>
              <button className="btn primary" onClick={handleCreateThread} disabled={!newTitle.trim() || !newContent.trim()}>
                Başlığı Yayınla
              </button>
              <button className="btn secondary" onClick={() => setIsCreating(false)}>İptal</button>
            </div>
          </div>
        )}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', color: 'hsl(var(--text-tertiary))', padding: 'var(--space-xl)' }}>
          Başlıklar yükleniyor...
        </div>
      ) : threads.length === 0 ? (
        <div className="card glass" style={{ textAlign: 'center', color: 'hsl(var(--text-tertiary))', padding: 'var(--space-2xl)' }}>
          Bu sınıfta henüz hiç başlık açılmamış. Sorusunu soran ilk sen ol!
        </div>
      ) : (
        <div className="flex-col">
          {paginatedThreads.map(thread => (
            <ThreadCard key={thread.id} thread={thread} />
          ))}

          <Pagination
            currentPage={threadPage}
            totalPages={totalThreadPages}
            onPageChange={setThreadPage}
            totalItems={threads.length}
            itemsPerPage={THREADS_PER_PAGE}
          />
        </div>
      )}
    </div>
  );
};

export default ForumPage;
