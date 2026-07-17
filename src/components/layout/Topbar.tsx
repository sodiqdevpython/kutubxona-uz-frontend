import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { SearchIcon, UploadIcon, ChevIcon } from '../ui/Icons';
import { useAuth } from '../../context/AuthContext';
import { useLang, type Lang } from '../../context/LangContext';
import { useT } from '../../lib/i18n';
import { articlesApi, type ApiArticle } from '../../lib/api';

export type Page =
  | 'home' | 'articles' | 'archive' | 'authors' | 'central-asia'
  | 'submissions' | 'admin-authors' | 'admin-journals' | 'admin-chat';

const PUBLIC_NAV: { key: Page; tKey: string; to: string }[] = [
  { key: 'home',         tKey: 'nav.home',          to: '/' },
  { key: 'articles',     tKey: 'nav.articles',      to: '/articles' },
  { key: 'archive',      tKey: 'nav.archive',       to: '/archive' },
  { key: 'authors',      tKey: 'nav.authors',       to: '/authors' },
  { key: 'central-asia', tKey: 'nav.central_asia',  to: '/central-asia' },
];

// Admin sahifa yorliqlari — hozircha faqat lotin (admin panel ichi uchun etarli).
const ADMIN_NAV: { key: Page; label: string; to: string }[] = [
  { key: 'submissions',    label: 'Kelgan maqolalar', to: '/admin/submissions' },
  { key: 'admin-authors',  label: 'Mualliflar',       to: '/admin/authors'     },
  { key: 'admin-journals', label: 'Jurnal sonlari',   to: '/admin/journals'    },
  { key: 'admin-chat',     label: 'Xabarlar',         to: '/admin/chat'        },
];

const LANGS: { cc: string; code: string; value: Lang }[] = [
  { cc: 'uz', code: 'UZ', value: 'uz-latn' },
  { cc: 'uz', code: 'УЗ', value: 'uz-cyrl' },
  { cc: 'ru', code: 'РУ', value: 'ru'      },
  { cc: 'gb', code: 'EN', value: 'en'      },
];

/* Linklarning aynan o'zidagi padding — topnav a { padding: 24px 0 } */
const LINK_STYLE: React.CSSProperties = {
  padding: '24px 0',
  fontSize: 13.5,
  fontFamily: 'var(--sans)',
  fontWeight: 500,
  whiteSpace: 'nowrap',
  cursor: 'pointer',
};

export default function Topbar({ active }: { active: Page }) {
  const navigate = useNavigate();
  const { isAuthenticated, user, logout } = useAuth();
  const { lang, setLang } = useLang();
  const t = useT();
  const activeLangIdx = Math.max(0, LANGS.findIndex(l => l.value === lang));

  const [drawerOpen,  setDrawerOpen]  = useState(false);
  const [adminDrop,   setAdminDrop]   = useState(false);
  const dropRef = useRef<HTMLDivElement>(null);

  // ── Qidiruv (live) ────────────────────────────────────────────────────────
  const [searchQ, setSearchQ] = useState('');
  const [results, setResults] = useState<ApiArticle[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const q = searchQ.trim();
    if (q.length < 2) {
      setResults([]);
      setSearching(false);
      return;
    }
    setSearching(true);
    const t = setTimeout(() => {
      articlesApi.search(q)
        .then(rs => { setResults(rs); setSearching(false); })
        .catch(() => { setResults([]); setSearching(false); });
    }, 300);
    return () => clearTimeout(t);
  }, [searchQ]);

  useEffect(() => {
    function onOutside(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node))
        setSearchOpen(false);
    }
    document.addEventListener('mousedown', onOutside);
    return () => document.removeEventListener('mousedown', onOutside);
  }, []);

  function goToArticle(slug: string) {
    setSearchOpen(false);
    setSearchQ('');
    navigate(`/articles/${slug}`);
  }

  function submitSearch(e: React.FormEvent) {
    e.preventDefault();
    const q = searchQ.trim();
    if (!q) return;
    setSearchOpen(false);
    navigate(`/articles?search=${encodeURIComponent(q)}`);
  }

  useEffect(() => {
    function onOutside(e: MouseEvent) {
      if (dropRef.current && !dropRef.current.contains(e.target as Node))
        setAdminDrop(false);
    }
    document.addEventListener('mousedown', onOutside);
    return () => document.removeEventListener('mousedown', onOutside);
  }, []);

  const isAdminPage = ADMIN_NAV.some(n => n.key === active);
  const activeAdminLabel = ADMIN_NAV.find(n => n.key === active)?.label ?? t('nav.admin');

  return (
    <>
      <header className="topbar">

        {/* ── Chap: brand + nav ── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 40 }}>
          <div className="brand" style={{ cursor: 'pointer' }} onClick={() => navigate('/')}>
            <img src="/kutubxonauz.png" alt="kutubxona.uz" className="brand-logo" />
            <div className="brand-name">
              kutubxona.uz
              <span className="sub">O'zbekiston Milliy kutubxonasi</span>
            </div>
          </div>

          <nav className="topnav">
            {/* Ommaviy sahifalar — CSS'dan o'zgarishsiz */}
            {PUBLIC_NAV.map(n => (
              <Link key={n.key} to={n.to} className={active === n.key ? 'active' : ''}>
                {t(n.tKey)}
              </Link>
            ))}

            {/* Admin dropdown — faqat kirganlar */}
            {isAuthenticated && (
              <div ref={dropRef} style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>

                {/* Trigger — .topnav a bilan bir xil padding */}
                <button
                  onClick={() => setAdminDrop(p => !p)}
                  style={{
                    ...LINK_STYLE,
                    border: 0, background: 'none',
                    color: isAdminPage ? 'var(--navy)' : 'var(--ink-2)',
                    fontWeight: isAdminPage ? 600 : 500,
                    display: 'inline-flex', alignItems: 'center', gap: 5,
                    position: 'relative',
                  }}
                >
                  {isAdminPage ? activeAdminLabel : t('nav.admin')}
                  <ChevIcon size={9} style={{
                    transform: adminDrop ? 'rotate(180deg)' : 'none',
                    transition: 'transform .15s', opacity: 0.55,
                  }} />
                  {/* Active underline — .topnav a.active::after ni takrorlash */}
                  {isAdminPage && (
                    <span style={{
                      position: 'absolute', left: 0, right: 0,
                      bottom: -1, height: 2, background: 'var(--navy)',
                    }} />
                  )}
                </button>

                {/* Dropdown — HomePage category dropdown bilan bir xil stil */}
                {adminDrop && (
                  <div style={{
                    position: 'absolute', top: '100%', right: 0, zIndex: 200,
                    background: 'var(--paper)', border: '1px solid var(--line)',
                    borderRadius: 10,
                    boxShadow: '0 8px 32px -8px rgba(10,25,47,0.18)',
                    padding: 6, minWidth: 210, marginTop: 2,
                  }}>
                    {ADMIN_NAV.map(n => (
                      <Link
                        key={n.key} to={n.to}
                        onClick={() => setAdminDrop(false)}
                        className="pill-hover"
                        style={{
                          display: 'flex', alignItems: 'center',
                          justifyContent: 'space-between',
                          width: '100%', padding: '8px 10px', borderRadius: 6,
                          border: 0, background: active === n.key ? 'rgba(10,25,47,0.05)' : 'transparent',
                          fontFamily: 'var(--sans)', fontSize: 13,
                          color: active === n.key ? 'var(--navy)' : 'var(--ink-2)',
                          fontWeight: active === n.key ? 600 : 400,
                          cursor: 'pointer', textDecoration: 'none',
                        }}
                      >
                        {n.label}
                        {active === n.key && (
                          <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--navy)', flexShrink: 0 }} />
                        )}
                      </Link>
                    ))}

                    <div style={{ height: 1, background: 'var(--line)', margin: '4px 0' }} />

                    <div style={{ padding: '4px 10px 2px', fontSize: 11.5, color: 'var(--ink-4)' }}>
                      {user?.username}
                    </div>
                    <button
                      onClick={() => { logout(); navigate('/'); setAdminDrop(false); }}
                      className="pill-hover"
                      style={{
                        display: 'flex', alignItems: 'center',
                        width: '100%', padding: '8px 10px', borderRadius: 6,
                        border: 0, background: 'transparent',
                        fontFamily: 'var(--sans)', fontSize: 13,
                        color: 'var(--ink-3)', cursor: 'pointer',
                        boxSizing: 'border-box',
                      }}
                    >
                      {t('nav.logout')}
                    </button>
                  </div>
                )}
              </div>
            )}
          </nav>
        </div>

        {/* ── O'ng: qidiruv, til, tugmalar ── */}
        <div className="top-actions">
          <div ref={searchRef} style={{ position: 'relative', minWidth: 300 }}>
            <form onSubmit={submitSearch} className="searchbar topbar-search" style={{ minWidth: 300 }}>
              <SearchIcon size={14} style={{ color: 'var(--ink-4)', flexShrink: 0 }} />
              <input
                value={searchQ}
                onChange={e => { setSearchQ(e.target.value); setSearchOpen(true); }}
                onFocus={() => setSearchOpen(true)}
                placeholder={t('common.search_placeholder')}
              />
              {searchQ && (
                <button type="button" onClick={() => { setSearchQ(''); setResults([]); }}
                  style={{ background: 'none', border: 0, padding: '0 4px', cursor: 'pointer', color: 'var(--ink-3)', fontSize: 14, lineHeight: 1 }}>×</button>
              )}
            </form>

            {searchOpen && searchQ.trim().length >= 2 && (
              <div style={{
                position: 'absolute', top: 'calc(100% + 6px)', left: 0, right: 0, zIndex: 100,
                background: 'var(--paper)', border: '1px solid var(--line)', borderRadius: 10,
                boxShadow: '0 12px 40px -12px rgba(10,25,47,0.22), 0 2px 8px rgba(10,25,47,0.06)',
                padding: 6, maxHeight: 420, overflowY: 'auto',
              }}>
                {searching ? (
                  <div style={{ padding: '14px 12px', fontSize: 12.5, color: 'var(--ink-4)' }}>{t('common.searching')}</div>
                ) : results.length === 0 ? (
                  <div style={{ padding: '14px 12px', fontSize: 12.5, color: 'var(--ink-4)' }}>{t('common.no_results')}</div>
                ) : (
                  <>
                    {results.map(r => (
                      <button key={r.id} onClick={() => goToArticle(r.slug)} className="pill-hover"
                        style={{ display: 'flex', alignItems: 'flex-start', gap: 10, width: '100%', padding: '8px 10px', borderRadius: 6, border: 0, background: 'transparent', cursor: 'pointer', textAlign: 'left' }}>
                        <div style={{
                          width: 40, height: 40, borderRadius: 4, background: 'var(--grey-2)',
                          flexShrink: 0, overflow: 'hidden', border: '1px solid var(--line)',
                        }}>
                          {r.image_url && (
                            <img src={r.image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                          )}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          {r.category && (
                            <div style={{ fontSize: 9.5, color: 'var(--navy)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: 0.18, marginBottom: 2 }}>{r.category.name}</div>
                          )}
                          <div className="h-display" style={{ fontSize: 13, lineHeight: 1.3, color: 'var(--ink)', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                            {r.title}
                          </div>
                        </div>
                      </button>
                    ))}
                    <button onClick={submitSearch} className="pill-hover"
                      style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', padding: '10px', borderRadius: 6, border: 0, background: 'transparent', cursor: 'pointer', fontSize: 12, color: 'var(--navy)', fontWeight: 600, fontFamily: 'var(--sans)', marginTop: 4, borderTop: '1px solid var(--line)' }}>
                      {t('common.view_all_results')}
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
          <div className="lang-switch topbar-lang">
            {LANGS.map((l, i) => (
              <button key={i} className={`lang-opt${activeLangIdx === i ? ' active' : ''}`}
                onClick={() => setLang(l.value)}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '0 8px' }}>
                <img src={`https://flagcdn.com/16x12/${l.cc}.png`} width="16" height="12" alt={l.cc}
                  style={{ borderRadius: 1, display: 'block', flexShrink: 0 }} />{l.code}
              </button>
            ))}
          </div>
          <button
            className="btn primary"
            style={{ height: 38 }}
            onClick={() => window.open('https://t.me/journal_kutubxona_bot', '_blank')}
          >
            <UploadIcon size={14} />
            <span className="topbar-upload-lbl">{t('common.upload_article')}</span>
          </button>
          {/* Hamburger — CSS da mobile uchun ko'rinadi */}
          <button className="topbar-hamburger" onClick={() => setDrawerOpen(true)} aria-label={t('common.menu')}>
            <svg width="22" height="16" viewBox="0 0 22 16" fill="none">
              <line x1="0" y1="1"  x2="22" y2="1"  stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
              <line x1="0" y1="8"  x2="22" y2="8"  stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
              <line x1="0" y1="15" x2="22" y2="15" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
            </svg>
          </button>
        </div>
      </header>

      {/* ── Mobil drawer ── */}
      <div className={`mobile-nav${drawerOpen ? ' open' : ''}`}>
        <div className="mobile-nav-bg" onClick={() => setDrawerOpen(false)} />
        <div className="mobile-nav-panel">
          <div className="mobile-nav-head">
            <div className="brand" style={{ cursor: 'pointer' }}
              onClick={() => { setDrawerOpen(false); navigate('/'); }}>
              <img src="/kutubxonauz.png" alt="kutubxona.uz"
                style={{ width: 56, height: 56, objectFit: 'contain' }} />
              <div className="brand-name" style={{ fontSize: 17 }}>kutubxona.uz</div>
            </div>
            <button className="mobile-nav-close" onClick={() => setDrawerOpen(false)}>✕</button>
          </div>

          <nav className="mobile-nav-links">
            {PUBLIC_NAV.map(n => (
              <Link key={n.key} to={n.to}
                className={active === n.key ? 'active' : ''}
                onClick={() => setDrawerOpen(false)}>
                {t(n.tKey)}
              </Link>
            ))}

            {isAuthenticated && (
              <>
                <span style={{ display: 'block', height: 1, background: 'var(--line)', margin: '6px 0' }} />
                <span style={{
                  display: 'block', fontSize: 10.5, color: 'var(--ink-4)',
                  fontWeight: 700, letterSpacing: 0.18, textTransform: 'uppercase',
                  padding: '4px 0 6px',
                }}>{t('nav.admin')}</span>
                {ADMIN_NAV.map(n => (
                  <Link key={n.key} to={n.to}
                    className={active === n.key ? 'active' : ''}
                    onClick={() => setDrawerOpen(false)}>
                    {n.label}
                  </Link>
                ))}
                <button
                  onClick={() => { logout(); navigate('/'); setDrawerOpen(false); }}
                  style={{
                    background: 'none', border: 0,
                    padding: '12px 0', fontSize: 14,
                    fontFamily: 'var(--sans)', color: 'var(--ink-3)',
                    cursor: 'pointer', textAlign: 'left', width: '100%',
                  }}>
                  {t('nav.logout')}
                </button>
              </>
            )}
          </nav>

          <div className="mobile-nav-foot">
            <button
              className="btn primary"
              style={{ width: '100%', height: 42, justifyContent: 'center' }}
              onClick={() => window.open('https://t.me/journal_kutubxona_bot', '_blank')}
            >
              <UploadIcon size={14} /> {t('common.upload_article')}
            </button>
            <div style={{ marginTop: 14, display: 'flex', justifyContent: 'center' }}>
              <div className="lang-switch">
                {LANGS.map((l, i) => (
                  <button key={i} className={`lang-opt${activeLangIdx === i ? ' active' : ''}`}
                    onClick={() => setLang(l.value)}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '0 8px' }}>
                    <img src={`https://flagcdn.com/16x12/${l.cc}.png`} width="16" height="12" alt={l.cc}
                      style={{ borderRadius: 1, display: 'block', flexShrink: 0 }} />{l.code}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
