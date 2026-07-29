import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { Pagination } from '../components/Pagination';
import { 
  Clock, 
  Trash2, 
  UserPlus, 
  BookOpen as BookOpenIcon, 
  Edit3,
  AlertCircle
} from 'lucide-react';
import './AdminDashboard.css';

interface User {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  role: 'ADMIN' | 'INSTRUCTOR' | 'STUDENT';
}

interface Classroom {
  id: number;
  name: string;
  instructors: User[];
  students: User[];
  created_at: string;
}

interface Schedule {
  id: number;
  classroom: number;
  classroom_name?: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
}

export const AdminDashboard: React.FC = () => {
  const { user: currentUser } = useAuth();
  const location = useLocation();

  // Data states
  const [users, setUsers] = useState<User[]>([]);
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // User Creator State
  const [newUsername, setNewUsername] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newFirstName, setNewFirstName] = useState('');
  const [newLastName, setNewLastName] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState<'ADMIN' | 'INSTRUCTOR' | 'STUDENT'>('STUDENT');
  const [creatingUser, setCreatingUser] = useState(false);

  // Classroom Creator State
  const [newClassName, setNewClassName] = useState('');
  const [creatingClass, setCreatingClass] = useState(false);

  // Selected Classroom for Relation Management
  const [selectedClass, setSelectedClass] = useState<Classroom | null>(null);
  const [updatingClassRelation, setUpdatingClassRelation] = useState(false);

  // Schedule Creator State
  const [selectedSchedClassId, setSelectedSchedClassId] = useState('');
  const [schedDay, setSchedDay] = useState('0'); // Monday default
  const [schedStartTime, setSchedStartTime] = useState('09:00');
  const [schedEndTime, setSchedEndTime] = useState('10:30');
  const [creatingSchedule, setCreatingSchedule] = useState(false);

  // Pagination states
  const [usersPage, setUsersPage] = useState(1);
  const [schedulesPage, setSchedulesPage] = useState(1);
  const ITEMS_PER_PAGE = 8;

  const totalUserPages = Math.ceil(users.length / ITEMS_PER_PAGE);
  const paginatedUsers = users.slice((usersPage - 1) * ITEMS_PER_PAGE, usersPage * ITEMS_PER_PAGE);

  const totalSchedulePages = Math.ceil(schedules.length / ITEMS_PER_PAGE);
  const paginatedSchedules = schedules.slice((schedulesPage - 1) * ITEMS_PER_PAGE, schedulesPage * ITEMS_PER_PAGE);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      // 1. Fetch Users
      const uData: User[] = await api.get('/api/users/');
      setUsers(uData);

      // 2. Fetch Classrooms
      const cData: Classroom[] = await api.get('/api/classrooms/');
      setClassrooms(cData);
      
      if (cData.length > 0 && !selectedSchedClassId) {
        setSelectedSchedClassId(String(cData[0].id));
      }

      // 3. Fetch Schedules
      const sData: Schedule[] = await api.get('/api/schedules/');
      const mappedSchedules = sData.map(s => {
        const cl = cData.find(c => c.id === s.classroom);
        return {
          ...s,
          classroom_name: cl ? cl.name : 'Bilinmeyen Ders'
        };
      });
      setSchedules(mappedSchedules);

    } catch (err: any) {
      setError(err.message || 'Veriler yüklenirken hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // User Actions
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUsername.trim() || !newPassword.trim()) return;

    setCreatingUser(true);
    try {
      const newUser = await api.post('/api/users/', {
        username: newUsername,
        email: newEmail,
        first_name: newFirstName,
        last_name: newLastName,
        password: newPassword,
        role: newRole
      });
      
      setUsers([...users, newUser]);
      // Reset form
      setNewUsername('');
      setNewEmail('');
      setNewFirstName('');
      setNewLastName('');
      setNewPassword('');
      alert('Kullanıcı başarıyla oluşturuldu!');
    } catch (err: any) {
      alert(err.message || 'Kullanıcı oluşturulurken hata oluştu.');
    } finally {
      setCreatingUser(false);
    }
  };

  const handleDeleteUser = async (userId: number) => {
    if (userId === currentUser?.id) {
      alert('Kendinizi silemezsiniz!');
      return;
    }
    if (!window.confirm('Bu kullanıcıyı silmek istediğinize emin misiniz? Bu işlem geri alınamaz.')) return;

    try {
      await api.delete(`/api/users/${userId}/`);
      setUsers(users.filter(u => u.id !== userId));
      alert('Kullanıcı silindi.');
    } catch (err: any) {
      alert(err.message || 'Kullanıcı silinemedi.');
    }
  };

  // Classroom Actions
  const handleCreateClassroom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClassName.trim()) return;

    setCreatingClass(true);
    try {
      const newCl = await api.post('/api/classrooms/', {
        name: newClassName,
        instructor_ids: [],
        student_ids: []
      });

      setClassrooms([...classrooms, newCl]);
      setNewClassName('');
      alert('Sınıf başarıyla oluşturuldu!');
    } catch (err: any) {
      alert(err.message || 'Sınıf oluşturulurken hata oluştu.');
    } finally {
      setCreatingClass(false);
    }
  };

  const handleDeleteClassroom = async (classId: number) => {
    if (!window.confirm('Bu sınıfı silmek istediğinize emin misiniz? Tüm ders ve yoklama oturumları etkilenebilir.')) return;

    try {
      await api.delete(`/api/classrooms/${classId}/`);
      setClassrooms(classrooms.filter(c => c.id !== classId));
      if (selectedClass?.id === classId) {
        setSelectedClass(null);
      }
      alert('Sınıf silindi.');
      fetchData(); // reload schedules
    } catch (err: any) {
      alert(err.message || 'Sınıf silinemedi.');
    }
  };

  // Manage Classroom Members
  const handleToggleMember = async (type: 'INSTRUCTOR' | 'STUDENT', memberId: number, isAssigned: boolean) => {
    if (!selectedClass) return;

    setUpdatingClassRelation(true);
    try {
      let instructorIds = selectedClass.instructors.map(i => i.id);
      let studentIds = selectedClass.students.map(s => s.id);

      if (type === 'INSTRUCTOR') {
        if (isAssigned) {
          instructorIds = instructorIds.filter(id => id !== memberId);
        } else {
          instructorIds.push(memberId);
        }
      } else {
        if (isAssigned) {
          studentIds = studentIds.filter(id => id !== memberId);
        } else {
          studentIds.push(memberId);
        }
      }

      const updated = await api.patch(`/api/classrooms/${selectedClass.id}/`, {
        instructor_ids: instructorIds,
        student_ids: studentIds
      });

      // Update local states
      setClassrooms(classrooms.map(c => c.id === selectedClass.id ? updated : c));
      setSelectedClass(updated);
    } catch (err: any) {
      alert(err.message || 'Üye durumu güncellenemedi.');
    } finally {
      setUpdatingClassRelation(false);
    }
  };

  // Schedule Actions
  const handleCreateSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSchedClassId) return;

    setCreatingSchedule(true);
    try {
      await api.post('/api/schedules/', {
        classroom: Number(selectedSchedClassId),
        day_of_week: Number(schedDay),
        start_time: schedStartTime,
        end_time: schedEndTime
      });

      alert('Ders programı tanımlandı!');
      fetchData(); // reload list with name mapping
    } catch (err: any) {
      alert(err.message || 'Program oluşturulamadı.');
    } finally {
      setCreatingSchedule(false);
    }
  };

  const handleDeleteSchedule = async (schedId: number) => {
    if (!window.confirm('Bu haftalık ders saati kaydını silmek istediğinize emin misiniz?')) return;

    try {
      await api.delete(`/api/schedules/${schedId}/`);
      setSchedules(schedules.filter(s => s.id !== schedId));
      alert('Ders programı kaydı silindi.');
    } catch (err: any) {
      alert(err.message || 'Ders programı kaydı silinemedi.');
    }
  };

  const getDayOfWeekName = (dayNum: number) => {
    const days = ['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi', 'Pazar'];
    return days[dayNum] || 'Bilinmeyen Gün';
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'ADMIN': return 'Yönetici';
      case 'INSTRUCTOR': return 'Eğitmen';
      case 'STUDENT': return 'Öğrenci';
      default: return role;
    }
  };

  if (loading) {
    return (
      <div className="loading-container flex-col">
        <div className="spinner"></div>
        <p>Yönetici paneli yükleniyor...</p>
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

  const activePath = location.pathname;

  return (
    <div className="admin-dashboard">
      
      {/* 1. KULLANICI YÖNETİMİ (Path: /) */}
      {activePath === '/' && (
        <div className="admin-layout grid animate-fade">
          
          {/* User List Panel */}
          <div className="left-panel flex-col">
            <div className="section-header">
              <h2>Kullanıcı Yönetimi</h2>
              <p>Sistemdeki tüm yöneticiler, eğitmenler ve öğrencilerin listesi</p>
            </div>

            <div className="users-table-card card">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Adı Soyadı</th>
                    <th>Kullanıcı Adı</th>
                    <th>E-posta</th>
                    <th>Rol</th>
                    <th>İşlem</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedUsers.map((u) => (
                    <tr key={u.id}>
                      <td>{`${u.first_name} ${u.last_name}`.trim() || '-'}</td>
                      <td><strong>{u.username}</strong></td>
                      <td>{u.email}</td>
                      <td>
                        <span className={`role-badge ${u.role.toLowerCase()}`}>
                          {getRoleLabel(u.role)}
                        </span>
                      </td>
                      <td>
                        <button 
                          className="danger btn-sm" 
                          onClick={() => handleDeleteUser(u.id)}
                          disabled={u.id === currentUser?.id}
                        >
                          <Trash2 size={14} /> Sil
                        </button>
                      </td>
                    </tr>
                  ))}
                  {users.length === 0 && (
                    <tr>
                      <td colSpan={5} className="text-center">Kullanıcı bulunmamaktadır.</td>
                    </tr>
                  )}
                </tbody>
              </table>

              <Pagination
                currentPage={usersPage}
                totalPages={totalUserPages}
                onPageChange={setUsersPage}
                totalItems={users.length}
                itemsPerPage={ITEMS_PER_PAGE}
              />
            </div>
          </div>

          {/* User Creator Form */}
          <div className="right-panel card flex-col">
            <h3 className="panel-title flex-row"><UserPlus size={20} /> Yeni Kullanıcı Ekle</h3>
            
            <form onSubmit={handleCreateUser} className="admin-form flex-col">
              <div className="input-group">
                <label htmlFor="new-role">Kullanıcı Rolü</label>
                <select id="new-role" value={newRole} onChange={(e) => setNewRole(e.target.value as any)}>
                  <option value="STUDENT">Öğrenci</option>
                  <option value="INSTRUCTOR">Eğitmen</option>
                  <option value="ADMIN">Yönetici (Admin)</option>
                </select>
              </div>

              <div className="input-group">
                <label htmlFor="new-username">Kullanıcı Adı</label>
                <input
                  id="new-username"
                  type="text"
                  placeholder="Örn: ahmet123"
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  required
                />
              </div>

              <div className="input-group">
                <label htmlFor="new-password">Şifre</label>
                <input
                  id="new-password"
                  type="password"
                  placeholder="Şifre belirleyin"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                />
              </div>

              <div className="input-group">
                <label htmlFor="new-email">E-posta Adresi</label>
                <input
                  id="new-email"
                  type="email"
                  placeholder="örn@domain.com"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                />
              </div>

              <div className="grid-2-col grid">
                <div className="input-group">
                  <label htmlFor="new-first-name">Adı</label>
                  <input
                    id="new-first-name"
                    type="text"
                    value={newFirstName}
                    onChange={(e) => setNewFirstName(e.target.value)}
                  />
                </div>
                <div className="input-group">
                  <label htmlFor="new-last-name">Soyadı</label>
                  <input
                    id="new-last-name"
                    type="text"
                    value={newLastName}
                    onChange={(e) => setNewLastName(e.target.value)}
                  />
                </div>
              </div>

              <button type="submit" className="primary" disabled={creatingUser}>
                {creatingUser ? 'Oluşturuluyor...' : 'Kullanıcıyı Kaydet'}
              </button>
            </form>
          </div>

        </div>
      )}

      {/* 2. SINIF YÖNETİMİ (Path: /admin-classrooms) */}
      {activePath === '/admin-classrooms' && (
        <div className="admin-layout grid animate-fade">
          
          {/* Classrooms List & Member Manager */}
          <div className="left-panel flex-col">
            <div className="section-header">
              <h2>Sınıf Yönetimi</h2>
              <p>Sınıfları yönetin, eğitmen atayın ve öğrenci kaydedin</p>
            </div>

            <div className="classrooms-grid grid">
              {classrooms.map((c) => (
                <div key={c.id} className={`class-manage-card card flex-col ${selectedClass?.id === c.id ? 'selected' : ''}`}>
                  <div className="class-header flex-row">
                    <h3>{c.name}</h3>
                    <div className="actions flex-row">
                      <button className="secondary btn-sm flex-row" onClick={() => setSelectedClass(c)}>
                        <Edit3 size={14} /> Yönet
                      </button>
                      <button className="danger btn-sm" onClick={() => handleDeleteClassroom(c.id)}>
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                  
                  <div className="class-summary flex-col">
                    <div><strong>Eğitmenler:</strong> {c.instructors.map(i => `${i.first_name} ${i.last_name}`).join(', ') || 'Atanmadı'}</div>
                    <div><strong>Öğrenciler:</strong> {c.students.length} Kayıtlı Öğrenci</div>
                  </div>
                </div>
              ))}
              {classrooms.length === 0 && (
                <p className="empty-text">Henüz tanımlanmış bir sınıf bulunmamaktadır.</p>
              )}
            </div>

            {/* Member Allocation Panel */}
            {selectedClass && (
              <div className="classroom-member-panel card flex-col animate-fade">
                <div className="panel-header flex-row">
                  <h3>Sınıf Detayları ve Üyeler: {selectedClass.name}</h3>
                  <button className="secondary btn-sm" onClick={() => setSelectedClass(null)}>Kapat</button>
                </div>

                <div className="member-sections grid">
                  
                  {/* Instructor Assignment */}
                  <div className="member-section flex-col">
                    <h4>Eğitmen Atama</h4>
                    <div className="member-list flex-col">
                      {users.filter(u => u.role === 'INSTRUCTOR').map((inst) => {
                        const isAssigned = selectedClass.instructors.some(i => i.id === inst.id);
                        return (
                          <div key={inst.id} className="member-row flex-row">
                            <span>{`${inst.first_name} ${inst.last_name}`.trim() || inst.username}</span>
                            <button
                              className={`btn-sm ${isAssigned ? 'danger' : 'primary'}`}
                              onClick={() => handleToggleMember('INSTRUCTOR', inst.id, isAssigned)}
                              disabled={updatingClassRelation}
                            >
                              {isAssigned ? 'Kaldır' : 'Ata'}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Student Enrollment */}
                  <div className="member-section flex-col">
                    <h4>Öğrenci Kaydı</h4>
                    <div className="member-list flex-col">
                      {users.filter(u => u.role === 'STUDENT').map((std) => {
                        const isEnrolled = selectedClass.students.some(s => s.id === std.id);
                        return (
                          <div key={std.id} className="member-row flex-row">
                            <span>{`${std.first_name} ${std.last_name}`.trim() || std.username}</span>
                            <button
                              className={`btn-sm ${isEnrolled ? 'danger' : 'primary'}`}
                              onClick={() => handleToggleMember('STUDENT', std.id, isEnrolled)}
                              disabled={updatingClassRelation}
                            >
                              {isEnrolled ? 'Kaydı Sil' : 'Kaydet'}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                </div>
              </div>
            )}
          </div>

          {/* Classroom Creator Form */}
          <div className="right-panel card flex-col">
            <h3 className="panel-title flex-row"><BookOpenIcon size={20} /> Yeni Sınıf Oluştur</h3>
            <form onSubmit={handleCreateClassroom} className="admin-form flex-col">
              <div className="input-group">
                <label htmlFor="new-class-name">Sınıf Adı</label>
                <input
                  id="new-class-name"
                  type="text"
                  placeholder="Örn: Kimya 101, Tarih 202"
                  value={newClassName}
                  onChange={(e) => setNewClassName(e.target.value)}
                  required
                />
              </div>

              <button type="submit" className="primary" disabled={creatingClass}>
                {creatingClass ? 'Oluşturuluyor...' : 'Sınıfı Kaydet'}
              </button>
            </form>
          </div>

        </div>
      )}

      {/* 3. DERS PROGRAMI TANIMLAMA (Path: /admin-schedule) */}
      {activePath === '/admin-schedule' && (
        <div className="admin-layout grid animate-fade">
          
          {/* Schedules List Panel */}
          <div className="left-panel flex-col">
            <div className="section-header">
              <h2>Ders Programı Haftalık Planlayıcı</h2>
              <p>Sınıfların haftalık program şablonlarını yönetin</p>
            </div>

            <div className="schedules-table-card card">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Sınıf Adı</th>
                    <th>Gün</th>
                    <th>Başlangıç</th>
                    <th>Bitiş</th>
                    <th>İşlem</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedSchedules.map((s) => (
                    <tr key={s.id}>
                      <td><strong>{s.classroom_name}</strong></td>
                      <td>{getDayOfWeekName(s.day_of_week)}</td>
                      <td>{s.start_time.substring(0, 5)}</td>
                      <td>{s.end_time.substring(0, 5)}</td>
                      <td>
                        <button className="danger btn-sm" onClick={() => handleDeleteSchedule(s.id)}>
                          <Trash2 size={14} /> Sil
                        </button>
                      </td>
                    </tr>
                  ))}
                  {schedules.length === 0 && (
                    <tr>
                      <td colSpan={5} className="text-center">Tanımlı program kaydı bulunmamaktadır.</td>
                    </tr>
                  )}
                </tbody>
              </table>

              <Pagination
                currentPage={schedulesPage}
                totalPages={totalSchedulePages}
                onPageChange={setSchedulesPage}
                totalItems={schedules.length}
                itemsPerPage={ITEMS_PER_PAGE}
              />
            </div>
          </div>

          {/* Schedule Creator Form */}
          <div className="right-panel card flex-col">
            <h3 className="panel-title flex-row"><Clock size={20} /> Ders Saati Tanımla</h3>
            
            {classrooms.length > 0 ? (
              <form onSubmit={handleCreateSchedule} className="admin-form flex-col">
                <div className="input-group">
                  <label htmlFor="sched-class">Sınıf</label>
                  <select 
                    id="sched-class"
                    value={selectedSchedClassId}
                    onChange={(e) => setSelectedSchedClassId(e.target.value)}
                  >
                    {classrooms.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div className="input-group">
                  <label htmlFor="sched-day">Gün</label>
                  <select 
                    id="sched-day"
                    value={schedDay}
                    onChange={(e) => setSchedDay(e.target.value)}
                  >
                    <option value="0">Pazartesi</option>
                    <option value="1">Salı</option>
                    <option value="2">Çarşamba</option>
                    <option value="3">Perşembe</option>
                    <option value="4">Cuma</option>
                    <option value="5">Cumartesi</option>
                    <option value="6">Pazar</option>
                  </select>
                </div>

                <div className="grid-2-col grid">
                  <div className="input-group">
                    <label htmlFor="start-time">Başlangıç Saati</label>
                    <input
                      id="start-time"
                      type="time"
                      value={schedStartTime}
                      onChange={(e) => setSchedStartTime(e.target.value)}
                      required
                    />
                  </div>
                  <div className="input-group">
                    <label htmlFor="end-time">Bitiş Saati</label>
                    <input
                      id="end-time"
                      type="time"
                      value={schedEndTime}
                      onChange={(e) => setSchedEndTime(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <button type="submit" className="primary" disabled={creatingSchedule}>
                  {creatingSchedule ? 'Oluşturuluyor...' : 'Ders Saatini Kaydet'}
                </button>
              </form>
            ) : (
              <p className="empty-text">Ders programı tanımlamak için önce bir sınıf oluşturmalısınız.</p>
            )}
          </div>

        </div>
      )}

    </div>
  );
};
export default AdminDashboard;
