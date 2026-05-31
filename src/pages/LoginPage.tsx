import { useState, useEffect, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import Topbar from '../components/layout/Topbar';
import PageLoadBar from '../components/ui/PageLoadBar';
import Footer from '../components/layout/Footer';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const navigate               = useNavigate();
  const { login, isAuthenticated } = useAuth();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');

  useEffect(() => {
    if (isAuthenticated) navigate('/admin/submissions', { replace: true });
  }, [isAuthenticated, navigate]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      await login(username.trim(), password);
      navigate('/admin/submissions', { replace: true });
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-home" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <PageLoadBar />
      <Topbar active="home" />

      {/* Markazlashtirilgan karta */}
      <div style={{
        flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '48px var(--px) 80px',
      }}>
        <div style={{
          width: '100%', maxWidth: 440,
          background: 'var(--paper)',
          border: '1px solid var(--line)',
          borderRadius: 14,
          padding: '52px 52px 44px',
          boxShadow: '0 8px 40px -12px rgba(10,25,47,0.12)',
        }}>

          {/* Sarlavha */}
          <div style={{ marginBottom: 36, textAlign: 'center' }}>
            <span className="eyebrow" style={{ display: 'block', marginBottom: 14 }}>Kirish</span>
            <p style={{ fontSize: 13.5, color: 'var(--ink-3)', lineHeight: 1.55 }}>
              Faqat tahrir xodimlari uchun.<br/>
              Parolingizni unutgan bo'lsangiz Django admin orqali tiklang.
            </p>
          </div>

          {/* Forma */}
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={{
                display: 'block', fontSize: 11.5, fontWeight: 700,
                color: 'var(--ink-3)', textTransform: 'uppercase',
                letterSpacing: 0.18, marginBottom: 6,
              }}>Foydalanuvchi nomi</label>
              <input
                value={username} onChange={e => setUsername(e.target.value)}
                required autoFocus autoComplete="username"
                placeholder="admin"
                style={{
                  width: '100%', height: 44, padding: '0 14px', boxSizing: 'border-box',
                  border: '1px solid var(--line-2)', borderRadius: 8,
                  fontFamily: 'var(--sans)', fontSize: 14, color: 'var(--ink)',
                  background: 'var(--grey-2)', outline: 'none',
                }}
                onFocus={e => (e.target.style.borderColor = 'var(--navy)')}
                onBlur={e  => (e.target.style.borderColor = 'var(--line-2)')}
              />
            </div>
            <div>
              <label style={{
                display: 'block', fontSize: 11.5, fontWeight: 700,
                color: 'var(--ink-3)', textTransform: 'uppercase',
                letterSpacing: 0.18, marginBottom: 6,
              }}>Parol</label>
              <input
                type="password" value={password} onChange={e => setPassword(e.target.value)}
                required autoComplete="current-password"
                placeholder="••••••••"
                style={{
                  width: '100%', height: 44, padding: '0 14px', boxSizing: 'border-box',
                  border: '1px solid var(--line-2)', borderRadius: 8,
                  fontFamily: 'var(--sans)', fontSize: 14, color: 'var(--ink)',
                  background: 'var(--grey-2)', outline: 'none',
                }}
                onFocus={e => (e.target.style.borderColor = 'var(--navy)')}
                onBlur={e  => (e.target.style.borderColor = 'var(--line-2)')}
              />
            </div>

            {error && (
              <div style={{
                padding: '10px 14px',
                background: 'rgba(220,38,38,0.06)',
                border: '1px solid rgba(220,38,38,0.25)',
                borderRadius: 8, fontSize: 13, color: '#DC2626',
              }}>
                {error}
              </div>
            )}

            <button
              type="submit" disabled={loading}
              className="btn primary"
              style={{
                width: '100%', height: 46, justifyContent: 'center',
                fontSize: 14, marginTop: 4,
                opacity: loading ? 0.6 : 1,
                cursor: loading ? 'default' : 'pointer',
              }}
            >
              {loading ? 'Tekshirilmoqda…' : 'Kirish'}
            </button>
          </form>
        </div>
      </div>

      <Footer />
    </div>
  );
}
