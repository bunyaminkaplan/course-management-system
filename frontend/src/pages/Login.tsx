import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { GraduationCap, LogIn, Lock, User, AlertCircle } from 'lucide-react';
import './Login.css';

export const Login: React.FC = () => {
  const { login, user } = useAuth();
  const navigate = useNavigate();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      navigate('/', { replace: true });
    }
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setError('Lütfen kullanıcı adı ve şifrenizi giriniz.');
      return;
    }

    setError(null);
    setLoading(true);

    try {
      await login(username, password);
      navigate('/', { replace: true });
    } catch (err: any) {
      setError(err.message || 'Giriş başarısız. Bilgilerinizi kontrol ediniz.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-background">
        <div className="bg-bubble bubble-1"></div>
        <div className="bg-bubble bubble-2"></div>
      </div>

      <div className="login-card glass animate-fade">
        <div className="login-header">
          <div className="logo-badge">
            <GraduationCap size={40} className="logo-icon" />
          </div>
          <h1>Kampüs Bilgi Sistemi</h1>
          <p>Öğrenci ve Kurs Takip Paneli</p>
        </div>

        {error && (
          <div className="error-alert flex-row">
            <AlertCircle size={20} className="alert-icon" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="login-form flex-col">
          <div className="input-group">
            <label htmlFor="username">Kullanıcı Adı</label>
            <div className="input-wrapper">
              <User size={18} className="input-icon" />
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Örn: student1, instructor1"
                disabled={loading}
                required
              />
            </div>
          </div>

          <div className="input-group">
            <label htmlFor="password">Şifre</label>
            <div className="input-wrapper">
              <Lock size={18} className="input-icon" />
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                disabled={loading}
                required
              />
            </div>
          </div>

          <button type="submit" className="primary submit-btn" disabled={loading}>
            {loading ? (
              <span className="spinner">Giriş Yapılıyor...</span>
            ) : (
              <>
                <span>Giriş Yap</span>
                <LogIn size={18} />
              </>
            )}
          </button>
        </form>

        <div className="login-footer">
          <p>Demo Giriş Bilgileri:</p>
          <div className="credentials-info">
            <div><strong>Öğrenci:</strong> student1 / student123</div>
            <div><strong>Eğitmen:</strong> instructor1 / instructor123</div>
            <div><strong>Yönetici:</strong> admin / admin123</div>
          </div>
        </div>
      </div>
    </div>
  );
};
export default Login;
