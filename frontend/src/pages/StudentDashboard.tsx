import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { Pagination } from '../components/Pagination';
import { 
  Bell, 
  FileText, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Calendar, 
  BookOpen, 
  Upload, 
  Award,
  AlertCircle,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';
import './StudentDashboard.css';

interface ExamSubjectScore {
  id?: number;
  subject_name: string;
  correct: number;
  incorrect: number;
  net_score?: number;
}
interface PracticeExam {
  id?: number;
  student: number;
  classroom: number;
  title: string;
  date: string;
  total_net?: number;
  subject_scores: ExamSubjectScore[];
}

interface FeedItem {
  id: number;
  type: 'ANNOUNCEMENT' | 'ASSIGNMENT';
  title: string;
  content: string;
  classroom_id: number;
  classroom_name: string;
  created_at: string;
  deadline?: string | null;
  status?: 'PENDING' | 'SUBMITTED' | 'OVERDUE' | null;
}

interface StudentAssignment {
  id: number;
  assignment: number;
  assignment_details: {
    id: number;
    classroom: number;
    classroom_name: string;
    title: string;
    description: string;
    deadline: string;
    created_at: string;
  };
  student: number;
  status: 'PENDING' | 'SUBMITTED' | 'OVERDUE';
  file_url: string | null;
  grade: string | null;
  submitted_at: string | null;
}

interface Classroom {
  id: number;
  name: string;
}

interface Schedule {
  id: number;
  classroom: number;
  day_of_week: number;
  start_time: string;
  end_time: string;
}

interface Attendance {
  id: number;
  session: number;
  session_details?: {
    date: string;
    classroom_name: string;
  };
  student: number;
  is_present: boolean;
}

interface Session {
  id: number;
  classroom: number;
  date: string;
  status: 'SCHEDULED' | 'READY' | 'ACTIVE' | 'COMPLETED' | 'MISSED';
}

export const StudentDashboard: React.FC = () => {
  const { user } = useAuth();
  const location = useLocation();

  // States
  const [feed, setFeed] = useState<FeedItem[]>([]);
  const [assignments, setAssignments] = useState<StudentAssignment[]>([]);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [attendances, setAttendances] = useState<Attendance[]>([]);
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [practiceExams, setPracticeExams] = useState<PracticeExam[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Submit Assignment Modal State
  const [submitModalOpen, setSubmitModalOpen] = useState(false);
  const [selectedSA, setSelectedSA] = useState<StudentAssignment | null>(null);
  const [fileUrl, setFileUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Filter Feed State
  const [feedFilter, setFeedFilter] = useState<'ALL' | 'ANNOUNCEMENT' | 'ASSIGNMENT'>('ALL');

  // Pagination states
  const [feedPage, setFeedPage] = useState(1);
  const [assignmentPage, setAssignmentPage] = useState(1);
  const [attendancePage, setAttendancePage] = useState(1);
  const [schedulePage, setSchedulePage] = useState(1);
  const [examPage, setExamPage] = useState(1);
  const [expandedExam, setExpandedExam] = useState<number | null>(null);

  const FEED_PER_PAGE = 5;
  const ASSIGNMENTS_PER_PAGE = 6;
  const ATTENDANCE_PER_PAGE = 8;
  const SCHEDULES_PER_PAGE = 8;
  const EXAMS_PER_PAGE = 5;

  const filteredFeed = feed.filter(item => feedFilter === 'ALL' || item.type === feedFilter);
  const totalFeedPages = Math.ceil(filteredFeed.length / FEED_PER_PAGE);
  const paginatedFeed = filteredFeed.slice((feedPage - 1) * FEED_PER_PAGE, feedPage * FEED_PER_PAGE);

  const totalAssignmentPages = Math.ceil(assignments.length / ASSIGNMENTS_PER_PAGE);
  const paginatedAssignments = assignments.slice((assignmentPage - 1) * ASSIGNMENTS_PER_PAGE, assignmentPage * ASSIGNMENTS_PER_PAGE);

  const totalAttendancePages = Math.ceil(attendances.length / ATTENDANCE_PER_PAGE);
  const paginatedAttendances = attendances.slice((attendancePage - 1) * ATTENDANCE_PER_PAGE, attendancePage * ATTENDANCE_PER_PAGE);

  const totalSchedulePages = Math.ceil(schedules.length / SCHEDULES_PER_PAGE);
  const paginatedSchedules = schedules.slice((schedulePage - 1) * SCHEDULES_PER_PAGE, schedulePage * SCHEDULES_PER_PAGE);

  const sortedExams = [...practiceExams].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const totalExamPages = Math.ceil(sortedExams.length / EXAMS_PER_PAGE);
  const paginatedExams = sortedExams.slice((examPage - 1) * EXAMS_PER_PAGE, examPage * EXAMS_PER_PAGE);

  const chartData = [...sortedExams].reverse().map(exam => ({
    name: new Date(exam.date).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' }),
    net: exam.total_net || 0,
    title: exam.title
  }));

  const handleFilterChange = (filter: 'ALL' | 'ANNOUNCEMENT' | 'ASSIGNMENT') => {
    setFeedFilter(filter);
    setFeedPage(1);
  };

  const fetchData = async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      // 1. Fetch Feed
      const feedData = await api.get('/api/feed/');
      setFeed(feedData);

      // 2. Fetch Assignments & filter for current student
      const assData: StudentAssignment[] = await api.get('/api/student-assignments/');
      const studentAss = assData.filter((sa) => sa.student === user.id);
      setAssignments(studentAss);

      // 3. Fetch Classrooms student is enrolled in
      const classData: Classroom[] = await api.get('/api/classrooms/');
      setClassrooms(classData);

      // 4. Fetch Schedules
      const schedData: Schedule[] = await api.get('/api/schedules/');
      // Filter schedules of classrooms this student is enrolled in
      const enrolledClassIds = classData.map((c) => c.id);
      const studentSched = schedData.filter((s) => enrolledClassIds.includes(s.classroom));
      setSchedules(studentSched);

      // 5. Fetch Attendances & Sessions
      const attData: Attendance[] = await api.get('/api/attendances/');
      const studentAtt = attData.filter((a) => a.student === user.id);
      
      const sessData: Session[] = await api.get('/api/sessions/');

      // Map session details to attendance
      const mappedAtt = studentAtt.map((att) => {
        const sess = sessData.find((s) => s.id === att.session);
        const cl = classData.find((c) => c.id === sess?.classroom);
        return {
          ...att,
          session_details: {
            date: sess?.date || '',
            classroom_name: cl?.name || 'Bilinmeyen Ders',
          }
        };
      });
      setAttendances(mappedAtt);

      // 6. Fetch Practice Exams
      try {
        const examData: PracticeExam[] = await api.get('/api/practice-exams/');
        setPracticeExams(examData.filter(e => e.student === user.id));
      } catch (err) {
        console.error("Practice exams not available", err);
      }

    } catch (err: any) {
      setError(err.message || 'Veriler yüklenirken bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user]);

  const handleOpenSubmitModal = (sa: StudentAssignment) => {
    setSelectedSA(sa);
    setFileUrl(sa.file_url || '');
    setSubmitModalOpen(true);
  };

  const handleCloseSubmitModal = () => {
    setSelectedSA(null);
    setFileUrl('');
    setSubmitModalOpen(false);
  };

  const handleSubmitAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSA || !fileUrl.trim()) return;

    setSubmitting(true);
    try {
      const updated = await api.patch(`/api/student-assignments/${selectedSA.id}/`, {
        file_url: fileUrl,
        status: 'SUBMITTED',
        submitted_at: new Date().toISOString()
      });

      // Update state
      setAssignments(assignments.map((sa) => sa.id === selectedSA.id ? updated : sa));
      // Refresh feed too since it shows status
      const updatedFeed = feed.map((item) => 
        (item.type === 'ASSIGNMENT' && item.id === selectedSA.assignment) 
          ? { ...item, status: 'SUBMITTED' as const } 
          : item
      );
      setFeed(updatedFeed);
      
      handleCloseSubmitModal();
      // Reload everything to get clean synced states
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Ödev teslim edilirken hata oluştu.');
    } finally {
      setSubmitting(false);
    }
  };

  const getDayOfWeekName = (dayNum: number) => {
    const days = ['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi', 'Pazar'];
    return days[dayNum] || 'Bilinmeyen Gün';
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <span className="status-badge pending flex-row"><Clock size={14} /> Bekliyor</span>;
      case 'SUBMITTED':
        return <span className="status-badge submitted flex-row"><CheckCircle2 size={14} /> Teslim Edildi</span>;
      case 'OVERDUE':
        return <span className="status-badge overdue flex-row"><XCircle size={14} /> Gecikmiş</span>;
      default:
        return <span className="status-badge">{status}</span>;
    }
  };

  if (loading) {
    return (
      <div className="loading-container flex-col">
        <div className="spinner"></div>
        <p>Verileriniz yükleniyor, lütfen bekleyin...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container card flex-row">
        <AlertCircle size={24} className="danger-text" />
        <div>
          <h3>Veri Yükleme Hatası</h3>
          <p>{error}</p>
          <button className="primary" onClick={fetchData} style={{ marginTop: '0.75rem' }}>Tekrar Dene</button>
        </div>
      </div>
    );
  }

  // Determine which section to show based on routing path
  const activePath = location.pathname;

  return (
    <div className="student-dashboard">
      {/* 1. Birleştirilmiş Pano (Feed) Section */}
      {activePath === '/' && (
        <section className="dashboard-section animate-fade">
          <div className="section-header flex-row">
            <div>
              <h2>Birleştirilmiş Pano</h2>
              <p>Duyurular ve güncel ödevlerinizin tek bir akışı</p>
            </div>
            <div className="filter-tabs flex-row">
              <button 
                className={`filter-tab ${feedFilter === 'ALL' ? 'active' : ''}`}
                onClick={() => handleFilterChange('ALL')}
              >
                Tümü
              </button>
              <button 
                className={`filter-tab ${feedFilter === 'ANNOUNCEMENT' ? 'active' : ''}`}
                onClick={() => handleFilterChange('ANNOUNCEMENT')}
              >
                Duyurular
              </button>
              <button 
                className={`filter-tab ${feedFilter === 'ASSIGNMENT' ? 'active' : ''}`}
                onClick={() => handleFilterChange('ASSIGNMENT')}
              >
                Ödevler
              </button>
            </div>
          </div>

          <div className="feed-list flex-col">
            {paginatedFeed.map((item, idx) => {
              const isAnn = item.type === 'ANNOUNCEMENT';
              return (
                <div key={`${item.type}-${item.id}-${idx}`} className="feed-card card animate-fade">
                  <div className="feed-card-header flex-row">
                    <span className={`type-tag ${isAnn ? 'announcement' : 'assignment'}`}>
                      {isAnn ? <Bell size={14} /> : <FileText size={14} />}
                      {isAnn ? 'Duyuru' : 'Ödev'}
                    </span>
                    <span className="classroom-tag flex-row">
                      <BookOpen size={14} /> {item.classroom_name}
                    </span>
                    <span className="date-tag">
                      {new Date(item.created_at).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  <h3 className="feed-card-title">{item.title}</h3>
                  <p className="feed-card-content">{item.content}</p>

                  {!isAnn && item.deadline && (
                    <div className="feed-card-footer flex-row">
                      <div className="deadline flex-row">
                        <Calendar size={14} />
                        <span>Son Teslim: {new Date(item.deadline).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                      {item.status && getStatusBadge(item.status)}
                    </div>
                  )}
                </div>
              );
            })}
            {filteredFeed.length === 0 && (
              <div className="empty-state card text-center">
                <Bell size={48} className="empty-icon" />
                <h3>Pano Temiz</h3>
                <p>Şu an için sınıfınızda paylaşılan herhangi bir duyuru veya ödev bulunmamaktadır.</p>
              </div>
            )}

            <Pagination
              currentPage={feedPage}
              totalPages={totalFeedPages}
              onPageChange={setFeedPage}
              totalItems={filteredFeed.length}
              itemsPerPage={FEED_PER_PAGE}
            />
          </div>
        </section>
      )}

      {/* 2. Ödevler & Teslimler Section */}
      {activePath === '/assignments' && (
        <section className="dashboard-section assignments-section animate-fade">
          <div className="section-header">
            <h2>Ödevlerim ve Teslimler</h2>
            <p>Atandığınız ödevlerin listesi ve teslim durumları</p>
          </div>

          <div className="assignments-grid grid">
            {paginatedAssignments.map((sa) => (
              <div key={sa.id} className="assignment-card card flex-col">
                <div className="assignment-card-header flex-row">
                  <span className="class-name">{sa.assignment_details.classroom_name}</span>
                  {getStatusBadge(sa.status)}
                </div>

                <h3 className="assignment-title">{sa.assignment_details.title}</h3>
                <p className="assignment-desc">{sa.assignment_details.description}</p>

                <div className="assignment-details-list flex-col">
                  <div className="detail-item flex-row">
                    <Calendar size={16} />
                    <span>Son Gün: {new Date(sa.assignment_details.deadline).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  {sa.submitted_at && (
                    <div className="detail-item flex-row">
                      <CheckCircle2 size={16} className="success-text" />
                      <span>Teslim: {new Date(sa.submitted_at).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  )}
                  {sa.grade !== null && (
                    <div className="detail-item grade-item flex-row">
                      <Award size={16} className="primary-text" />
                      <span>Not: <strong>{sa.grade} / 100</strong></span>
                    </div>
                  )}
                </div>

                <div className="assignment-actions">
                  {sa.status !== 'OVERDUE' && (
                    <button 
                      className={`primary ${sa.status === 'SUBMITTED' ? 'secondary' : ''}`}
                      onClick={() => handleOpenSubmitModal(sa)}
                    >
                      <Upload size={16} />
                      {sa.status === 'SUBMITTED' ? 'Teslimi Güncelle' : 'Ödev Yükle'}
                    </button>
                  )}
                  {sa.status === 'OVERDUE' && (
                    <button className="secondary" disabled>
                      Teslim Süresi Geçti
                    </button>
                  )}
                </div>
              </div>
            ))}
            {assignments.length === 0 && (
              <div className="empty-state card text-center" style={{ gridColumn: '1 / -1' }}>
                <FileText size={48} className="empty-icon" />
                <h3>Ödeviniz Yok</h3>
                <p>Şu ana kadar size atanmış aktif bir ödev bulunmamaktadır.</p>
              </div>
            )}
          </div>

          <Pagination
            currentPage={assignmentPage}
            totalPages={totalAssignmentPages}
            onPageChange={setAssignmentPage}
            totalItems={assignments.length}
            itemsPerPage={ASSIGNMENTS_PER_PAGE}
          />
        </section>
      )}

      {/* 3. Ders Programı & Yoklama Section */}
      {activePath === '/attendance' && (
        <section className="dashboard-section animate-fade">
          <div className="attendance-grid grid">
            
            {/* Weekly Schedule */}
            <div className="schedule-panel card flex-col">
              <h3 className="panel-title flex-row"><Calendar size={20} /> Haftalık Ders Programı</h3>
              <div className="schedule-list flex-col">
                {paginatedSchedules.map((s) => {
                  const clName = classrooms.find((c) => c.id === s.classroom)?.name || 'Ders';
                  return (
                    <div key={s.id} className="schedule-item flex-row">
                      <div className="day-badge">{getDayOfWeekName(s.day_of_week)}</div>
                      <div className="sched-info">
                        <h4>{clName}</h4>
                        <p>{s.start_time.substring(0, 5)} - {s.end_time.substring(0, 5)}</p>
                      </div>
                    </div>
                  );
                })}
                {schedules.length === 0 && (
                  <p className="empty-text">Ders programınız bulunmamaktadır.</p>
                )}
              </div>

              <Pagination
                currentPage={schedulePage}
                totalPages={totalSchedulePages}
                onPageChange={setSchedulePage}
                totalItems={schedules.length}
                itemsPerPage={SCHEDULES_PER_PAGE}
              />
            </div>

            {/* Attendance History */}
            <div className="attendance-panel card flex-col">
              <h3 className="panel-title flex-row"><CheckCircle2 size={20} /> Yoklama Geçmişi</h3>
              <div className="attendance-list flex-col">
                {paginatedAttendances.map((att) => (
                  <div key={att.id} className="attendance-item flex-row">
                    <div className="att-info">
                      <h4>{att.session_details?.classroom_name}</h4>
                      <p>{att.session_details?.date ? new Date(att.session_details.date).toLocaleDateString('tr-TR') : ''}</p>
                    </div>
                    <div className="att-status">
                      {att.is_present ? (
                        <span className="present-badge flex-row"><CheckCircle2 size={14} /> Derste</span>
                      ) : (
                        <span className="absent-badge flex-row"><XCircle size={14} /> Devamsız</span>
                      )}
                    </div>
                  </div>
                ))}
                {attendances.length === 0 && (
                  <p className="empty-text">Henüz işlenmiş bir ders yoklama kaydınız bulunmamaktadır.</p>
                )}
              </div>

              <Pagination
                currentPage={attendancePage}
                totalPages={totalAttendancePages}
                onPageChange={setAttendancePage}
                totalItems={attendances.length}
                itemsPerPage={ATTENDANCE_PER_PAGE}
              />
            </div>

          </div>
        </section>
      )}

      {/* 4. Deneme Geçmişim Section */}
      {activePath === '/practice-exams' && (
        <section className="dashboard-section animate-fade">
          <div className="section-header">
            <h2>Deneme Sınavı Geçmişim</h2>
            <p>Girdiğiniz deneme sınavlarının netleri ve detaylı analizleri</p>
          </div>

          <div className="exam-chart-card card" style={{ height: '350px', marginBottom: '2rem' }}>
            <h3 className="panel-title flex-row"><Award size={20} /> Net Gelişimi</h3>
            <div style={{ width: '100%', height: '280px' }}>
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                    <XAxis dataKey="name" stroke="var(--text-secondary)" />
                    <YAxis stroke="var(--text-secondary)" />
                    <RechartsTooltip 
                      contentStyle={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)', borderRadius: '8px', color: 'var(--text-primary)' }}
                      itemStyle={{ color: 'var(--primary-color)' }}
                    />
                    <Line type="monotone" dataKey="net" stroke="var(--primary-color)" strokeWidth={3} dot={{ r: 5 }} activeDot={{ r: 8 }} />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex-col" style={{ height: '100%', justifyContent: 'center', alignItems: 'center', color: 'var(--text-secondary)' }}>
                  <Award size={48} opacity={0.5} style={{ marginBottom: '1rem' }} />
                  <p>Henüz deneme sınavı veriniz bulunmamaktadır.</p>
                </div>
              )}
            </div>
          </div>

          <div className="exam-table-card card">
            <h3 className="panel-title flex-row"><FileText size={20} /> Sınav Detayları</h3>
            
            <div className="exam-list flex-col">
              {paginatedExams.map((exam) => {
                const isExpanded = expandedExam === exam.id;
                return (
                  <div key={exam.id} className="exam-item-container" style={{ border: '1px solid var(--border-color)', borderRadius: '8px', marginBottom: '1rem', overflow: 'hidden' }}>
                    <div 
                      className="exam-item-header flex-row" 
                      style={{ padding: '1rem', background: 'var(--bg-secondary)', cursor: 'pointer', justifyContent: 'space-between' }}
                      onClick={() => setExpandedExam(isExpanded ? null : (exam.id as number))}
                    >
                      <div className="exam-info flex-row" style={{ gap: '2rem' }}>
                        <div>
                          <strong style={{ display: 'block', fontSize: '1.1rem' }}>{exam.title}</strong>
                          <span className="text-secondary" style={{ fontSize: '0.9rem' }}>{new Date(exam.date).toLocaleDateString('tr-TR')}</span>
                        </div>
                        <div className="exam-net flex-col" style={{ alignItems: 'flex-start' }}>
                          <span className="text-secondary" style={{ fontSize: '0.8rem' }}>Toplam Net</span>
                          <strong className="primary-text" style={{ fontSize: '1.2rem' }}>{exam.total_net?.toFixed(2) || '0.00'}</strong>
                        </div>
                      </div>
                      <div className="expand-icon">
                        {isExpanded ? <ChevronUp size={24} /> : <ChevronDown size={24} />}
                      </div>
                    </div>
                    
                    {isExpanded && (
                      <div className="exam-item-body animate-fade" style={{ padding: '1rem' }}>
                        <table className="submissions-table" style={{ margin: 0, width: '100%', textAlign: 'left' }}>
                          <thead>
                            <tr>
                              <th>Ders Adı</th>
                              <th>Doğru</th>
                              <th>Yanlış</th>
                              <th>Net</th>
                            </tr>
                          </thead>
                          <tbody>
                            {exam.subject_scores.map((score, idx) => (
                              <tr key={idx}>
                                <td><strong>{score.subject_name}</strong></td>
                                <td className="success-text">{score.correct}</td>
                                <td className="danger-text">{score.incorrect}</td>
                                <td><strong>{score.net_score?.toFixed(2) || '0.00'}</strong></td>
                              </tr>
                            ))}
                            {exam.subject_scores.length === 0 && (
                              <tr>
                                <td colSpan={4} className="text-center">Detay bulunamadı.</td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                );
              })}
              {practiceExams.length === 0 && (
                <p className="empty-text text-center" style={{ padding: '2rem' }}>Sınav geçmişiniz bulunmamaktadır.</p>
              )}
            </div>

            {totalExamPages > 1 && (
              <Pagination
                currentPage={examPage}
                totalPages={totalExamPages}
                onPageChange={setExamPage}
                totalItems={sortedExams.length}
                itemsPerPage={EXAMS_PER_PAGE}
              />
            )}
          </div>
        </section>
      )}

      {/* Submit Assignment Modal */}
      {submitModalOpen && selectedSA && (
        <div className="modal-overlay flex-row animate-fade" onClick={handleCloseSubmitModal}>
          <div className="modal-card card glass animate-fade" onClick={(e) => e.stopPropagation()}>
            <h3>Ödev Teslim Et</h3>
            <p className="modal-subtitle">{selectedSA.assignment_details.title}</p>
            
            <form onSubmit={handleSubmitAssignment} className="modal-form flex-col">
              <div className="input-group">
                <label htmlFor="file-url">Dosya Linki (URL)</label>
                <input
                  id="file-url"
                  type="url"
                  placeholder="https://drive.google.com/file/... veya dosya linkiniz"
                  value={fileUrl}
                  onChange={(e) => setFileUrl(e.target.value)}
                  disabled={submitting}
                  required
                />
              </div>

              <div className="modal-actions flex-row">
                <button type="button" className="secondary" onClick={handleCloseSubmitModal} disabled={submitting}>
                  İptal
                </button>
                <button type="submit" className="primary" disabled={submitting}>
                  {submitting ? 'Gönderiliyor...' : 'Ödevi Gönder'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
export default StudentDashboard;
