import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { SearchIcon, ChevIcon } from '../ui/Icons';
import { useAuth } from '../../context/AuthContext';
import { useLang, type Lang } from '../../context/LangContext';
import { useT } from '../../lib/i18n';
import { articlesApi, type ApiArticle } from '../../lib/api';
import { API_BASE } from '../../lib/config';

export type Page =
  | 'home' | 'articles' | 'archive' | 'authors' | 'central-asia' | 'about'
  | 'submissions' | 'admin-authors' | 'admin-journals' | 'admin-chat';

/** Sayt identifikatorlari — Figma'da sarlavhaning o'ng chetida turadi. */
const ISSN = '2181-1732';
const DOI_PREFIX = '10.62499';

const PUBLIC_NAV: { key: Page; tKey: string; to: string; countKey?: CountKey }[] = [
  { key: 'articles',     tKey: 'nav.articles',     to: '/articles',     countKey: 'articles' },
  { key: 'archive',      tKey: 'nav.archive',      to: '/archive',      countKey: 'issues'   },
  { key: 'authors',      tKey: 'nav.authors',      to: '/authors',      countKey: 'authors'  },
  { key: 'central-asia', tKey: 'nav.central_asia', to: '/central-asia', countKey: 'central'  },
];

type CountKey = 'articles' | 'issues' | 'authors' | 'central';

/** «Jurnal haqida ▾» ichidagi statik sahifalar (Figma: 14–17-freymlar). */
const ABOUT_NAV: { label: string; to: string }[] = [
  { label: 'Jurnal haqida',              to: '/about' },
  { label: 'Tahririyat kengashi',        to: '/about/board' },
  { label: 'Taqriz siyosati va etika',   to: '/about/policy' },
  { label: 'Mualliflar uchun qo‘llanma', to: '/about/guide' },
];

// Admin sahifa yorliqlari — hozircha faqat lotin (admin panel ichi uchun etarli).
const ADMIN_NAV: { key: Page; label: string; to: string }[] = [
  { key: 'submissions',    label: 'Kelgan maqolalar', to: '/admin/submissions' },
  { key: 'admin-authors',  label: 'Mualliflar',       to: '/admin/authors'     },
  { key: 'admin-journals', label: 'Jurnal sonlari',   to: '/admin/journals'    },
  { key: 'admin-chat',     label: 'Xabarlar',         to: '/admin/chat'        },
];

const LANGS: { code: string; value: Lang }[] = [
  { code: "O'z", value: 'uz-latn' },
  { code: 'Ўз',  value: 'uz-cyrl' },
  { code: 'Ру',  value: 'ru'      },
  { code: 'En',  value: 'en'      },
];

export default function Topbar({ active }: { active: Page }) {
  const navigate = useNavigate();
  const { isAuthenticated, user, logout } = useAuth();
  const { lang, setLang } = useLang();
  const t = useT();
  const activeLangIdx = Math.max(0, LANGS.findIndex(l => l.value === lang));

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [adminDrop,  setAdminDrop]  = useState(false);
  const [aboutDrop,  setAboutDrop]  = useState(false);
  const [langDrop,   setLangDrop]   = useState(false);
  const dropRef  = useRef<HTMLDivElement>(null);
  const aboutRef = useRef<HTMLDivElement>(null);
  const langRef  = useRef<HTMLDivElement>(null);

  // ── Navigatsiyadagi raqamlar ──────────────────────────────────────────────
  const [counts, setCounts] = useState<Record<CountKey, number | null>>({
    articles: null, issues: null, authors: null, central: null,
  });

  useEffect(() => {
    let alive = true;
    Promise.all([
      fetch(`${API_BASE}/api/articles/stats/`).then(r => (r.ok ? r.json() : null)).catch(() => null),
      fetch(`${API_BASE}/api/central-asia/?page_size=1`).then(r => (r.ok ? r.json() : null)).catch(() => null),
    ]).then(([stats, ca]) => {
      if (!alive) return;
      setCounts({
        articles: stats?.articles ?? null,
        issues:   stats?.issues   ?? null,
        authors:  stats?.authors  ?? null,
        central:  ca?.count       ?? null,
      });
    });
    return () => { alive = false; };
  }, []);

  // ── Qidiruv (live) ────────────────────────────────────────────────────────
  const [searchQ, setSearchQ] = useState('');
  const [results, setResults] = useState<ApiArticle[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const q = searchQ.trim();
    if (q.length < 2) { setResults([]); setSearching(false); return; }
    setSearching(true);
    const timer = setTimeout(() => {
      articlesApi.search(q)
        .then(rs => { setResults(rs); setSearching(false); })
        .catch(() => { setResults([]); setSearching(false); });
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQ]);

  // Tashqariga bosilganda ochiq menyularni yopamiz
  useEffect(() => {
    function onOutside(e: MouseEvent) {
      const hit = (r: React.RefObject<HTMLDivElement | null>) =>
        r.current && r.current.contains(e.target as Node);
      if (!hit(searchRef)) setSearchOpen(false);
      if (!hit(dropRef))   setAdminDrop(false);
      if (!hit(aboutRef))  setAboutDrop(false);
      if (!hit(langRef))   setLangDrop(false);
    }
    document.addEventListener('mousedown', onOutside);
    return () => document.removeEventListener('mousedown', onOutside);
  }, []);

  // «/» tugmasi — qidiruvga fokus (Figma'da qidiruv ichida shu ko'rsatkich bor)
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const el = document.activeElement;
      const typing = el && ['INPUT', 'TEXTAREA'].includes(el.tagName);
      if (e.key === '/' && !typing) { e.preventDefault(); searchInputRef.current?.focus(); }
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
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

  const isAdminPage = ADMIN_NAV.some(n => n.key === active);
  const activeAdminLabel = ADMIN_NAV.find(n => n.key === active)?.label ?? t('nav.admin');

  return (
    <>
      {/* ═══ 1-qator: logotip · qidiruv · til/tema/CTA ═══ */}
      <header className="topbar">
        <Link to="/" className="brand" aria-label="Kutubxona.uz">
          <Wordmark />
        </Link>

        {/* Qidiruv — markazda */}
        <div ref={searchRef} className="topbar-search-wrap">
          <form onSubmit={submitSearch} className="searchbar">
            <SearchIcon size={14} style={{ color: 'var(--ink-4)', flexShrink: 0 }} />
            <input
              ref={searchInputRef}
              value={searchQ}
              onChange={e => { setSearchQ(e.target.value); setSearchOpen(true); }}
              onFocus={() => setSearchOpen(true)}
              placeholder={t('common.search_placeholder')}
            />
            {searchQ
              ? <button type="button" onClick={() => { setSearchQ(''); setResults([]); }}
                  style={{ background: 'none', border: 0, padding: '0 2px', cursor: 'pointer', color: 'var(--ink-3)', fontSize: 15, lineHeight: 1 }}>×</button>
              : <span className="kbd">/</span>}
          </form>

          {searchOpen && searchQ.trim().length >= 2 && (
            <div style={{
              position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 200,
              marginTop: 6, background: 'var(--paper)',
              border: '1px solid var(--line)', borderRadius: 10,
              boxShadow: '0 12px 36px -12px rgba(43,43,43,0.22)', padding: 6,
              maxHeight: 420, overflowY: 'auto',
            }}>
              {searching ? (
                <div style={{ padding: '14px 12px', fontSize: 13, color: 'var(--ink-3)' }}>
                  {t('common.searching')}
                </div>
              ) : results.length === 0 ? (
                <div style={{ padding: '14px 12px', fontSize: 13, color: 'var(--ink-3)' }}>
                  {t('common.nothing_found')}
                </div>
              ) : (
                <>
                  {results.map(r => (
                    <button key={r.id} onClick={() => goToArticle(r.slug)} className="pill-hover"
                      style={{
                        display: 'flex', gap: 10, alignItems: 'flex-start', width: '100%',
                        padding: '9px 10px', borderRadius: 6, border: 0,
                        background: 'transparent', cursor: 'pointer', textAlign: 'left',
                      }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        {r.category && (
                          <div className="tag cat" style={{ marginBottom: 3 }}>{r.category.name}</div>
                        )}
                        <div className="h-display" style={{
                          fontSize: 14, lineHeight: 1.32, color: 'var(--ink)',
                          display: '-webkit-box', WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical', overflow: 'hidden',
                        }}>
                          {r.title}
                        </div>
                      </div>
                    </button>
                  ))}
                  <button onClick={submitSearch} className="pill-hover"
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      width: '100%', padding: '10px', borderRadius: 6, border: 0,
                      background: 'transparent', cursor: 'pointer', fontSize: 13,
                      color: 'var(--accent)', fontWeight: 600, fontFamily: 'var(--sans)',
                      marginTop: 4, borderTop: '1px solid var(--line)',
                    }}>
                    {t('common.view_all_results')}
                  </button>
                </>
              )}
            </div>
          )}
        </div>

        {/* O'ng: til · tema · CTA */}
        <div className="top-actions">
          <div ref={langRef} style={{ position: 'relative' }}>
            <button className="lang-switch" onClick={() => setLangDrop(p => !p)}
              style={{ cursor: 'pointer', gap: 6 }}>
              <span className="lang-opt active">{LANGS[activeLangIdx].code}</span>
              <ChevIcon size={9} style={{ opacity: 0.5, transform: langDrop ? 'rotate(180deg)' : 'none', transition: 'transform .15s' }} />
            </button>
            {langDrop && (
              <div style={{
                position: 'absolute', top: '100%', right: 0, marginTop: 4, zIndex: 200,
                background: 'var(--paper)', border: '1px solid var(--line)',
                borderRadius: 8, boxShadow: '0 10px 30px -10px rgba(43,43,43,0.2)',
                padding: 5, minWidth: 120,
              }}>
                {LANGS.map((l, i) => (
                  <button key={i} onClick={() => { setLang(l.value); setLangDrop(false); }}
                    className="pill-hover"
                    style={{
                      display: 'block', width: '100%', textAlign: 'left',
                      padding: '7px 10px', borderRadius: 6, border: 0,
                      background: activeLangIdx === i ? 'var(--accent-08)' : 'transparent',
                      color: activeLangIdx === i ? 'var(--accent)' : 'var(--ink-2)',
                      fontWeight: activeLangIdx === i ? 600 : 400,
                      fontFamily: 'var(--sans)', fontSize: 13, cursor: 'pointer',
                    }}>
                    {l.code}
                  </button>
                ))}
              </div>
            )}
          </div>

          <ThemeToggle />

          <button className="btn primary topbar-cta"
            onClick={() => window.open('https://t.me/journal_kutubxona_bot', '_blank')}>
            {t('common.upload_article')}
          </button>

          <button className="topbar-hamburger" onClick={() => setDrawerOpen(true)} aria-label={t('common.menu')}>
            <svg width="22" height="16" viewBox="0 0 22 16" fill="none">
              <line x1="0" y1="1"  x2="22" y2="1"  stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
              <line x1="0" y1="8"  x2="22" y2="8"  stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
              <line x1="0" y1="15" x2="22" y2="15" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
            </svg>
          </button>
        </div>
      </header>

      {/* ═══ 2-qator: navigatsiya · ISSN/DOI ═══ */}
      <div className="topbar-nav">
        <nav className="topnav">
          {PUBLIC_NAV.map(n => {
            const c = n.countKey ? counts[n.countKey] : null;
            return (
              <Link key={n.key} to={n.to} className={active === n.key ? 'active' : ''}>
                {t(n.tKey)}
                {c !== null && <span className="count">{c}</span>}
              </Link>
            );
          })}

          {/* Jurnal haqida ▾ */}
          <div ref={aboutRef} style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <button onClick={() => setAboutDrop(p => !p)}
              className={active === 'about' ? 'topnav-trigger active' : 'topnav-trigger'}>
              Jurnal haqida
              <ChevIcon size={9} style={{ opacity: 0.55, transform: aboutDrop ? 'rotate(180deg)' : 'none', transition: 'transform .15s' }} />
            </button>
            {aboutDrop && (
              <div style={{
                position: 'absolute', top: '100%', left: 0, zIndex: 200,
                background: 'var(--paper)', border: '1px solid var(--line)',
                borderRadius: 10, boxShadow: '0 10px 30px -10px rgba(43,43,43,0.2)',
                padding: 6, minWidth: 230,
              }}>
                {ABOUT_NAV.map(n => (
                  <Link key={n.to} to={n.to} onClick={() => setAboutDrop(false)} className="pill-hover"
                    style={{
                      display: 'block', width: '100%', padding: '8px 10px', borderRadius: 6,
                      fontFamily: 'var(--sans)', fontSize: 13.5, color: 'var(--ink-2)',
                      textDecoration: 'none',
                    }}>
                    {n.label}
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Admin dropdown — faqat kirganlar */}
          {isAuthenticated && (
            <div ref={dropRef} style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <button onClick={() => setAdminDrop(p => !p)}
                className={isAdminPage ? 'topnav-trigger active' : 'topnav-trigger'}>
                {isAdminPage ? activeAdminLabel : t('nav.admin')}
                <ChevIcon size={9} style={{ opacity: 0.55, transform: adminDrop ? 'rotate(180deg)' : 'none', transition: 'transform .15s' }} />
              </button>

              {adminDrop && (
                <div style={{
                  position: 'absolute', top: '100%', right: 0, zIndex: 200,
                  background: 'var(--paper)', border: '1px solid var(--line)',
                  borderRadius: 10, boxShadow: '0 10px 30px -10px rgba(43,43,43,0.2)',
                  padding: 6, minWidth: 210, marginTop: 2,
                }}>
                  {ADMIN_NAV.map(n => (
                    <Link key={n.key} to={n.to} onClick={() => setAdminDrop(false)} className="pill-hover"
                      style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        width: '100%', padding: '8px 10px', borderRadius: 6, border: 0,
                        background: active === n.key ? 'var(--accent-08)' : 'transparent',
                        fontFamily: 'var(--sans)', fontSize: 13,
                        color: active === n.key ? 'var(--accent)' : 'var(--ink-2)',
                        fontWeight: active === n.key ? 600 : 400,
                        cursor: 'pointer', textDecoration: 'none',
                      }}>
                      {n.label}
                      {active === n.key && (
                        <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent)', flexShrink: 0 }} />
                      )}
                    </Link>
                  ))}

                  <div style={{ height: 1, background: 'var(--line)', margin: '4px 0' }} />
                  <div style={{ padding: '4px 10px 2px', fontSize: 11.5, color: 'var(--ink-4)' }}>
                    {user?.username}
                  </div>
                  <button onClick={() => { logout(); navigate('/'); setAdminDrop(false); }}
                    className="pill-hover"
                    style={{
                      display: 'flex', alignItems: 'center', width: '100%',
                      padding: '8px 10px', borderRadius: 6, border: 0, background: 'transparent',
                      fontFamily: 'var(--sans)', fontSize: 13, color: 'var(--ink-3)',
                      cursor: 'pointer', boxSizing: 'border-box',
                    }}>
                    {t('nav.logout')}
                  </button>
                </div>
              )}
            </div>
          )}
        </nav>

        <div className="meta topbar-ids">
          ISSN {ISSN} · DOI {DOI_PREFIX}
        </div>
      </div>

      {/* ── Mobil drawer ── */}
      <div className={`mobile-nav${drawerOpen ? ' open' : ''}`}>
        <div className="mobile-nav-bg" onClick={() => setDrawerOpen(false)} />
        <div className="mobile-nav-panel">
          <div className="mobile-nav-head">
            <div className="brand" style={{ cursor: 'pointer' }}
              onClick={() => { setDrawerOpen(false); navigate('/'); }}>
              <Wordmark />
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
            {ABOUT_NAV.map(n => (
              <Link key={n.to} to={n.to} onClick={() => setDrawerOpen(false)}>{n.label}</Link>
            ))}

            {isAuthenticated && (
              <>
                <span style={{ display: 'block', height: 1, background: 'var(--line)', margin: '6px 0' }} />
                <span className="eyebrow" style={{ display: 'block', padding: '4px 0 6px' }}>
                  {t('nav.admin')}
                </span>
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
                    background: 'none', border: 0, padding: '12px 0', fontSize: 14,
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
              style={{ width: '100%', height: 42 }}
              onClick={() => window.open('https://t.me/journal_kutubxona_bot', '_blank')}
            >
              {t('common.upload_article')}
            </button>
            <div style={{ marginTop: 14, display: 'flex', justifyContent: 'center', gap: 4 }}>
              {LANGS.map((l, i) => (
                <button key={i} className={`lang-opt${activeLangIdx === i ? ' active' : ''}`}
                  onClick={() => setLang(l.value)}
                  style={{ padding: '6px 10px', cursor: 'pointer' }}>
                  {l.code}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

/**
 * Logotip — Figma'da bu alohida rasm emas, matn:
 * «K» va «.UZ» to'q sariq, qolgani to'q rangda; pastida mayda tavsif.
 */
export function Wordmark({ light = false }: { light?: boolean }) {
  return (
    <span className="wordmark" data-light={light ? 'on' : undefined}>
      <span className="wordmark-main">
        <span className="wordmark-k">K</span>UTUBXONA<span className="wordmark-uz">.UZ</span>
      </span>
      <span className="wordmark-sub">
        AXBOROT-KUTUBXONA <span>texnologiyalari</span> JURNALI
      </span>
    </span>
  );
}

/** Yorug'/qorong'i tema tugmasi (Figma: qidiruv yonidagi yarim doira ikonka). */
function ThemeToggle() {
  const [dark, setDark] = useState(() => {
    try { return localStorage.getItem('kb_theme') === 'dark'; } catch { return false; }
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
    try { localStorage.setItem('kb_theme', dark ? 'dark' : 'light'); } catch { /* ignore */ }
  }, [dark]);

  return (
    <button className="icon-btn" onClick={() => setDark(d => !d)}
      aria-label={dark ? 'Yorug‘ rejim' : 'Qorong‘i rejim'}
      title={dark ? 'Yorug‘ rejim' : 'Qorong‘i rejim'}>
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <circle cx="8" cy="8" r="6.4" stroke="currentColor" strokeWidth="1.3" />
        <path d="M8 1.6a6.4 6.4 0 0 0 0 12.8V1.6Z" fill="currentColor" />
      </svg>
    </button>
  );
}
