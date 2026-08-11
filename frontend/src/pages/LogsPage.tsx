import React, { useState, useEffect } from 'react';
import { Activity, AlertTriangle, Clock, Search, X, ChevronDown, ChevronUp, ScrollText, UserX } from 'lucide-react';
import api from '../services/api';
import { Pagination } from '../components/Pagination';
import './LogsPage.css';
import './AdminDashboard.css'; // For common admin styles like .role-badge

interface LogEntry {
  id: number;
  created_at: string;
  user_email: string;
  username: string;
  user_role: string;
  category: string;
  action: string;
  action_display: string;
  status: string;
  ip_address: string;
  details: any;
}

interface LogsResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: LogEntry[];
}

export const LogsPage: React.FC = () => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalItems, setTotalItems] = useState(0);
  
  // Stats
  const [stats, setStats] = useState({
    today: 0,
    failed: 0,
    logins24h: 0,
  });

  // Filters
  const [page, setPage] = useState(1);
  const [category, setCategory] = useState('');
  const [role, setRole] = useState('');
  const [status, setStatus] = useState('');
  const [search, setSearch] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  const [expandedRow, setExpandedRow] = useState<number | null>(null);

  const pageSize = 10;
  const totalPages = Math.ceil(totalItems / pageSize);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 500);
    return () => clearTimeout(timer);
  }, [search]);

  // Load logs
  useEffect(() => {
    const fetchLogs = async () => {
      setLoading(true);
      try {
        const params: any = { page, page_size: pageSize };
        if (category) params.category = category;
        if (role) params.user_role = role;
        if (status) params.status = status;
        if (debouncedSearch) params.search = debouncedSearch;
        if (startDate) params.date_from = startDate;
        if (endDate) params.date_to = endDate;

        const data: LogsResponse = await api.get('/api/logs/', { params });
        setLogs(data.results || []);
        setTotalItems(data.count || 0);
      } catch (error) {
        console.error('Failed to fetch logs:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchLogs();
  }, [page, category, role, status, debouncedSearch, startDate, endDate]);

  // Load stats once on mount
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const todayStr = new Date().toISOString().split('T')[0];
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString();
        
        const [todayRes, failedRes, loginRes] = await Promise.all([
          api.get('/api/logs/', { params: { date_from: todayStr, page_size: 1 } }) as Promise<LogsResponse>,
          api.get('/api/logs/', { params: { status: 'FAILURE', page_size: 1 } }) as Promise<LogsResponse>,
          api.get('/api/logs/', { params: { category: 'AUTH', action: 'LOGIN', date_from: yesterdayStr, page_size: 1 } }) as Promise<LogsResponse>
        ]);

        setStats({
          today: todayRes?.count || 0,
          failed: failedRes?.count || 0,
          logins24h: loginRes?.count || 0,
        });
      } catch (error) {
        console.error('Failed to fetch stats:', error);
      }
    };

    fetchStats();
  }, []);

  const handleFilterChange = () => {
    setPage(1);
    setExpandedRow(null);
  };

  const clearFilters = () => {
    setCategory('');
    setRole('');
    setStatus('');
    setSearch('');
    setStartDate('');
    setEndDate('');
    setPage(1);
    setExpandedRow(null);
  };

  const formatDate = (isoString: string) => {
    if (!isoString) return '-';
    const date = new Date(isoString);
    return date.toLocaleString('tr-TR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const toggleRow = (id: number) => {
    setExpandedRow(expandedRow === id ? null : id);
  };

  const renderRoleBadge = (roleName: string) => {
    const lower = (roleName || '').toLowerCase();
    return <span className={`role-badge ${lower}`}>{roleName || '-'}</span>;
  };

  const renderCategoryBadge = (cat: string) => {
    const lower = (cat || '').toLowerCase();
    const map: Record<string, string> = {
      'AUTH': 'Kimlik Doğrulama',
      'USER_MGMT': 'Kullanıcı Yönetimi',
      'CLASSROOM': 'Sınıf Yönetimi',
      'CONTENT': 'İçerik',
      'SUBMISSION': 'Teslim & Notlandırma',
      'ATTENDANCE': 'Yoklama',
      'SCHEDULE': 'Ders Programı',
      'FORUM': 'Forum',
      'EXAM': 'Sınav & Deneme'
    };
    return <span className={`category-badge ${lower}`}>{map[cat] || cat}</span>;
  };

  return (
    <div className="logs-container animate-fade">
      <div className="admin-header">
        <h2>Sistem Logları</h2>
        <p>Sistemdeki tüm aktiviteleri ve kullanıcı işlemlerini izleyin.</p>
      </div>

      <div className="logs-stats-grid">
        <div className="card glass stat-card">
          <div className="stat-card-header">
            <span>Toplam Kayıt</span>
            <ScrollText size={20} color="hsl(var(--primary))" />
          </div>
          <div className="stat-card-value">{totalItems}</div>
        </div>
        <div className="card glass stat-card">
          <div className="stat-card-header">
            <span>Bugünkü Log Sayısı</span>
            <Activity size={20} color="hsl(var(--success))" />
          </div>
          <div className="stat-card-value">{stats.today}</div>
        </div>
        <div className="card glass stat-card">
          <div className="stat-card-header">
            <span>Başarısız Denemeler</span>
            <AlertTriangle size={20} color="hsl(var(--danger))" />
          </div>
          <div className="stat-card-value">{stats.failed}</div>
        </div>
        <div className="card glass stat-card">
          <div className="stat-card-header">
            <span>Son 24 Saat Giriş</span>
            <Clock size={20} color="hsl(var(--accent-gold))" />
          </div>
          <div className="stat-card-value">{stats.logins24h}</div>
        </div>
      </div>

      <div className="card glass logs-filter-bar">
        <div className="filter-group" style={{ flex: 1, minWidth: '200px' }}>
          <label>Arama</label>
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <Search size={16} style={{ position: 'absolute', left: '0.75rem', color: 'hsl(var(--text-tertiary))' }} />
            <input 
              type="text" 
              placeholder="Kullanıcı adı veya işlem..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ paddingLeft: '2.25rem', width: '100%' }}
            />
          </div>
        </div>

        <div className="filter-group">
          <label>Kategori</label>
          <select value={category} onChange={(e) => { setCategory(e.target.value); handleFilterChange(); }}>
            <option value="">Tümü</option>
            <option value="AUTH">Kimlik Doğrulama</option>
            <option value="USER_MGMT">Kullanıcı Yönetimi</option>
            <option value="CLASSROOM">Sınıf Yönetimi</option>
            <option value="CONTENT">İçerik</option>
            <option value="SUBMISSION">Teslim & Notlandırma</option>
            <option value="ATTENDANCE">Yoklama</option>
            <option value="SCHEDULE">Ders Programı</option>
            <option value="FORUM">Forum</option>
            <option value="EXAM">Sınav & Deneme</option>
          </select>
        </div>

        <div className="filter-group">
          <label>Rol</label>
          <select value={role} onChange={(e) => { setRole(e.target.value); handleFilterChange(); }}>
            <option value="">Tümü</option>
            <option value="ADMIN">Yönetici (ADMIN)</option>
            <option value="INSTRUCTOR">Eğitmen (INSTRUCTOR)</option>
            <option value="STUDENT">Öğrenci (STUDENT)</option>
          </select>
        </div>

        <div className="filter-group">
          <label>Durum</label>
          <select value={status} onChange={(e) => { setStatus(e.target.value); handleFilterChange(); }}>
            <option value="">Tümü</option>
            <option value="SUCCESS">Başarılı (SUCCESS)</option>
            <option value="FAILURE">Başarısız (FAILURE)</option>
          </select>
        </div>

        <div className="filter-group">
          <label>Tarih Başlangıç</label>
          <input type="date" value={startDate} onChange={(e) => { setStartDate(e.target.value); handleFilterChange(); }} />
        </div>

        <div className="filter-group">
          <label>Tarih Bitiş</label>
          <input type="date" value={endDate} onChange={(e) => { setEndDate(e.target.value); handleFilterChange(); }} />
        </div>

        <div className="filter-group" style={{ justifyContent: 'flex-end', marginLeft: 'auto' }}>
          <button className="button secondary btn-sm" onClick={clearFilters} style={{ height: '36px', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <X size={16} />
            Temizle
          </button>
        </div>
      </div>

      <div className="card glass logs-table-container">
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
            <div className="spinner"></div>
          </div>
        ) : logs.length === 0 ? (
          <div className="empty-state">
            <UserX size={48} />
            <p>Log bulunamadı.</p>
          </div>
        ) : (
          <table className="logs-table">
            <thead>
              <tr>
                <th>Tarih/Saat</th>
                <th>Kullanıcı</th>
                <th>Rol</th>
                <th>Kategori</th>
                <th>İşlem</th>
                <th>Durum</th>
                <th>IP Adresi</th>
                <th>Detay</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => {
                const isFailed = log.status === 'FAILURE';
                const hasDetails = log.details && Object.keys(log.details).length > 0;
                const isExpanded = expandedRow === log.id;

                return (
                  <React.Fragment key={log.id}>
                    <tr className={isFailed ? 'failure-row' : ''}>
                      <td>{formatDate(log.created_at)}</td>
                      <td title={log.username || log.user_email}>{log.username || log.user_email || '-'}</td>
                      <td>{renderRoleBadge(log.user_role)}</td>
                      <td>{renderCategoryBadge(log.category)}</td>
                      <td title={log.action_display || log.action}>{log.action_display || log.action}</td>
                      <td>
                        <span className={`status-badge ${isFailed ? 'failure' : 'success'}`}>
                          {isFailed ? 'Başarısız' : 'Başarılı'}
                        </span>
                      </td>
                      <td>{log.ip_address || '-'}</td>
                      <td>
                        {hasDetails && (
                          <button className="detail-btn" onClick={() => toggleRow(log.id)}>
                            {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                          </button>
                        )}
                      </td>
                    </tr>
                    {isExpanded && hasDetails && (
                      <tr className="detail-row">
                        <td colSpan={8}>
                          <div className="detail-content animate-fade">
                            <pre>
                              {JSON.stringify(log.details, null, 2)}
                            </pre>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {totalPages > 1 && (
        <Pagination 
          currentPage={page} 
          totalPages={totalPages} 
          onPageChange={setPage}
          totalItems={totalItems}
          itemsPerPage={pageSize}
        />
      )}
    </div>
  );
};

export default LogsPage;
