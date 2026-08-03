import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { 
  GraduationCap, 
  LogOut, 
  User as UserIcon, 
  BookOpen, 
  Calendar, 
  ClipboardList, 
  Users, 
  Clock, 
  FileText,
  Menu,
  X,
  MessageSquare,
  Sun,
  Moon,
  ScrollText
} from 'lucide-react';
import './Layout.css';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  if (!user) return null;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'ADMIN': return 'Yönetici';
      case 'INSTRUCTOR': return 'Eğitmen';
      case 'STUDENT': return 'Öğrenci';
      default: return role;
    }
  };

  // Define nav links based on role
  const getNavLinks = () => {
    const defaultIconClass = "nav-icon";
    switch (user.role) {
      case 'STUDENT':
        return [
          { label: 'Birleştirilmiş Pano', path: '/', icon: <BookOpen className={defaultIconClass} /> },
          { label: 'Ödevler & Teslimler', path: '/assignments', icon: <FileText className={defaultIconClass} /> },
          { label: 'Ders Programı & Yoklama', path: '/attendance', icon: <Calendar className={defaultIconClass} /> },
          { label: 'Soru & Cevap (Forum)', path: '/forum', icon: <MessageSquare className={defaultIconClass} /> },
        ];
      case 'INSTRUCTOR':
        return [
          { label: 'Sınıflarım', path: '/', icon: <BookOpen className={defaultIconClass} /> },
          { label: 'Yoklama Girişi', path: '/instructor-sessions', icon: <ClipboardList className={defaultIconClass} /> },
          { label: 'Ödev Değerlendirme', path: '/instructor-assignments', icon: <FileText className={defaultIconClass} /> },
          { label: 'Soru & Cevap (Forum)', path: '/forum', icon: <MessageSquare className={defaultIconClass} /> },
        ];
      case 'ADMIN':
        return [
          { label: 'Kullanıcı Yönetimi', path: '/', icon: <Users className={defaultIconClass} /> },
          { label: 'Sınıf Yönetimi', path: '/admin-classrooms', icon: <BookOpen className={defaultIconClass} /> },
          { label: 'Ders Programı Tanımlama', path: '/admin-schedule', icon: <Clock className={defaultIconClass} /> },
          { label: 'Sistem Logları', path: '/admin-logs', icon: <ScrollText className={defaultIconClass} /> },
        ];
      default:
        return [];
    }
  };

  const navLinks = getNavLinks();

  const handleLinkClick = (path: string) => {
    navigate(path);
    setMobileMenuOpen(false);
  };

  return (
    <div className="layout-container">
      {/* Sidebar - Desktop */}
      <aside className="sidebar">
        <div className="sidebar-header flex-row">
          <div className="sidebar-logo">
            <GraduationCap size={28} />
          </div>
          <span className="brand-name">KBS Portal</span>
        </div>

        <div className="user-profile-section flex-col">
          <div className="avatar-placeholder">
            <UserIcon size={24} />
          </div>
          <div className="user-details flex-col">
            <span className="user-fullname">{`${user.first_name} ${user.last_name}`.trim() || user.username}</span>
            <span className="user-role-badge">{getRoleLabel(user.role)}</span>
          </div>
        </div>

        <nav className="sidebar-nav flex-col">
          {navLinks.map((link) => {
            const isActive = location.pathname === link.path;
            return (
              <button
                key={link.path}
                className={`nav-link flex-row ${isActive ? 'active' : ''}`}
                onClick={() => handleLinkClick(link.path)}
              >
                {link.icon}
                <span>{link.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="sidebar-footer flex-col" style={{ gap: '0.5rem' }}>
          <button className="logout-btn flex-row" onClick={toggleTheme} style={{ background: 'transparent', color: 'hsl(var(--text-secondary))' }}>
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            <span>{theme === 'dark' ? 'Açık Tema' : 'Koyu Tema'}</span>
          </button>
          
          <button className="logout-btn flex-row" onClick={handleLogout}>
            <LogOut size={18} />
            <span>Çıkış Yap</span>
          </button>
        </div>
      </aside>

      {/* Mobile Top Header */}
      <header className="mobile-header flex-row">
        <button className="menu-toggle" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
        <div className="mobile-brand flex-row">
          <GraduationCap size={24} />
          <span>KBS Portal</span>
        </div>
        <div className="flex-row" style={{ gap: '1rem', alignItems: 'center' }}>
          <button 
            onClick={toggleTheme} 
            style={{ background: 'transparent', border: 'none', color: 'hsl(var(--text-secondary))', display: 'flex' }}
          >
            {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
          </button>
          <div className="mobile-avatar">
            {user.username[0].toUpperCase()}
          </div>
        </div>
      </header>

      {/* Mobile Nav Overlay */}
      {mobileMenuOpen && (
        <div className="mobile-nav-overlay animate-fade" onClick={() => setMobileMenuOpen(false)}>
          <nav className="mobile-nav flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="mobile-profile flex-row">
              <div className="mobile-avatar-large">
                <UserIcon size={32} />
              </div>
              <div className="mobile-profile-details flex-col">
                <span className="m-fullname">{`${user.first_name} ${user.last_name}`.trim() || user.username}</span>
                <span className="m-badge">{getRoleLabel(user.role)}</span>
              </div>
            </div>

            <div className="mobile-links flex-col">
              {navLinks.map((link) => {
                const isActive = location.pathname === link.path;
                return (
                  <button
                    key={link.path}
                    className={`mobile-link flex-row ${isActive ? 'active' : ''}`}
                    onClick={() => handleLinkClick(link.path)}
                  >
                    {link.icon}
                    <span>{link.label}</span>
                  </button>
                );
              })}
            </div>

            <button className="mobile-logout flex-row" onClick={toggleTheme} style={{ marginTop: 'auto', marginBottom: '0.5rem', background: 'transparent', color: 'hsl(var(--text-secondary))' }}>
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
              <span>{theme === 'dark' ? 'Açık Tema' : 'Koyu Tema'}</span>
            </button>

            <button className="mobile-logout flex-row" onClick={handleLogout}>
              <LogOut size={18} />
              <span>Çıkış Yap</span>
            </button>
          </nav>
        </div>
      )}

      {/* Main Content Area */}
      <main className="main-content">
        <div className="content-inner animate-fade">
          {children}
        </div>
      </main>
    </div>
  );
};
export default Layout;
