import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { Pagination } from '../components/Pagination';
import { 
  BookOpen, 
  Users, 
  Megaphone, 
  FileText, 
  PlusCircle, 
  CheckSquare, 
  Award,
  AlertCircle,
  Clock,
  Play,
  CheckCircle,
  ExternalLink,
  X
} from 'lucide-react';
import { useLocation as useRouterLocation } from 'react-router-dom';
import './InstructorDashboard.css';

interface ExamSubjectScore {
  id?: number;
  subject_name: string;
  correct: number;
  incorrect: number;
  net_score?: number;
}
interface PracticeExam {
  id?: number;
  student: number; // student id
  classroom: number; // classroom id
  title: string;
  date: string;
  total_net?: number;
  subject_scores: ExamSubjectScore[];
}

interface Classroom {
  id: number;
  name: string;
  instructors: { id: number; username: string }[];
  students: { id: number; username: string; first_name: string; last_name: string }[];
  created_at: string;
}

interface Announcement {
  id: number;
  classroom: number;
  classroom_name: string;
  title: string;
  content: string;
  created_at: string;
}

interface Assignment {
  id: number;
  classroom: number;
  classroom_name: string;
  title: string;
  description: string;
  deadline: string;
  created_at: string;
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
  };
  student: number;
  student_details?: {
    username: string;
    first_name: string;
    last_name: string;
  };
  status: 'PENDING' | 'SUBMITTED' | 'OVERDUE';
  file_url: string | null;
  grade: string | null;
  submitted_at: string | null;
}

interface Session {
  id: number;
  schedule: number | null;
  classroom: number;
  classroom_name?: string;
  date: string;
  status: 'SCHEDULED' | 'READY' | 'ACTIVE' | 'COMPLETED' | 'MISSED';
}

interface Attendance {
  id: number;
  session: number;
  student: number;
  is_present: boolean;
}

interface User {
  id: number;
  username: string;
  first_name: string;
  last_name: string;
  role: string;
}

export const InstructorDashboard: React.FC = () => {
  const { user } = useAuth();
  const location = useRouterLocation();

  // Data States
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [submissions, setSubmissions] = useState<StudentAssignment[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Creation Form State
  const [createType, setCreateType] = useState<'ANNOUNCEMENT' | 'ASSIGNMENT'>('ANNOUNCEMENT');
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [deadline, setDeadline] = useState('');
  const [creating, setCreating] = useState(false);

  // Attendance Sheet State
  const [activeSession, setActiveSession] = useState<Session | null>(null);
  const [attendanceList, setAttendanceList] = useState<{ studentId: number; isPresent: boolean }[]>([]);
  const [savingAttendance, setSavingAttendance] = useState(false);

  // Grading Modal State
  const [selectedSubmission, setSelectedSubmission] = useState<StudentAssignment | null>(null);
  const [gradeValue, setGradeValue] = useState<string>('');
  const [savingGrade, setSavingGrade] = useState(false);

  // Pagination state
  const [submissionPage, setSubmissionPage] = useState(1);
  const SUBMISSIONS_PER_PAGE = 8;

  // Practice Exam Form State
  const [examClassId, setExamClassId] = useState<string>('');
  const [examStudentId, setExamStudentId] = useState<string>('');
  const [examTitle, setExamTitle] = useState('');
  const [examDate, setExamDate] = useState('');
  const [examSubjects, setExamSubjects] = useState<Omit<ExamSubjectScore, 'id' | 'net_score'>[]>([{ subject_name: '', correct: 0, incorrect: 0 }]);
  const [savingExam, setSavingExam] = useState(false);

  const submittedList = submissions.filter(s => s.status === 'SUBMITTED');
  const totalSubmissionPages = Math.ceil(submittedList.length / SUBMISSIONS_PER_PAGE);
  const paginatedSubmissions = submittedList.slice((submissionPage - 1) * SUBMISSIONS_PER_PAGE, submissionPage * SUBMISSIONS_PER_PAGE);

  const fetchData = async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      // 1. Fetch Classrooms
      const classData: Classroom[] = await api.get('/api/classrooms/');
      // Filter classrooms where this user is one of the instructors
      const instructorClasses = classData.filter(c => c.instructors.some(inst => inst.id === user.id));
      setClassrooms(instructorClasses);
      
      if (instructorClasses.length > 0 && !selectedClassId) {
        setSelectedClassId(String(instructorClasses[0].id));
      }

      // 2. Fetch Users to map student details
      const usersData: User[] = await api.get('/api/users/');

      // 3. Fetch Announcements
      const annData: Announcement[] = await api.get('/api/announcements/');
      setAnnouncements(annData);

      // 4. Fetch Assignments
      const assData: Assignment[] = await api.get('/api/assignments/');
      setAssignments(assData);

      // 5. Fetch Submissions and filter relevant to classrooms taught
      const classIds = instructorClasses.map(c => c.id);
      const subData: StudentAssignment[] = await api.get('/api/student-assignments/');
      const relevantSubs = subData.filter(sub => 
        classIds.includes(sub.assignment_details.classroom)
      ).map(sub => {
        const studentInfo = usersData.find(u => u.id === sub.student);
        return {
          ...sub,
          student_details: studentInfo ? {
            username: studentInfo.username,
            first_name: studentInfo.first_name,
            last_name: studentInfo.last_name,
          } : undefined
        };
      });
      setSubmissions(relevantSubs);

      // 6. Fetch Sessions for instructor's classrooms
      const sessData: Session[] = await api.get('/api/sessions/');
      const todayString = new Date().toISOString().split('T')[0];
      
      const relevantSessions = sessData.filter(s => 
        classIds.includes(s.classroom) && s.date === todayString
      ).map(s => {
        const cl = instructorClasses.find(c => c.id === s.classroom);
        return {
          ...s,
          classroom_name: cl?.name || 'Ders',
        };
      });
      setSessions(relevantSessions);

    } catch (err: any) {
      setError(err.message || 'Veriler yüklenirken bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user]);

  // Form creation handler
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClassId || !title.trim() || !content.trim()) {
      alert('Lütfen tüm gerekli alanları doldurunuz.');
      return;
    }

    setCreating(true);
    try {
      if (createType === 'ANNOUNCEMENT') {
        await api.post('/api/announcements/', {
          classroom: Number(selectedClassId),
          title,
          content
        });
        alert('Duyuru başarıyla oluşturuldu!');
      } else {
        if (!deadline) {
          alert('Ödev için son teslim tarihi zorunludur.');
          setCreating(false);
          return;
        }
        await api.post('/api/assignments/', {
          classroom: Number(selectedClassId),
          title,
          description: content,
          deadline: new Date(deadline).toISOString()
        });
        alert('Ödev başarıyla oluşturuldu!');
      }

      // Reset
      setTitle('');
      setContent('');
      setDeadline('');
      fetchData(); // reload
    } catch (err: any) {
      alert(err.message || 'Hata oluştu.');
    } finally {
      setCreating(false);
    }
  };

  // Start Session Attendance
  const handleStartAttendance = async (session: Session) => {
    try {
      // 1. Update session status to ACTIVE
      await api.patch(`/api/sessions/${session.id}/`, {
        status: 'ACTIVE'
      });

      // Update in UI state
      setSessions(sessions.map(s => s.id === session.id ? { ...s, status: 'ACTIVE' } : s));
      
      // Get students of this classroom
      const cl = classrooms.find(c => c.id === session.classroom);
      if (cl) {
        // Initialize attendance lists
        const list = cl.students.map(std => ({ studentId: std.id, isPresent: false }));
        setAttendanceList(list);
        setActiveSession({ ...session, status: 'ACTIVE' });
      }
    } catch (err: any) {
      alert(err.message || 'Oturum başlatılamadı.');
    }
  };

  const handleOpenActiveAttendance = (session: Session) => {
    const cl = classrooms.find(c => c.id === session.classroom);
    if (cl) {
      // Fetch current attendance list if exists, otherwise initialize empty
      api.get('/api/attendances/').then((atts: Attendance[]) => {
        const sessionAtts = atts.filter(a => a.session === session.id);
        const list = cl.students.map(std => {
          const matched = sessionAtts.find(sa => sa.student === std.id);
          return { studentId: std.id, isPresent: matched ? matched.is_present : false };
        });
        setAttendanceList(list);
        setActiveSession(session);
      }).catch(() => {
        const list = cl.students.map(std => ({ studentId: std.id, isPresent: false }));
        setAttendanceList(list);
        setActiveSession(session);
      });
    }
  };

  const handleTogglePresent = (studentId: number) => {
    setAttendanceList(attendanceList.map(a => 
      a.studentId === studentId ? { ...a, isPresent: !a.isPresent } : a
    ));
  };

  const handleSaveAttendance = async () => {
    if (!activeSession) return;
    setSavingAttendance(true);
    try {
      // Save all attendance items one by one (or bulk if API supported, standard Django REST bulk can be simulated)
      // Standard AttendanceViewSet expects { session, student, is_present }
      // We will read existing attendances to see if we do POST or PUT
      const existingAtts: Attendance[] = await api.get('/api/attendances/');
      
      for (const item of attendanceList) {
        const matched = existingAtts.find(a => a.session === activeSession.id && a.student === item.studentId);
        
        if (matched) {
          // Update
          await api.put(`/api/attendances/${matched.id}/`, {
            session: activeSession.id,
            student: item.studentId,
            is_present: item.isPresent
          });
        } else {
          // Create new
          await api.post('/api/attendances/', {
            session: activeSession.id,
            student: item.studentId,
            is_present: item.isPresent
          });
        }
      }

      // Complete session
      await api.patch(`/api/sessions/${activeSession.id}/`, {
        status: 'COMPLETED'
      });

      alert('Yoklama başarıyla kaydedildi ve oturum kapatıldı.');
      setActiveSession(null);
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Yoklama kaydedilemedi.');
    } finally {
      setSavingAttendance(false);
    }
  };

  // Open Grading Modal
  const handleOpenGradingModal = (sub: StudentAssignment) => {
    setSelectedSubmission(sub);
    setGradeValue(sub.grade || '');
  };

  const handleSaveGrade = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSubmission || !gradeValue.trim()) return;

    setSavingGrade(true);
    try {
      const updated = await api.patch(`/api/student-assignments/${selectedSubmission.id}/`, {
        grade: Number(gradeValue)
      });

      setSubmissions(submissions.map(s => s.id === selectedSubmission.id ? { ...s, grade: updated.grade } : s));
      alert('Not başarıyla kaydedildi.');
      setSelectedSubmission(null);
    } catch (err: any) {
      alert(err.message || 'Not kaydedilemedi.');
    } finally {
      setSavingGrade(false);
    }
  };

  const handleAddExamSubject = () => {
    setExamSubjects([...examSubjects, { subject_name: '', correct: 0, incorrect: 0 }]);
  };

  const handleUpdateExamSubject = (index: number, field: keyof Omit<ExamSubjectScore, 'id' | 'net_score'>, value: string | number) => {
    const updated = [...examSubjects];
    updated[index] = { ...updated[index], [field]: value };
    setExamSubjects(updated);
  };

  const handleRemoveExamSubject = (index: number) => {
    if (examSubjects.length === 1) return;
    setExamSubjects(examSubjects.filter((_, i) => i !== index));
  };

  const calculateExamTotalNet = () => {
    return examSubjects.reduce((total, sub) => {
      const c = parseInt(String(sub.correct), 10);
      const inc = parseInt(String(sub.incorrect), 10);
      const net = (isNaN(c) ? 0 : c) - (isNaN(inc) ? 0 : inc) / 4;
      return total + net;
    }, 0);
  };

  const handleSaveExam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!examClassId || !examStudentId || !examTitle.trim() || !examDate) {
      alert('Lütfen tüm zorunlu alanları doldurun.');
      return;
    }
    const validSubjects = examSubjects.filter(s => s.subject_name.trim());
    if (validSubjects.length === 0) {
      alert('En az bir ders eklemelisiniz.');
      return;
    }

    setSavingExam(true);
    try {
      const payload = {
        classroom: Number(examClassId),
        student: Number(examStudentId),
        title: examTitle,
        date: examDate,
        subject_scores: validSubjects.map(s => {
          const c = parseInt(String(s.correct), 10);
          const inc = parseInt(String(s.incorrect), 10);
          return {
            subject_name: s.subject_name,
            correct: isNaN(c) ? 0 : c,
            incorrect: isNaN(inc) ? 0 : inc
          };
        })
      };
      
      await api.post('/api/practice-exams/', payload);
      alert('Sınav sonucu başarıyla eklendi.');
      
      // Reset form
      setExamTitle('');
      setExamDate('');
      setExamSubjects([{ subject_name: '', correct: 0, incorrect: 0 }]);
    } catch (err: any) {
      alert(err.message || 'Sınav sonucu eklenirken bir hata oluştu.');
    } finally {
      setSavingExam(false);
    }
  };

  const activePath = location.pathname;

  if (loading) {
    return (
      <div className="loading-container flex-col">
        <div className="spinner"></div>
        <p>Eğitmen paneli yükleniyor...</p>
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

  return (
    <div className="instructor-dashboard">
      
      {/* SECTION 1: Sınıflarım Overview & Creator */}
      {activePath === '/' && (
        <div className="overview-layout grid animate-fade">
          
          {/* Classrooms list */}
          <div className="left-panel flex-col">
            <div className="section-header">
              <h2>Sınıflarım</h2>
              <p>Eğitim verdiğiniz sınıfların genel durumu</p>
            </div>
            
            <div className="classrooms-list flex-col">
              {classrooms.map((c) => {
                const classAnns = announcements.filter(a => a.classroom === c.id).length;
                const classAsss = assignments.filter(a => a.classroom === c.id).length;
                return (
                  <div key={c.id} className="class-card card flex-row">
                    <div className="class-icon-wrapper">
                      <BookOpen size={24} />
                    </div>
                    <div className="class-info">
                      <h3>{c.name}</h3>
                      <div className="class-stats flex-row">
                        <span className="flex-row"><Users size={14} /> {c.students.length} Öğrenci</span>
                        <span className="flex-row"><Megaphone size={14} /> {classAnns} Duyuru</span>
                        <span className="flex-row"><FileText size={14} /> {classAsss} Ödev</span>
                      </div>
                    </div>
                  </div>
                );
              })}
              {classrooms.length === 0 && (
                <div className="empty-state card text-center">
                  <BookOpen size={48} className="empty-icon" />
                  <h3>Sınıf Bulunamadı</h3>
                  <p>Herhangi bir sınıfa eğitmen olarak atanmadınız.</p>
                </div>
              )}
            </div>
          </div>

          {/* Quick Announcement/Assignment Creation Form */}
          {classrooms.length > 0 && (
            <div className="right-panel card flex-col">
              <h3 className="panel-title flex-row"><PlusCircle size={20} /> Yeni İçerik Oluştur</h3>
              
              <div className="type-toggle flex-row">
                <button 
                  type="button" 
                  className={`type-toggle-btn ${createType === 'ANNOUNCEMENT' ? 'active' : ''}`}
                  onClick={() => setCreateType('ANNOUNCEMENT')}
                >
                  Duyuru Paylaş
                </button>
                <button 
                  type="button" 
                  className={`type-toggle-btn ${createType === 'ASSIGNMENT' ? 'active' : ''}`}
                  onClick={() => setCreateType('ASSIGNMENT')}
                >
                  Ödev Ata
                </button>
              </div>

              <form onSubmit={handleCreate} className="creator-form flex-col">
                <div className="input-group">
                  <label htmlFor="target-class">Hedef Sınıf</label>
                  <select 
                    id="target-class"
                    value={selectedClassId}
                    onChange={(e) => setSelectedClassId(e.target.value)}
                  >
                    {classrooms.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div className="input-group">
                  <label htmlFor="content-title">Başlık</label>
                  <input
                    id="content-title"
                    type="text"
                    placeholder={createType === 'ANNOUNCEMENT' ? 'Duyuru başlığını yazın' : 'Ödev başlığını yazın'}
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                  />
                </div>

                <div className="input-group">
                  <label htmlFor="content-body">Detaylar / İçerik</label>
                  <textarea
                    id="content-body"
                    rows={4}
                    placeholder={createType === 'ANNOUNCEMENT' ? 'Öğrencilere iletmek istediğiniz mesajı giriniz...' : 'Ödev açıklamasını ve gereksinimlerini giriniz...'}
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    required
                  />
                </div>

                {createType === 'ASSIGNMENT' && (
                  <div className="input-group">
                    <label htmlFor="deadline">Son Teslim Tarihi</label>
                    <input
                      id="deadline"
                      type="datetime-local"
                      value={deadline}
                      onChange={(e) => setDeadline(e.target.value)}
                      required
                    />
                  </div>
                )}

                <button type="submit" className="primary" disabled={creating}>
                  {creating ? 'Oluşturuluyor...' : 'Yayınla'}
                </button>
              </form>
            </div>
          )}

        </div>
      )}

      {/* SECTION 2: Yoklama Girişi (Daily Sessions) */}
      {activePath === '/instructor-sessions' && (
        <div className="sessions-layout flex-col animate-fade">
          <div className="section-header">
            <h2>Yoklama Girişi</h2>
            <p>Bugün yapılması planlanan oturumlar ve yoklama listesi</p>
          </div>

          <div className="sessions-grid grid">
            
            {/* Active Sessions List */}
            <div className="sessions-panel card flex-col">
              <h3 className="panel-title flex-row"><Clock size={20} /> Bugünkü Oturumlar</h3>
              
              <div className="sessions-list flex-col">
                {sessions.map((sess) => {
                  const isReady = sess.status === 'READY';
                  const isActive = sess.status === 'ACTIVE';
                  const isCompleted = sess.status === 'COMPLETED';
                  const isMissed = sess.status === 'MISSED';
                  
                  return (
                    <div key={sess.id} className="session-item-row flex-row">
                      <div className="sess-info">
                        <h4>{sess.classroom_name}</h4>
                        <p>Oturum Durumu: <strong>{sess.status}</strong></p>
                      </div>
                      
                      <div className="sess-action">
                        {isReady && (
                          <button className="primary flex-row" onClick={() => handleStartAttendance(sess)}>
                            <Play size={14} /> Yoklamayı Başlat
                          </button>
                        )}
                        {isActive && (
                          <button className="primary success flex-row" onClick={() => handleOpenActiveAttendance(sess)}>
                            <CheckCircle size={14} /> Yoklamaya Git
                          </button>
                        )}
                        {isCompleted && (
                          <span className="badge-done flex-row"><CheckSquare size={14} /> Tamamlandı</span>
                        )}
                        {isMissed && (
                          <span className="badge-missed flex-row"><AlertCircle size={14} /> Kaçırıldı</span>
                        )}
                        {sess.status === 'SCHEDULED' && (
                          <span className="badge-scheduled flex-row"><Clock size={14} /> Beklemede</span>
                        )}
                      </div>
                    </div>
                  );
                })}
                {sessions.length === 0 && (
                  <p className="empty-text text-center">Bugün için programlanmış bir oturum bulunmamaktadır.</p>
                )}
              </div>
            </div>

            {/* Active Attendance Form Panel */}
            {activeSession ? (
              <div className="attendance-panel card flex-col animate-fade">
                <div className="panel-header flex-row">
                  <h3>Yoklama Listesi: {sessions.find(s => s.id === activeSession.id)?.classroom_name}</h3>
                  <button className="secondary btn-sm" onClick={() => setActiveSession(null)}>Kapat</button>
                </div>
                
                <div className="attendance-roll flex-col">
                  {attendanceList.map((item) => {
                    const student = classrooms
                      .find(c => c.id === activeSession.classroom)
                      ?.students.find(s => s.id === item.studentId);
                    
                    const name = student ? `${student.first_name || ''} ${student.last_name || ''}`.trim() : '';
                    const displayName = name || student?.username || `Öğrenci #${item.studentId}`;
                    
                    return (
                      <div key={item.studentId} className="attendance-roll-row flex-row">
                        <span>{displayName}</span>
                        <button 
                          className={`toggle-present-btn ${item.isPresent ? 'present' : 'absent'}`}
                          onClick={() => handleTogglePresent(item.studentId)}
                        >
                          {item.isPresent ? 'Derste' : 'Devamsız'}
                        </button>
                      </div>
                    );
                  })}
                </div>

                <button className="primary save-att-btn" onClick={handleSaveAttendance} disabled={savingAttendance}>
                  {savingAttendance ? 'Kaydediliyor...' : 'Yoklamayı Tamamla ve Kapat'}
                </button>
              </div>
            ) : (
              <div className="attendance-empty-panel card flex-col text-center">
                <CheckSquare size={48} className="empty-icon" />
                <h3>Aktif Yoklama Yok</h3>
                <p>Lütfen yoklama almak istediğiniz aktif oturumun yanındaki butona tıklayın.</p>
              </div>
            )}

          </div>
        </div>
      )}

      {/* SECTION 3: Ödev Değerlendirme (Grading List) */}
      {activePath === '/instructor-assignments' && (
        <div className="grading-layout flex-col animate-fade">
          <div className="section-header">
            <h2>Ödev Değerlendirme</h2>
            <p>Öğrenciler tarafından teslim edilmiş ödevlerin puanlanması</p>
          </div>

          <div className="submissions-table-card card">
            <table className="submissions-table">
              <thead>
                <tr>
                  <th>Sınıf / Ödev</th>
                  <th>Öğrenci</th>
                  <th>Teslim Dosyası</th>
                  <th>Tarih</th>
                  <th>Notu</th>
                  <th>Aksiyon</th>
                </tr>
              </thead>
              <tbody>
                {paginatedSubmissions.map((sub) => (
                  <tr key={sub.id}>
                    <td>
                      <div className="sub-td-class">
                        <strong>{sub.assignment_details.classroom_name}</strong>
                        <p>{sub.assignment_details.title}</p>
                      </div>
                    </td>
                    <td>
                      {sub.student_details ? (`${sub.student_details.first_name || ''} ${sub.student_details.last_name || ''}`.trim() || sub.student_details.username) : `Öğrenci #${sub.student}`}
                    </td>
                    <td>
                      {sub.file_url ? (
                        <a href={sub.file_url} target="_blank" rel="noreferrer" className="file-link flex-row">
                          <span>Dosyayı Aç</span> <ExternalLink size={14} />
                        </a>
                      ) : (
                        <span className="no-file-text">Dosya Yok</span>
                      )}
                    </td>
                    <td>
                      {sub.submitted_at ? new Date(sub.submitted_at).toLocaleDateString('tr-TR') : ''}
                    </td>
                    <td>
                      <strong>{sub.grade !== null ? `${sub.grade} / 100` : 'Notlanmadı'}</strong>
                    </td>
                    <td>
                      <button className="primary btn-sm flex-row" onClick={() => handleOpenGradingModal(sub)}>
                        <Award size={14} /> Puanla
                      </button>
                    </td>
                  </tr>
                ))}
                {submittedList.length === 0 && (
                  <tr>
                    <td colSpan={6} className="text-center empty-td">
                      <FileText size={36} className="empty-icon" style={{ margin: '1rem auto' }} />
                      <p>Puanlanmayı bekleyen herhangi bir ödev teslimi bulunmamaktadır.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>

            <Pagination
              currentPage={submissionPage}
              totalPages={totalSubmissionPages}
              onPageChange={setSubmissionPage}
              totalItems={submittedList.length}
              itemsPerPage={SUBMISSIONS_PER_PAGE}
            />
          </div>
        </div>
      )}

      {/* Grading Modal */}
      {selectedSubmission && (
        <div className="modal-overlay flex-row animate-fade" onClick={() => setSelectedSubmission(null)}>
          <div className="modal-card card glass animate-fade" onClick={(e) => e.stopPropagation()}>
            <h3>Ödev Değerlendirme</h3>
            <p className="modal-subtitle">
              {selectedSubmission.student_details ? (`${selectedSubmission.student_details.first_name || ''} ${selectedSubmission.student_details.last_name || ''}`.trim() || selectedSubmission.student_details.username) : `Öğrenci #${selectedSubmission.student}`} - {selectedSubmission.assignment_details.title}
            </p>

            <form onSubmit={handleSaveGrade} className="modal-form flex-col">
              <div className="input-group">
                <label htmlFor="grade-input">Ödev Notu (0 - 100)</label>
                <input
                  id="grade-input"
                  type="number"
                  min="0"
                  max="100"
                  placeholder="Not giriniz"
                  value={gradeValue}
                  onChange={(e) => setGradeValue(e.target.value)}
                  disabled={savingGrade}
                  required
                />
              </div>

              <div className="modal-actions flex-row">
                <button type="button" className="secondary" onClick={() => setSelectedSubmission(null)} disabled={savingGrade}>
                  İptal
                </button>
                <button type="submit" className="primary" disabled={savingGrade}>
                  {savingGrade ? 'Kaydediliyor...' : 'Kaydet'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SECTION 4: Sınav Sonuçları Ekleme (Practice Exams) */}
      {activePath === '/instructor-practice-exams' && (
        <div className="practice-exam-layout flex-col animate-fade">
          <div className="section-header">
            <h2>Deneme Sınavı Sonuçları</h2>
            <p>Öğrencileriniz için deneme sınavı sonuçları girin</p>
          </div>

          <div className="exam-form-card card">
            <h3 className="panel-title flex-row"><Award size={20} /> Sınav Ekle</h3>
            
            <form onSubmit={handleSaveExam} className="exam-form flex-col" style={{ gap: '1.5rem', marginTop: '1rem' }}>
              <div className="form-row grid" style={{ gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="input-group">
                  <label>Sınıf Seçin</label>
                  <select 
                    value={examClassId} 
                    onChange={(e) => {
                      setExamClassId(e.target.value);
                      setExamStudentId('');
                    }}
                    required
                  >
                    <option value="">-- Sınıf Seçin --</option>
                    {classrooms.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div className="input-group">
                  <label>Öğrenci Seçin</label>
                  <select 
                    value={examStudentId} 
                    onChange={(e) => setExamStudentId(e.target.value)}
                    required
                    disabled={!examClassId}
                  >
                    <option value="">-- Öğrenci Seçin --</option>
                    {classrooms.find(c => c.id === Number(examClassId))?.students.map(s => (
                      <option key={s.id} value={s.id}>{s.first_name} {s.last_name} ({s.username})</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-row grid" style={{ gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="input-group">
                  <label>Sınav Adı</label>
                  <input 
                    type="text" 
                    placeholder="Örn: Türkiye Geneli Deneme 1" 
                    value={examTitle} 
                    onChange={(e) => setExamTitle(e.target.value)}
                    required
                  />
                </div>
                <div className="input-group">
                  <label>Tarih</label>
                  <input 
                    type="date" 
                    value={examDate} 
                    onChange={(e) => setExamDate(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="subjects-section" style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
                <div className="flex-row" style={{ justifyContent: 'space-between', marginBottom: '1rem' }}>
                  <h4>Ders Netleri</h4>
                  <button type="button" className="secondary btn-sm flex-row" onClick={handleAddExamSubject}>
                    <PlusCircle size={14} /> Yeni Ders Ekle
                  </button>
                </div>

                {examSubjects.map((sub, idx) => {
                  const c = parseInt(String(sub.correct), 10);
                  const inc = parseInt(String(sub.incorrect), 10);
                  const net = (isNaN(c) ? 0 : c) - (isNaN(inc) ? 0 : inc) / 4;
                  return (
                    <div key={idx} className="subject-row flex-row" style={{ gap: '1rem', alignItems: 'flex-end', marginBottom: '1rem', background: 'var(--bg-secondary)', padding: '1rem', borderRadius: '8px' }}>
                      <div className="input-group" style={{ flex: 2, marginBottom: 0 }}>
                        <label>Ders Adı</label>
                        <input 
                          type="text" 
                          placeholder="Örn: Matematik" 
                          value={sub.subject_name}
                          onChange={(e) => handleUpdateExamSubject(idx, 'subject_name', e.target.value)}
                          required
                        />
                      </div>
                      <div className="input-group" style={{ flex: 1, marginBottom: 0 }}>
                        <label>Doğru</label>
                        <input 
                          type="number" 
                          min="0"
                          value={sub.correct}
                          onChange={(e) => handleUpdateExamSubject(idx, 'correct', e.target.value)}
                          required
                        />
                      </div>
                      <div className="input-group" style={{ flex: 1, marginBottom: 0 }}>
                        <label>Yanlış</label>
                        <input 
                          type="number" 
                          min="0"
                          value={sub.incorrect}
                          onChange={(e) => handleUpdateExamSubject(idx, 'incorrect', e.target.value)}
                          required
                        />
                      </div>
                      <div className="net-display" style={{ padding: '0.75rem', background: 'var(--bg-primary)', borderRadius: '6px', textAlign: 'center', minWidth: '80px', fontWeight: 'bold' }}>
                        {net.toFixed(2)} Net
                      </div>
                      {examSubjects.length > 1 && (
                        <button type="button" className="danger-text" onClick={() => handleRemoveExamSubject(idx)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '0.75rem' }}>
                          <X size={20} />
                        </button>
                      )}
                    </div>
                  );
                })}

                <div className="total-net-display flex-row" style={{ justifyContent: 'flex-end', marginTop: '1.5rem', fontSize: '1.2rem', fontWeight: 'bold' }}>
                  Toplam Net: <span className="primary-text" style={{ marginLeft: '0.5rem' }}>{calculateExamTotalNet().toFixed(2)}</span>
                </div>
              </div>

              <div className="form-actions" style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
                <button type="submit" className="primary" disabled={savingExam}>
                  {savingExam ? 'Kaydediliyor...' : 'Sınavı Kaydet'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
export default InstructorDashboard;
