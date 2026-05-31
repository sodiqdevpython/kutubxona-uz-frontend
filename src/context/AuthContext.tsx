import {
  createContext, useContext, useState, useEffect,
  type ReactNode,
} from 'react';

const BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:8000';
const KEY_ACCESS  = 'kb_admin_access';
const KEY_REFRESH = 'kb_admin_refresh';

export interface AdminUser {
  id: number;
  username: string;
  email: string;
  is_staff: boolean;
  is_superuser: boolean;
}

interface AuthContextValue {
  user:            AdminUser | null;
  token:           string | null;
  isAuthenticated: boolean;
  login:   (username: string, password: string) => Promise<void>;
  logout:  () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user,  setUser]  = useState<AdminUser | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(KEY_ACCESS));

  // Token bo'lsa — foydalanuvchini yuklash
  useEffect(() => {
    if (!token) return;
    fetch(`${BASE}/api/admin/auth/me/`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => (r.ok ? r.json() : null))
      .then(d  => (d ? setUser(d) : logout()))
      .catch(() => logout());
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function login(username: string, password: string) {
    const res = await fetch(`${BASE}/api/admin/auth/login/`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ username, password }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Login xatosi');
    }
    const data = await res.json();
    localStorage.setItem(KEY_ACCESS,  data.access);
    localStorage.setItem(KEY_REFRESH, data.refresh);
    setToken(data.access);
    setUser({
      id: 0,
      username:    data.username ?? username,
      email:       '',
      is_staff:    true,
      is_superuser: data.is_superuser ?? false,
    });
  }

  function logout() {
    localStorage.removeItem(KEY_ACCESS);
    localStorage.removeItem(KEY_REFRESH);
    setToken(null);
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, token, isAuthenticated: !!token && !!user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within <AuthProvider>');
  return ctx;
}
