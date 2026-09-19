import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useLang, type Lang } from '../../context/LangContext';
import { markNotifSeen, notifSeenAt, relTime, useDashboard } from '../../lib/admin-dashboard';
import { Wordmark } from '../layout/Topbar';

/**
 * Admin panel qobig'i — Figma «Admin» sahifasi:
 * chapda qora sidebar (logo, bo'limlar + badge'lar, foydalanuvchi kartasi),
 * tepada breadcrumb / qidiruv / bildirishnomalar / til, o'ngda kontent.
 */

export type AdminSection = 'dashboard' | 'submissions' | 'journals' | 'authors' | 'chat' | 'settings';

interface Props {
  active:   AdminSection;
  /** Breadcrumb: «Tahririyat / {crumb}» */
  crumb?:   string;
  children: ReactNode;
}

const NAV: { key: AdminSection; label: string; to: string; icon: ReactNode }[] = [
  { key: 'dashboard',   label: 'Asosiy panel',     to: '/admin',             icon: <IcoGrid /> },
  { key: 'submissions', label: 'Kelgan maqolalar', to: '/admin/submissions', icon: <IcoInbox /> },
  { key: 'journals',    label: 'Jurnal sonlari',   to: '/admin/journals',    icon: <IcoBook /> },
  { key: 'authors',     label: 'Mualliflar',       to: '/admin/authors',     icon: <IcoUsers /> },
  { key: 'chat',        label: 'Xabarlar',         to: '/admin/chat',        icon: <IcoChat /> },
  { key: 'settings',    label: 'Sozlamalar',       to: '/admin/settings',    icon: <IcoGear /> },
];

const LANGS: { code: Lang; label: string }[] = [
  { code: 'uz-latn', label: 'UZ' }, { code: 'ru', label: 'RU' }, { code: 'en', label: 'EN' },
];

export default function AdminShell({ active, crumb, children }: Props) {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { lang, setLang } = useLang();
  const dash = useDashboard();

  const [q, setQ] = useState('');
  const [notifOpen, setNotifOpen] = useState(false);
  const [seenAt, setSeenAt] = useState(notifSeenAt());
  const notifRef = useRef<HTMLDivElement>(null);

  const counts = dash?.counts;
  const badge: Partial<Record<AdminSection, { n: number; hot: boolean }>> = {
    submissions: { n: counts?.pending ?? 0,      hot: true },
    journals:    { n: counts?.issues ?? 0,       hot: false },
    authors:     { n: counts?.authors ?? 0,      hot: false },
    chat:        { n: counts?.unread_chats ?? 0, hot: true },
  };

  const notifs = dash?.notifications ?? [];
  const unread = notifs.filter(n => !seenAt || n.time > seenAt).length;

  useEffect(() => {
    if (!notifOpen) return;
    function onDoc(e: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false);
    }
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [notifOpen]);

  function markAllSeen() {
    const latest = notifs.reduce((m, n) => (n.time > m ? n.time : m), '');
    if (latest) { markNotifSeen(latest); setSeenAt(latest); }
  }

  const initials = user?.initials ?? (user?.username ?? 'A').slice(0, 2).toUpperCase();

  return (
    <div className="adm">
      {/* ═══ Sidebar ═══ */}
      <aside className="adm-side">
        <Link to="/admin" className="adm-logo">
          <Wordmark light />
          <span className="adm-logo-tag">Admin paneli</span>
        </Link>

        <nav className="adm-nav">
          {NAV.map(n => {
            const b = badge[n.key];
            return (
              <NavLink key={n.key} to={n.to} end={n.key === 'dashboard'}
                className={active === n.key ? 'on' : ''}>
                <span className="adm-nav-ico">{n.icon}</span>
                <span className="adm-nav-lbl">{n.label}</span>
                {b && b.n > 0 && <span className={`adm-badge${b.hot ? ' hot' : ''}`}>{b.n}</span>}
              </NavLink>
            );
          })}
          <div className="adm-nav-sep" />
          <a href="/" target="_blank" rel="noreferrer">
            <span className="adm-nav-ico"><IcoExt /></span>
            <span className="adm-nav-lbl">Saytni ko‘rish</span>
          </a>
        </nav>

        <div className="adm-user">
          <span className="adm-user-ava">{initials}</span>
          <span className="adm-user-txt">
            <span className="adm-user-name">{user?.short_name ?? user?.username ?? 'Admin'}</span>
            <span className="adm-user-role">{user?.role_label ?? 'Tahririyat'}</span>
          </span>
          <button className="adm-user-out" title="Chiqish" onClick={() => { logout(); navigate('/login'); }}>
            <IcoOut />
          </button>
        </div>
      </aside>

      {/* ═══ Main ═══ */}
      <div className="adm-body">
        <header className="adm-top">
          <div className="adm-crumbs">
            <Link to="/admin">Tahririyat</Link>
            <span className="sep">/</span>
            <span className="cur">{crumb ?? NAV.find(n => n.key === active)?.label ?? 'Panel'}</span>
          </div>

          <form className="adm-search" onSubmit={e => { e.preventDefault(); if (q.trim()) navigate(`/admin/submissions?q=${encodeURIComponent(q.trim())}`); }}>
            <IcoSearch />
            <input value={q} onChange={e => setQ(e.target.value)} placeholder="Maqola, muallif, son…" />
          </form>

          <div className="adm-notif-wrap" ref={notifRef}>
            <button className="adm-bell" onClick={() => setNotifOpen(o => !o)} aria-label="Bildirishnomalar">
              <IcoBell />
              {unread > 0 && <span className="adm-bell-n">{unread}</span>}
            </button>
            {notifOpen && (
              <div className="adm-notif">
                <div className="adm-notif-head">
                  <b>Bildirishnomalar</b>
                  <button onClick={markAllSeen}>Hammasini o‘qildi</button>
                </div>
                {notifs.length === 0 && <div className="adm-notif-empty">Yangi bildirishnoma yo‘q</div>}
                {notifs.map(n => (
                  <Link key={n.id} to={n.to} className={`adm-notif-row ${n.kind}${!seenAt || n.time > seenAt ? ' new' : ''}`}
                    onClick={() => setNotifOpen(false)}>
                    <span className="dot" />
                    <span>
                      <span className="t">{n.text}</span>
                      <span className="m">{relTime(n.time)}</span>
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </div>

          <div className="adm-lang">
            {LANGS.map(l => (
              <button key={l.code} className={lang === l.code ? 'on' : ''} onClick={() => setLang(l.code)}>{l.label}</button>
            ))}
          </div>
        </header>

        <main className="adm-main">{children}</main>
      </div>
    </div>
  );
}

// ── Ikonkalar (16px, chiziqli) ────────────────────────────────────────────────

const P = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.7, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
function IcoGrid()   { return <svg width="16" height="16" viewBox="0 0 24 24" {...P}><rect x="4" y="4" width="6.5" height="6.5" rx="1"/><rect x="13.5" y="4" width="6.5" height="6.5" rx="1"/><rect x="4" y="13.5" width="6.5" height="6.5" rx="1"/><rect x="13.5" y="13.5" width="6.5" height="6.5" rx="1"/></svg>; }
function IcoInbox()  { return <svg width="16" height="16" viewBox="0 0 24 24" {...P}><path d="M4 13l2.5-8h11L20 13v6H4z"/><path d="M4 13h5l1.5 2.5h3L15 13h5"/></svg>; }
function IcoBook()   { return <svg width="16" height="16" viewBox="0 0 24 24" {...P}><path d="M5 4h6a2 2 0 0 1 2 2v14a2 2 0 0 0-2-2H5z"/><path d="M19 4h-6a2 2 0 0 0-2 2v14a2 2 0 0 1 2-2h6z"/></svg>; }
function IcoUsers()  { return <svg width="16" height="16" viewBox="0 0 24 24" {...P}><circle cx="9" cy="8" r="3.5"/><path d="M3 20c0-3.5 2.7-6 6-6s6 2.5 6 6"/><path d="M16 4.5a3.5 3.5 0 0 1 0 7"/><path d="M17 14c2.5.5 4 2.7 4 6"/></svg>; }
function IcoChat()   { return <svg width="16" height="16" viewBox="0 0 24 24" {...P}><path d="M4 6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H9l-5 4z"/></svg>; }
function IcoGear()   { return <svg width="16" height="16" viewBox="0 0 24 24" {...P}><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/></svg>; }
function IcoExt()    { return <svg width="16" height="16" viewBox="0 0 24 24" {...P}><path d="M14 4h6v6"/><path d="M20 4l-9 9"/><path d="M19 13v6a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h6"/></svg>; }
function IcoOut()    { return <svg width="16" height="16" viewBox="0 0 24 24" {...P}><path d="M10 4H5a1 1 0 0 0-1 1v14a1 1 0 0 0 1 1h5"/><path d="M15 8l4 4-4 4"/><path d="M19 12H9"/></svg>; }
function IcoBell()   { return <svg width="17" height="17" viewBox="0 0 24 24" {...P}><path d="M6 16V11a6 6 0 0 1 12 0v5l1.5 2h-15z"/><path d="M10 20a2 2 0 0 0 4 0"/></svg>; }
function IcoSearch() { return <svg width="15" height="15" viewBox="0 0 24 24" {...P}><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/></svg>; }
