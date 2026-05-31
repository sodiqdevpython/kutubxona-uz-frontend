import { useState, useRef, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Topbar from '../components/layout/Topbar';
import Footer from '../components/layout/Footer';
import PageLoadBar from '../components/ui/PageLoadBar';
import AuthorAvatar from '../components/ui/AuthorAvatar';
import ArtVariant from '../components/ui/ArtVariant';
import LoadMoreButton from '../components/ui/LoadMoreButton';
import {
  ChevIcon, GridIcon, ClockIcon, ArrowIcon,
  FireIcon, EyeIcon, TelegramIcon,
} from '../components/ui/Icons';
import { useFetch } from '../lib/hooks';
import type { ApiArticle, ApiCategory, PaginatedResponse } from '../lib/api';
import Seo from '../components/Seo';

const BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:8000';
const PAGE_SIZE = 9;

const ART_KINDS = ['rdf', 'grid', 'bars', 'dossier', 'glyph', 'map', 'manuscript'];
const artKind = (n: number) => ART_KINDS[n % ART_KINDS.length];

// ── Helpers ───────────────────────────────────────────────────────────────────

function relDate(iso: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  const diff = Math.floor((Date.now() - d.getTime()) / 1000);
  if (diff < 3600)    return `${Math.floor(diff / 60)} daqiqa oldin`;
  if (diff < 86400)   return `${Math.floor(diff / 3600)} soat oldin`;
  if (diff < 172800)  return 'Kecha';
  if (diff < 604800)  return `${Math.floor(diff / 86400)} kun oldin`;
  return d.toLocaleDateString('uz-UZ', { day: 'numeric', month: 'long', year: 'numeric' });
}

// "Maqola sarlavhasi juda uzun bo'lsa..." → max N belgi
function trim(text: string, n: number): string {
  if (!text) return '';
  return text.length > n ? text.slice(0, n - 1).trimEnd() + '…' : text;
}

// CSS line-clamp helperi
const clamp = (lines: number): React.CSSProperties => ({
  display: '-webkit-box',
  WebkitLineClamp: lines,
  WebkitBoxOrient: 'vertical' as const,
  overflow: 'hidden',
  wordBreak: 'break-word' as const,
});

// Maqola rasmi — agar muallif yuborgan rasm bo'lsa shu, aks holda SVG variant.
// `aspectRatio` bilan responsive: kenglik o'zgarsa balandlik avtomatik mos keladi.
function ArticleImage({ a, ratio = '16 / 10' }: { a: ApiArticle; ratio?: string }) {
  if (a.image_url) {
    return (
      <img
        src={a.image_url} alt={a.title} loading="lazy"
        style={{
          width: '100%', aspectRatio: ratio, objectFit: 'cover',
          objectPosition: 'center', display: 'block', background: 'var(--grey-2)',
        }}
      />
    );
  }
  return (
    <div style={{ width: '100%', aspectRatio: ratio, position: 'relative', overflow: 'hidden' }}>
      <ArtVariant kind={artKind(a.img_variant)} />
    </div>
  );
}

// ── Sort variantlari ──────────────────────────────────────────────────────────

type SortKey = 'new' | 'popular' | 'views';
const SORT_OPTS: Record<SortKey, { label: string; param: string }> = {
  new:     { label: 'Eng yangi',      param: '-published_at' },
  popular: { label: 'Mashhur',        param: '-cites' },
  views:   { label: "Ko'p o'qilgan",  param: '-views' },
};

// ── Komponent ─────────────────────────────────────────────────────────────────

export default function HomePage() {
  const navigate = useNavigate();
  const [catDropOpen, setCatDropOpen] = useState(false);
  const [feedPage, setFeedPage] = useState(1);
  const [activeCat, setActiveCat] = useState<string | null>(null);   // slug yoki null
  const [sort, setSort] = useState<SortKey>('new');
  const catDropRef = useRef<HTMLDivElement>(null);

  // ── API URL'lar ─────────────────────────────────────────────────────────────
  const feedUrl = useMemo(() => {
    const p = new URLSearchParams();
    p.set('ordering', SORT_OPTS[sort].param);
    if (activeCat) p.set('categories', activeCat);
    p.set('page_size', String(feedPage * PAGE_SIZE));
    return `${BASE}/api/articles/?${p.toString()}`;
  }, [sort, activeCat, feedPage]);

  // ── API fetches ──────────────────────────────────────────────────────────────
  const feedState  = useFetch<PaginatedResponse<ApiArticle>>(feedUrl);
  const trendState = useFetch<PaginatedResponse<ApiArticle>>(`${BASE}/api/articles/?ordering=-views&page_size=5`);
  const catState   = useFetch<ApiCategory[]>(`${BASE}/api/categories/`);
  const statsState = useFetch<{ articles: number; authors: number; issues: number }>(`${BASE}/api/articles/stats/`);

  const articles    = feedState.status === 'ok' ? feedState.data.results : [];
  const totalCount  = feedState.status === 'ok' ? feedState.data.count    : 0;
  const featured    = articles[0] ?? null;
  const sidePool    = articles.slice(1, 9);   // 8 ta — rotation uchun pool
  const trending    = trendState.status === 'ok' ? trendState.data.results : [];
  const categories  = catState.status   === 'ok' ? catState.data           : [];
  const stats       = statsState.status === 'ok' ? statsState.data : null;

  // ── Side cards rotation: har 6 sekundda 2 ta maqola almashinadi ──
  const [sideIdx, setSideIdx] = useState(0);
  useEffect(() => {
    if (sidePool.length <= 2) return;
    const t = setInterval(() => {
      setSideIdx(i => (i + 2) % sidePool.length);
    }, 6000);
    return () => clearInterval(t);
  }, [sidePool.length]);

  const sideCards = sidePool.length > 0
    ? [
        sidePool[sideIdx % sidePool.length],
        sidePool[(sideIdx + 1) % sidePool.length],
      ].filter(Boolean)
    : [];

  // ── Filter o'zgarsa, page reset ─────────────────────────────────────────────
  useEffect(() => { setFeedPage(1); }, [activeCat, sort]);

  // Tashqi click → dropdown yopiladi
  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (catDropRef.current && !catDropRef.current.contains(e.target as Node))
        setCatDropOpen(false);
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, []);

  // ── Category tablari: 4 ko'rinadi, qolgani dropdownda ──────────────────────
  const visibleCats = categories.slice(0, 4);
  const extraCats   = categories.slice(4);

  const selectCat = (slug: string | null) => {
    setActiveCat(slug);
    setCatDropOpen(false);
  };

  return (
    <div className="bg-home" style={{ minHeight: '100vh' }}>
      <Seo
        title="Bosh sahifa"
        description="O'zbekiston kutubxonalari arxivi — ilmiy maqolalar, mualliflar, jurnal sonlari. Raqamlashtirilgan ilmiy meros."
      />
      <PageLoadBar />
      <Topbar active="home" />

      {/* ── Hero ── */}
      <div style={{ borderBottom: '1px solid var(--line)', position: 'relative', overflow: 'hidden', background: 'linear-gradient(180deg,rgba(255,255,255,0.7),rgba(245,247,250,0.4))' }}>
        <svg style={{ position: 'absolute', right: 0, top: 0, width: 280, height: '100%', opacity: 0.5, pointerEvents: 'none' }} viewBox="0 0 280 200" preserveAspectRatio="xMaxYMid slice">
          <g fill="#0A192F" opacity="0.08">
            {Array.from({ length: 14 }).map((_, r) =>
              Array.from({ length: 18 }).map((_, c) => <circle key={`${r}-${c}`} cx={c * 16 + 8} cy={r * 14 + 8} r="1" />)
            )}
          </g>
        </svg>
        <div className="rsp-hero-grid" style={{ padding: '32px var(--px)', maxWidth: 1400, margin: '0 auto' }}>
          <div>
            <h1 className="h-display" style={{ fontSize: 36, letterSpacing: '-0.02em', lineHeight: 1.1 }}>
              Ilmiy meros va kelajak <em>raqamli formatda</em>.
            </h1>
          </div>
          <div className="hero-stats" style={{ display: 'flex', alignItems: 'stretch', background: 'rgba(255,255,255,0.6)', backdropFilter: 'blur(8px)', border: '1px solid var(--line)', borderRadius: 10, padding: 4 }}>
            {[
              [stats?.articles ?? '—', 'Maqolalar'],
              [stats?.authors  ?? '—', 'Mualliflar'],
              [stats?.issues   ?? '—', 'Jurnal soni'],
            ].map(([k, v], i) => (
              <div key={i} style={{ padding: '10px 22px', borderRight: i < 2 ? '1px solid var(--line)' : 'none', display: 'flex', flexDirection: 'column', justifyContent: 'center', minWidth: 118 }}>
                <span style={{ fontFamily: 'var(--serif)', fontSize: 22, color: 'var(--navy)', fontWeight: 600, letterSpacing: '-0.015em', lineHeight: 1 }}>
                  {typeof k === 'number' ? k.toLocaleString() : k}
                </span>
                <div style={{ fontSize: 10.5, color: 'var(--ink-3)', marginTop: 6, letterSpacing: 0.2, textTransform: 'uppercase', fontWeight: 600 }}>{v}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Category tablari + sort ── */}
      <div style={{ borderBottom: '1px solid var(--line)', background: 'var(--paper)', position: 'sticky', top: 68, zIndex: 40 }}>
        <div style={{ padding: '0 var(--px)', maxWidth: 1400, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 24 }}>
          <div className="cat-tabs-scroll" style={{ flex: 1 }}>
            <div className="cat-tabs-inner">
              {/* "Barchasi" */}
              {(() => {
                const on = activeCat === null;
                return (
                  <button onClick={() => selectCat(null)} className="cat-tab" style={{ border: 0, background: 'transparent', padding: '18px 18px', fontFamily: 'var(--sans)', fontSize: 13, fontWeight: on ? 600 : 500, color: on ? 'var(--navy)' : 'var(--ink-3)', borderBottom: on ? '2px solid var(--navy)' : '2px solid transparent', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 8, whiteSpace: 'nowrap', marginBottom: -1, position: 'relative' }}>
                    Barchasi
                    {stats && (
                      <span style={{ fontSize: 10, fontFamily: 'var(--mono)', fontWeight: 600, background: on ? 'var(--navy)' : 'var(--grey-2)', color: on ? 'white' : 'var(--ink-3)', padding: '2px 6px', borderRadius: 3 }}>{stats.articles}</span>
                    )}
                  </button>
                );
              })()}

              {visibleCats.map(c => {
                const on = activeCat === c.slug;
                return (
                  <button key={c.id} onClick={() => selectCat(c.slug)} className="cat-tab" style={{ border: 0, background: 'transparent', padding: '18px 18px', fontFamily: 'var(--sans)', fontSize: 13, fontWeight: on ? 600 : 500, color: on ? 'var(--navy)' : 'var(--ink-3)', borderBottom: on ? '2px solid var(--navy)' : '2px solid transparent', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 8, whiteSpace: 'nowrap', marginBottom: -1 }}>
                    {c.name}
                    <span style={{ fontSize: 10, fontFamily: 'var(--mono)', fontWeight: 600, background: on ? 'var(--navy)' : 'var(--grey-2)', color: on ? 'white' : 'var(--ink-3)', padding: '2px 6px', borderRadius: 3 }}>{c.article_count}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {extraCats.length > 0 && (
            <div ref={catDropRef} style={{ position: 'relative', flexShrink: 0, borderLeft: '1px solid var(--line)', paddingLeft: 4 }}>
              <button className="cat-tab" onClick={() => setCatDropOpen(v => !v)} style={{ border: 0, background: 'transparent', padding: '18px 14px', fontFamily: 'var(--sans)', fontSize: 13, fontWeight: 500, color: 'var(--ink-3)', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap' }}>
                <GridIcon size={12} /> Yana {extraCats.length} yo'nalish <ChevIcon size={10} style={{ transform: catDropOpen ? 'rotate(180deg)' : undefined, transition: 'transform .15s' }} />
              </button>
              {catDropOpen && (
                <div style={{ position: 'absolute', top: '100%', right: 0, zIndex: 200, background: 'var(--paper)', border: '1px solid var(--line)', borderRadius: 10, boxShadow: '0 8px 32px -8px rgba(10,25,47,0.18)', padding: 6, minWidth: 220, marginTop: 2 }}>
                  {extraCats.map(c => {
                    const on = activeCat === c.slug;
                    return (
                      <button key={c.id} onClick={() => selectCat(c.slug)} className="pill-hover"
                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', padding: '8px 10px', borderRadius: 6, border: 0, background: on ? 'rgba(10,25,47,0.05)' : 'transparent', fontFamily: 'var(--sans)', fontSize: 13, color: on ? 'var(--navy)' : 'var(--ink-2)', fontWeight: on ? 600 : 400, cursor: 'pointer', textAlign: 'left' }}>
                        {c.name}
                        <span style={{ fontSize: 10.5, color: 'var(--ink-4)', fontFamily: 'var(--mono)', background: 'var(--grey-2)', padding: '2px 5px', borderRadius: 3, marginLeft: 10 }}>{c.article_count}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          <div className="cat-sort-hide" style={{ display: 'flex', alignItems: 'center', gap: 14, fontSize: 12.5, flexShrink: 0 }}>
            <span style={{ color: 'var(--ink-4)' }}>Saralash:</span>
            {(Object.keys(SORT_OPTS) as SortKey[]).map(key => {
              const on = sort === key;
              return (
                <a key={key} onClick={() => setSort(key)}
                  style={{ color: on ? 'var(--navy)' : 'var(--ink-3)', fontWeight: on ? 600 : 400, paddingBottom: on ? 2 : 0, borderBottom: on ? '1px solid var(--navy)' : 'none', cursor: 'pointer' }}>
                  {SORT_OPTS[key].label}
                </a>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Main content ── */}
      <div className="rsp-home" style={{ padding: '32px var(--px) 64px', maxWidth: 1400, margin: '0 auto' }}>
        <div>
          {/* Featured (faqat "Barchasi" tanlanganda) */}
          {!activeCat && feedState.status === 'ok' && featured && (
            <section style={{ marginTop: 32, marginBottom: 48 }}>
              <div className="rsp-featured">
                {/* Big featured card */}
                <article className="card-lift" onClick={() => navigate(`/articles/${featured.slug}`)}
                  style={{ borderRadius: 12, background: 'var(--navy)', color: 'white', overflow: 'hidden', position: 'relative', minHeight: 420, display: 'flex', flexDirection: 'column', cursor: 'pointer' }}>
                  <div style={{ position: 'relative', overflow: 'hidden', background: 'var(--grey-2)' }}>
                    {featured.image_url ? (
                      <img
                        src={featured.image_url} alt={featured.title} loading="lazy"
                        style={{
                          width: '100%', aspectRatio: '16 / 9',
                          objectFit: 'cover', objectPosition: 'center', display: 'block',
                        }}
                      />
                    ) : (
                      <div style={{ aspectRatio: '16 / 9', background: 'linear-gradient(135deg,#102441 0%,#0A192F 100%)', position: 'relative', overflow: 'hidden' }}>
                        <ArtVariant kind="manuscript-hero" />
                      </div>
                    )}
                    <span style={{ position: 'absolute', top: 20, left: 20, background: 'rgba(255,255,255,0.95)', color: 'var(--navy)', fontSize: 10.5, fontWeight: 700, letterSpacing: 0.18, textTransform: 'uppercase', padding: '5px 10px', borderRadius: 3 }}>
                      {featured.category?.name ?? 'Maqola'}
                    </span>
                  </div>
                  <div style={{ padding: '28px 32px' }}>
                    <h2 className="h-display" style={{ fontSize: 30, lineHeight: 1.15, marginBottom: 14, color: 'white', ...clamp(2) }}>
                      {featured.title}
                    </h2>
                    {featured.excerpt && (
                      <p style={{ fontSize: 14, lineHeight: 1.6, color: 'rgba(255,255,255,0.75)', marginBottom: 20, ...clamp(2) }}>
                        {featured.excerpt}
                      </p>
                    )}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16, fontSize: 12.5, paddingTop: 18, borderTop: '1px solid rgba(255,255,255,0.12)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                        {featured.authors[0] && (
                          <AuthorAvatar name={featured.authors[0].initials} idx={featured.authors[0].avatar_idx} size={26} />
                        )}
                        <span style={{ color: 'white', fontWeight: 500, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
                          {featured.author_names?.[0] ?? featured.author_label}
                        </span>
                      </div>
                      <span style={{ color: 'rgba(255,255,255,0.4)' }}>·</span>
                      <span style={{ marginLeft: 'auto', display: 'inline-flex', alignItems: 'center', gap: 6, color: 'white', fontWeight: 600, whiteSpace: 'nowrap' }}>O'qish <ArrowIcon size={12} /></span>
                    </div>
                  </div>
                </article>

                {/* Two side cards — vertikal (rasm tepa) + keywords + rotation */}
                <div style={{ display: 'grid', gridTemplateRows: '1fr 1fr', gap: 20, minHeight: 0 }}>
                  {sideCards.length > 0 ? sideCards.map(a => (
                    <article
                      key={a.id}
                      className="card-hover side-card-fade"
                      onClick={() => navigate(`/articles/${a.slug}`)}
                      style={{
                        background: 'var(--paper)', border: '1px solid var(--line)',
                        borderRadius: 12, overflow: 'hidden', cursor: 'pointer',
                        display: 'flex', flexDirection: 'column', minHeight: 0,
                      }}
                    >
                      {/* Rasm — qat'iy aspect ratio, kesilmaydi */}
                      <div style={{
                        width: '100%', aspectRatio: '16 / 9',
                        background: 'var(--grey-2)', position: 'relative', overflow: 'hidden',
                        flexShrink: 0,
                      }}>
                        {a.image_url ? (
                          <img src={a.image_url} alt={a.title} loading="lazy"
                            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                        ) : (
                          <ArtVariant kind={artKind(a.img_variant)} />
                        )}
                        {a.category && (
                          <span style={{
                            position: 'absolute', top: 10, left: 10,
                            background: 'rgba(255,255,255,0.95)', color: 'var(--navy)',
                            fontSize: 10, fontWeight: 700, letterSpacing: 0.15,
                            textTransform: 'uppercase', padding: '4px 8px', borderRadius: 3,
                            backdropFilter: 'blur(4px)',
                          }}>
                            {a.category.name}
                          </span>
                        )}
                      </div>

                      {/* Matn qismi */}
                      <div style={{
                        padding: '14px 16px 16px', display: 'flex', flexDirection: 'column',
                        gap: 8, flex: 1, minHeight: 0,
                      }}>
                        <h3 className="h-display" style={{
                          fontSize: 15, lineHeight: 1.3, letterSpacing: '-0.01em',
                          ...clamp(2),
                        }}>
                          {a.title}
                        </h3>

                        {/* Keywords — joy yetgancha */}
                        {a.keywords && a.keywords.length > 0 && (
                          <div style={{
                            display: 'flex', flexWrap: 'wrap', gap: 4,
                            overflow: 'hidden', maxHeight: 44,
                          }}>
                            {a.keywords.slice(0, 5).map((k, i) => (
                              <span key={i} style={{
                                fontSize: 10, color: 'var(--ink-3)',
                                background: 'var(--grey-2)',
                                padding: '2px 7px', borderRadius: 10,
                                whiteSpace: 'nowrap',
                              }}>
                                {k}
                              </span>
                            ))}
                          </div>
                        )}

                        {/* Muallif */}
                        <div style={{
                          display: 'flex', alignItems: 'center', gap: 6,
                          fontSize: 11.5, color: 'var(--ink-3)', minWidth: 0,
                          marginTop: 'auto', paddingTop: 6, borderTop: '1px solid var(--line)',
                        }}>
                          {a.authors[0] && (
                            <AuthorAvatar name={a.authors[0].initials} idx={a.authors[0].avatar_idx} size={18} />
                          )}
                          <span style={{
                            color: 'var(--ink-2)', fontWeight: 500,
                            overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis',
                            flex: 1, minWidth: 0,
                          }}>
                            {trim(a.author_names?.[0] ?? a.author_label, 22)}
                          </span>
                          <span style={{
                            display: 'inline-flex', alignItems: 'center', gap: 3, flexShrink: 0,
                            color: 'var(--ink-4)', fontSize: 11,
                          }}>
                            <ClockIcon size={10} />{a.min_read}m
                          </span>
                        </div>
                      </div>
                    </article>
                  )) : [0, 1].map(i => (
                    <div key={i} style={{ background: 'var(--grey-2)', border: '1px solid var(--line)', borderRadius: 12 }} />
                  ))}

                  {/* Rotation indikator (faqat 2 dan ko'p pool bo'lsa) */}
                  {sidePool.length > 2 && (
                    <div style={{
                      gridColumn: 1, gridRow: '1 / span 2',
                      display: 'flex', flexDirection: 'column', justifyContent: 'flex-end',
                      pointerEvents: 'none', padding: '0 0 4px',
                    }}>
                      <div style={{
                        display: 'flex', justifyContent: 'center', gap: 4,
                      }}>
                        {Array.from({ length: Math.ceil(sidePool.length / 2) }).map((_, i) => {
                          const active = Math.floor(sideIdx / 2) === i;
                          return (
                            <span key={i} style={{
                              width: active ? 14 : 5, height: 5, borderRadius: 5,
                              background: active ? 'var(--navy)' : 'var(--ink-4)',
                              opacity: active ? 1 : 0.3, transition: 'all .3s',
                            }} />
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </section>
          )}

          {/* Maqolalar grid */}
          <section>
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 18 }}>
              <h2 className="h-display" style={{ fontSize: 26 }}>
                {activeCat ? (categories.find(c => c.slug === activeCat)?.name ?? 'Maqolalar') : "So'nggi maqolalar"}
              </h2>
              <a className="link-arrow" onClick={() => navigate('/articles')}
                style={{ fontSize: 13, color: 'var(--navy)', fontWeight: 600, cursor: 'pointer' }}>
                Barchasi <ArrowIcon size={12} />
              </a>
            </div>

            {feedState.status === 'loading' && (
              <div style={{ textAlign: 'center', padding: '48px 0', color: 'var(--ink-3)', fontSize: 13 }}>Yuklanmoqda…</div>
            )}

            {feedState.status === 'error' && (
              <div style={{ textAlign: 'center', padding: '48px 0', color: 'var(--ink-3)', fontSize: 13 }}>
                Maqolalarni yuklashda xatolik. Server ishlamoqdami?
              </div>
            )}

            {feedState.status === 'ok' && (
              <>
                {/* "Barchasi" da featured 3 ta olgan — qolganlarini ko'rsatamiz */}
                {(() => {
                  const list = !activeCat ? articles.slice(3) : articles;
                  if (list.length === 0) {
                    return (
                      <div style={{ textAlign: 'center', padding: '48px 0', color: 'var(--ink-3)', fontSize: 13 }}>
                        Bu yo'nalishda hozircha maqola yo'q.
                      </div>
                    );
                  }
                  return (
                    <>
                      <div className="rsp-3">
                        {list.map(a => (
                          <article key={a.id} className="card-hover" onClick={() => navigate(`/articles/${a.slug}`)}
                            style={{ background: 'var(--paper)', border: '1px solid var(--line)', borderRadius: 12, overflow: 'hidden', display: 'flex', flexDirection: 'column', cursor: 'pointer' }}>
                            <div style={{ position: 'relative', overflow: 'hidden', background: 'var(--grey-2)', borderBottom: '1px solid var(--line)' }}>
                              <ArticleImage a={a} ratio="16 / 10" />
                              {a.category && (
                                <span style={{ position: 'absolute', top: 12, left: 12, background: 'rgba(255,255,255,0.92)', color: 'var(--navy)', fontSize: 10, fontWeight: 700, letterSpacing: 0.15, textTransform: 'uppercase', padding: '4px 8px', borderRadius: 3, backdropFilter: 'blur(4px)' }}>
                                  {a.category.name}
                                </span>
                              )}
                            </div>
                            <div style={{ padding: '18px 18px 16px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                              <h3 className="h-display" style={{ fontSize: 17, lineHeight: 1.3, marginBottom: 10, ...clamp(3), minHeight: 66 }}>
                                {a.title}
                              </h3>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 'auto', fontSize: 11.5, color: 'var(--ink-3)' }}>
                                {a.authors[0] && (
                                  <AuthorAvatar name={a.authors[0].initials} idx={a.authors[0].avatar_idx} size={20} />
                                )}
                                <span style={{ color: 'var(--ink-2)', fontWeight: 500, flex: 1, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
                                  {trim(a.author_names?.[0] ?? a.author_label, 26)}
                                </span>
                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, flexShrink: 0 }}><ClockIcon size={10} /> {a.min_read}</span>
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--line)', fontSize: 11, color: 'var(--ink-4)' }}>
                                <span>{relDate(a.published_at)}</span>
                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, color: 'var(--navy)', fontWeight: 600 }}>O'qish <ArrowIcon size={11} /></span>
                              </div>
                            </div>
                          </article>
                        ))}
                      </div>

                      {/* Load more */}
                      {articles.length < totalCount && (
                        <div style={{ display: 'flex', justifyContent: 'center', marginTop: 32 }}>
                          <LoadMoreButton
                            label={`Yana ${Math.min(PAGE_SIZE, totalCount - articles.length)} ta maqola`}
                            onClick={() => setFeedPage(p => p + 1)}
                          />
                        </div>
                      )}
                    </>
                  );
                })()}
              </>
            )}
          </section>
        </div>

        {/* ── Sidebar ── */}
        <aside className="rsp-hide" style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
          {/* Trending */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <FireIcon size={14} style={{ color: 'var(--navy)' }} />
                <span className="eyebrow" style={{ fontSize: 10.5 }}>Trendda</span>
              </div>
              <a onClick={() => navigate('/articles')} style={{ fontSize: 11.5, color: 'var(--ink-3)', cursor: 'pointer' }}>Barchasi</a>
            </div>
            {trending.length > 0 ? (
              <ol style={{ margin: 0, padding: 0, listStyle: 'none' }}>
                {trending.map((item, i) => (
                  <li key={item.id} className="row-hover"
                    onClick={() => navigate(`/articles/${item.slug}`)}
                    style={{ display: 'grid', gridTemplateColumns: '32px 1fr', gap: 14, padding: '14px 0', borderTop: '1px solid var(--line)', alignItems: 'start', cursor: 'pointer' }}>
                    <span style={{ fontFamily: 'var(--serif)', fontSize: 24, color: 'var(--navy-30)', fontWeight: 700, letterSpacing: '-0.02em', lineHeight: 1 }}>
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <div style={{ minWidth: 0 }}>
                      {item.category && (
                        <div style={{ fontSize: 10.5, color: 'var(--navy)', letterSpacing: 0.15, textTransform: 'uppercase', fontWeight: 600, marginBottom: 4 }}>{item.category.name}</div>
                      )}
                      <div style={{ fontFamily: 'var(--serif)', fontSize: 15, color: 'var(--ink)', lineHeight: 1.3, letterSpacing: '-0.01em', fontWeight: 500, ...clamp(2) }}>
                        {item.title}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--ink-4)', marginTop: 5, display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                        <EyeIcon size={11} /> {item.views.toLocaleString()} ko'rish
                      </div>
                    </div>
                  </li>
                ))}
              </ol>
            ) : (
              <div style={{ fontSize: 12.5, color: 'var(--ink-4)', padding: '12px 0' }}>Trendda hozircha bo'sh.</div>
            )}
          </div>

          {/* Yo'nalishlar bo'yicha */}
          {categories.length > 0 && (
            <div style={{ background: 'var(--grey-2)', border: '1px solid var(--line)', borderRadius: 12, padding: '20px 22px' }}>
              <span className="eyebrow">Yo'nalishlar bo'yicha</span>
              <div style={{ marginTop: 14, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {categories.map(c => {
                  const on = activeCat === c.slug;
                  return (
                    <a key={c.id} onClick={() => selectCat(c.slug)} className="pill-hover"
                      style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 10px', borderRadius: 14, background: on ? 'var(--navy)' : 'var(--paper)', border: '1px solid var(--line)', fontSize: 11.5, color: on ? 'white' : 'var(--ink-2)', fontWeight: 500, cursor: 'pointer' }}>
                      {c.name}
                      <span style={{ fontSize: 10, color: on ? 'rgba(255,255,255,0.7)' : 'var(--ink-4)', fontFamily: 'var(--mono)' }}>{c.article_count}</span>
                    </a>
                  );
                })}
              </div>
            </div>
          )}

          {/* Telegram banner */}
          <div style={{ background: 'var(--navy)', color: 'white', borderRadius: 12, padding: '22px 24px', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', right: -30, top: -30, width: 160, height: 160, borderRadius: '50%', background: 'rgba(255,255,255,0.04)' }} />
            <div style={{ position: 'absolute', right: 18, top: 18, color: '#5E7595', opacity: 0.5 }}><TelegramIcon size={28} /></div>
            <span className="eyebrow" style={{ color: 'var(--navy-30)' }}>Telegram orqali</span>
            <h4 className="h-display" style={{ fontSize: 20, lineHeight: 1.2, marginTop: 10, marginBottom: 8, color: 'white' }}>Maqolangizni botga yuboring.</h4>
            <p style={{ fontSize: 12, lineHeight: 1.55, color: 'rgba(255,255,255,0.7)', marginBottom: 16 }}>PDF yoki DOCX yuboring — qolganini AI o'zi ajratadi.</p>
            <button
              onClick={() => window.open('https://t.me/journal_kutubxona_bot', '_blank')}
              style={{
                background: 'white',
                color: 'var(--navy)',
                border: 0,
                padding: '9px 14px',
                borderRadius: 6,
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                fontFamily: 'var(--sans)'
              }}
            >
              <TelegramIcon size={13} /> @KutubxonaBot
            </button>
          </div>
        </aside>
      </div>

      <Footer />
    </div>
  );
}
