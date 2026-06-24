import { useState, useMemo, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Topbar from '../components/layout/Topbar';
import PageLoadBar from '../components/ui/PageLoadBar';
import AuthorAvatar from '../components/ui/AuthorAvatar';
import Pagination from '../components/ui/Pagination';
import {
  CheckIcon, DocIcon, ArrowIcon,
  ChevIcon, SortIcon, SearchIcon,
} from '../components/ui/Icons';
import { useFetch } from '../lib/hooks';
import type { ApiArticle, ApiCategory, PaginatedResponse } from '../lib/api';
import Seo from '../components/Seo';

// ── Sort variantlari ──────────────────────────────────────────────────────────
type SortKey = 'new' | 'popular' | 'views';
const SORT_OPTS: Record<SortKey, { label: string; param: string }> = {
  new:     { label: 'Eng yangi',      param: '-issue__year,-issue__number,-published_at' },
  popular: { label: 'Mashhur',        param: '-cites' },
  views:   { label: "Ko'p o'qilgan",  param: '-views' },
};

const BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:8000';
const PAGE_SIZE = 20;

// ── Statik yil / chorak ro'yxatlari ──────────────────────────────────────────
const YIL_ITEMS: [string, number][] = [
  ['2026', 0], ['2025', 0], ['2024', 0], ['2023', 0],
];

// quarter display label → API value mapping
const QUARTER_LABEL_MAP: Record<string, string> = {
  '1-chorak': '1', '2-chorak': '2', '3-chorak': '3', '4-chorak': '4',
};

// ── Rasm ──────────────────────────────────────────────────────────────────────
function ArticleThumb({ variant = 0 }: { variant?: number }) {
  const v = variant % 4;
  if (v === 0) return (
    <svg viewBox="0 0 180 140" width="100%" height="100%" preserveAspectRatio="xMidYMid slice">
      <rect width="180" height="140" fill="#0A192F"/>
      <rect x="56" y="18" width="68" height="104" fill="#F5F7FA"/>
      <g fill="#0A192F" opacity="0.85">{Array.from({length:13}).map((_,i)=><rect key={i} x="64" y={24+i*7} width={52-i*2} height="2"/>)}</g>
    </svg>
  );
  if (v === 1) return (
    <svg viewBox="0 0 180 140" width="100%" height="100%" preserveAspectRatio="xMidYMid slice">
      <rect width="180" height="140" fill="#F5F7FA"/>
      <g stroke="#0A192F" strokeWidth="0.7" fill="none" opacity="0.45">{Array.from({length:16}).map((_,i)=><line key={i} x1="22" x2="158" y1={16+i*7} y2={16+i*7}/>)}</g>
      <rect x="64" y="48" width="52" height="44" fill="#0A192F"/>
    </svg>
  );
  if (v === 2) return (
    <svg viewBox="0 0 180 140" width="100%" height="100%">
      <rect width="180" height="140" fill="#F5F7FA"/>
      <g fill="none" stroke="#0A192F" strokeWidth="1"><rect x="20" y="20" width="140" height="100"/><line x1="20" y1="40" x2="160" y2="40"/><line x1="60" y1="20" x2="60" y2="120"/><line x1="110" y1="20" x2="110" y2="120"/></g>
      <rect x="22" y="42" width="36" height="76" fill="#0A192F" opacity="0.1"/>
      <rect x="112" y="42" width="46" height="40" fill="#0A192F" opacity="0.85"/>
    </svg>
  );
  return (
    <svg viewBox="0 0 180 140" width="100%" height="100%">
      <rect width="180" height="140" fill="#102441"/>
      <g fill="#F5F7FA"><rect x="20" y="40" width="20" height="80"/><rect x="44" y="32" width="22" height="88"/><rect x="70" y="44" width="20" height="76"/><rect x="94" y="28" width="22" height="92"/><rect x="120" y="48" width="20" height="72"/><rect x="144" y="36" width="18" height="84"/></g>
      <line x1="14" y1="120" x2="166" y2="120" stroke="#5E7595" strokeWidth="2"/>
    </svg>
  );
}

// ── Article card ──────────────────────────────────────────────────────────────
function ArticleCard({ a }: { a: ApiArticle }) {
  const navigate = useNavigate();
  return (
    <article className="card-hover rsp-card" onClick={() => navigate(`/articles/${a.slug}`)}
      style={{ padding: '22px 24px', background: 'var(--paper)', border: '1px solid var(--line)', borderRadius: 12, cursor: 'pointer' }}>
      <div className="rsp-thumb" style={{ width: 180, height: 140, borderRadius: 8, background: 'var(--grey-2)', overflow: 'hidden', border: '1px solid var(--line)', flexShrink: 0 }}>
        {a.image_url ? (
          <img src={a.image_url} alt={a.title} loading="lazy"
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
        ) : (
          <ArticleThumb variant={a.img_variant} />
        )}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minWidth: 0 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
            <span className="tag navy-soft">{a.category?.name ?? '—'}</span>
            <span style={{ fontSize: 11, color: 'var(--ink-4)', fontFamily: 'var(--mono)', marginLeft: 'auto' }}>
              {a.year} · {a.quarter}-chorak
            </span>
          </div>
          <h3 className="h-display" style={{ fontSize: 21, lineHeight: 1.25, marginBottom: 8, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{a.title}</h3>
          <p style={{ fontSize: 13, lineHeight: 1.55, color: 'var(--ink-3)', maxWidth: 620, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{a.excerpt}</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 14 }}>
          {a.authors[0] && <AuthorAvatar name={a.authors[0].initials} idx={a.authors[0].avatar_idx} size={22} />}
          <span style={{ fontSize: 12.5, color: 'var(--ink-2)', fontWeight: 500, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
            {a.author_names?.[0] ?? a.author_label}
          </span>
        </div>
      </div>
      <div className="rsp-hide" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', borderLeft: '1px solid var(--line)', paddingLeft: 24, minWidth: 120 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 12, color: 'var(--ink-3)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}><DocIcon size={11} /> Yil</span>
            <span style={{ color: 'var(--ink)', fontWeight: 600 }}>{a.year}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>👁 Ko'rish</span>
            <span style={{ color: 'var(--ink)', fontWeight: 600 }}>{a.views.toLocaleString()}</span>
          </div>
        </div>
        <button className="btn ghost" style={{ height: 32, fontSize: 12, padding: '0 12px', justifyContent: 'center', marginTop: 10 }}>
          O'qish <ArrowIcon size={12} />
        </button>
      </div>
    </article>
  );
}

// ── Filter group ──────────────────────────────────────────────────────────────
function FilterGroup({ title, items, selected, onToggle, last = false }: {
  title: string;
  items: [string, number | string, string?][];   // [label, count, value?]
  selected: string[];
  onToggle: (val: string) => void;
  last?: boolean;
}) {
  return (
    <div style={{ paddingBottom: last ? 0 : 20, marginBottom: last ? 0 : 20, borderBottom: last ? 'none' : '1px solid var(--line)' }}>
      <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink-2)', marginBottom: 12, letterSpacing: 0.1 }}>{title}</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
        {items.map(([name, count, value]) => {
          const val = value ?? name;
          const on  = selected.includes(val);
          return (
            <label key={val} className="filter-row" onClick={() => onToggle(val)}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', padding: '2px 4px' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                <span style={{ width: 14, height: 14, borderRadius: 3, border: on ? '1px solid var(--navy)' : '1px solid var(--line-2)', background: on ? 'var(--navy)' : 'var(--paper)', display: 'grid', placeItems: 'center', color: 'white', flexShrink: 0 }}>
                  {on && <CheckIcon size={10} />}
                </span>
                <span style={{ fontSize: 12.5, color: on ? 'var(--ink)' : 'var(--ink-2)', fontWeight: on ? 500 : 400 }}>{name}</span>
              </span>
              {typeof count === 'number' && count > 0 && (
                <span style={{ fontSize: 11, color: 'var(--ink-4)', fontFamily: 'var(--mono)' }}>{count.toLocaleString()}</span>
              )}
            </label>
          );
        })}
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function ArticlesPage() {
  const [urlParams] = useSearchParams();
  const initialSearch = urlParams.get('search') ?? '';

  const [selCats,     setSelCats]     = useState<string[]>([]);
  const [selYears,    setSelYears]    = useState<string[]>([]);
  const [selQuarters, setSelQuarters] = useState<string[]>([]);
  const [search,      setSearch]      = useState(initialSearch);
  const [debouncedQ,  setDebouncedQ]  = useState(initialSearch);
  const [page,        setPage]        = useState(1);
  const [sort,        setSort]        = useState<SortKey>('new');
  const [sortOpen,    setSortOpen]    = useState(false);
  const sortRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onOutside(e: MouseEvent) {
      if (sortRef.current && !sortRef.current.contains(e.target as Node)) setSortOpen(false);
    }
    document.addEventListener('mousedown', onOutside);
    return () => document.removeEventListener('mousedown', onOutside);
  }, []);

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => { setDebouncedQ(search); setPage(1); }, 400);
    return () => clearTimeout(t);
  }, [search]);

  // Reset page when filters change
  const resetPage = () => setPage(1);

  const toggle = (setter: React.Dispatch<React.SetStateAction<string[]>>) =>
    (val: string) => {
      setter(prev => prev.includes(val) ? prev.filter(x => x !== val) : [...prev, val]);
      resetPage();
    };

  function clearAll() {
    setSelCats([]); setSelYears([]); setSelQuarters([]);
    setSearch(''); setDebouncedQ(''); setPage(1);
  }

  // ── Build API URL ───────────────────────────────────────────────────────────
  const articlesUrl = useMemo(() => {
    const p = new URLSearchParams();
    if (selCats.length)     p.set('categories', selCats.join(','));
    if (selYears.length)    p.set('years',      selYears.join(','));
    if (selQuarters.length) p.set('quarters',   selQuarters.map(q => QUARTER_LABEL_MAP[q] ?? q).join(','));
    if (debouncedQ.trim())  p.set('search',     debouncedQ.trim());
    p.set('ordering', SORT_OPTS[sort].param);
    p.set('page', String(page));
    return `${BASE}/api/articles/?${p.toString()}`;
  }, [selCats, selYears, selQuarters, debouncedQ, page, sort]);

  // Sort yoki filter o'zgarsa page reset
  useEffect(() => { setPage(1); }, [sort]);

  const articlesState = useFetch<PaginatedResponse<ApiArticle>>(articlesUrl);
  const catState      = useFetch<ApiCategory[]>(`${BASE}/api/categories/`);

  const articles   = articlesState.status === 'ok' ? articlesState.data.results : [];
  const totalCount = articlesState.status === 'ok' ? articlesState.data.count    : 0;
  const categories = catState.status      === 'ok' ? catState.data              : [];

  // Chip list for active filters
  const chips: { label: string; remove: () => void }[] = [
    ...selCats.map(slug => {
      const cat = categories.find(c => c.slug === slug);
      return { label: cat?.name ?? slug, remove: () => toggle(setSelCats)(slug) };
    }),
    ...selYears.map(y    => ({ label: y,  remove: () => toggle(setSelYears)(y)    })),
    ...selQuarters.map(q => ({ label: q,  remove: () => toggle(setSelQuarters)(q) })),
  ];

  // Category filter items
  const catItems: [string, number | string, string][] = categories.map(c => [c.name, c.article_count, c.slug]);

  return (
    <div className="bg-articles" style={{ minHeight: '100vh' }}>
      <Seo title="Maqolalar" description="Barcha ilmiy maqolalar — yo'nalish, yil, chorak bo'yicha filtrlash va qidirish." />
      <PageLoadBar />
      <Topbar active="articles" />

      <div style={{ padding: '40px var(--px) 28px', maxWidth: 1400, margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14, fontSize: 12.5, color: 'var(--ink-3)' }}>
          <a style={{ color: 'var(--ink-3)', cursor: 'pointer' }}>Bosh sahifa</a>
          <span style={{ color: 'var(--ink-4)' }}>/</span>
          <span style={{ color: 'var(--ink-2)', fontWeight: 500 }}>Maqolalar</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'end', justifyContent: 'space-between' }}>
          <div>
            <h1 className="h-display h1-rsp" style={{ fontSize: 44, marginBottom: 8 }}>Barcha maqolalar</h1>
            <p style={{ fontSize: 14, color: 'var(--ink-3)' }}>
              {articlesState.status === 'ok' ? `${totalCount.toLocaleString()} ta maqola` : '…'}
            </p>
          </div>
          <div className="art-ctrl-hide" style={{ display: 'flex', gap: 8 }}>
            <div ref={sortRef} style={{ position: 'relative', minWidth: 200 }}>
              <button onClick={() => setSortOpen(p => !p)} className="field"
                style={{ width: '100%', cursor: 'pointer', border: '1px solid var(--line)', background: 'var(--paper)' }}>
                <SortIcon size={12} /><span>Saralash:</span>
                <span style={{ color: 'var(--ink)', fontWeight: 600, marginLeft: 'auto' }}>
                  {SORT_OPTS[sort].label}
                </span>
                <ChevIcon style={{ transform: sortOpen ? 'rotate(180deg)' : undefined, transition: 'transform .15s' }} />
              </button>
              {sortOpen && (
                <div style={{ position: 'absolute', top: '100%', right: 0, left: 0, marginTop: 4, background: 'var(--paper)', border: '1px solid var(--line)', borderRadius: 8, padding: 4, boxShadow: '0 8px 32px -8px rgba(10,25,47,0.18)', zIndex: 50 }}>
                  {(Object.keys(SORT_OPTS) as SortKey[]).map(key => {
                    const on = sort === key;
                    return (
                      <button key={key} onClick={() => { setSort(key); setSortOpen(false); }}
                        style={{
                          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                          width: '100%', padding: '8px 12px', borderRadius: 6, border: 0,
                          background: on ? 'rgba(10,25,47,0.05)' : 'transparent',
                          fontSize: 13, color: on ? 'var(--navy)' : 'var(--ink-2)',
                          fontWeight: on ? 600 : 400, cursor: 'pointer', fontFamily: 'var(--sans)',
                          textAlign: 'left',
                        }}>
                        {SORT_OPTS[key].label}
                        {on && <CheckIcon size={11} />}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="rsp-filter" style={{ padding: '0 var(--px) 64px', maxWidth: 1400, margin: '0 auto' }}>
        {/* Filter panel */}
        <aside className="rsp-hide" style={{ background: 'var(--grey-2)', border: '1px solid var(--line)', borderRadius: 12, padding: '24px 22px', position: 'sticky', top: 92, alignSelf: 'flex-start' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
            <span className="eyebrow">Filtrlar</span>
            <a onClick={clearAll} style={{ fontSize: 11, color: 'var(--ink-3)', cursor: 'pointer' }}>Tozalash</a>
          </div>
          {catItems.length === 0 && catState.status === 'loading' && (
            <div style={{ marginBottom: 20, paddingBottom: 20, borderBottom: '1px solid var(--line)', fontSize: 12.5, color: 'var(--ink-4)' }}>
              Yo'nalishlar yuklanmoqda…
            </div>
          )}
          {catItems.length > 0 && (
            <FilterGroup
              title="Yo'nalish"
              items={catItems}
              selected={selCats}
              onToggle={toggle(setSelCats)}
            />
          )}
          <FilterGroup
            title="Yil"
            items={YIL_ITEMS.map(([y]) => [y, 0, y])}
            selected={selYears}
            onToggle={toggle(setSelYears)}
          />
          <FilterGroup
            title="Chorak"
            items={[['1-chorak', 0, '1-chorak'], ['2-chorak', 0, '2-chorak'], ['3-chorak', 0, '3-chorak'], ['4-chorak', 0, '4-chorak']]}
            selected={selQuarters}
            onToggle={toggle(setSelQuarters)}
            last
          />
        </aside>

        {/* Articles list */}
        <div>
          {/* Search bar */}
          <div className="searchbar" style={{ marginBottom: 16, height: 44 }}>
            <SearchIcon size={16} style={{ color: 'var(--ink-4)', flexShrink: 0 }} />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Sarlavha yoki muallif bo'yicha qidirish…"
              style={{ fontSize: 14 }}
            />
            {search && (
              <button onClick={() => setSearch('')} style={{ background: 'none', border: 0, cursor: 'pointer', color: 'var(--ink-3)', padding: '0 4px', fontSize: 16, lineHeight: 1 }}>×</button>
            )}
          </div>

          {/* Active chips + count */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18, flexWrap: 'wrap', gap: 8 }}>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {chips.map(c => (
                <span key={c.label} className="tag navy-soft" style={{ cursor: 'default', display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                  {c.label}
                  <span onClick={c.remove} style={{ cursor: 'pointer', opacity: 0.7, fontSize: 13, lineHeight: 1, marginLeft: 2 }}>×</span>
                </span>
              ))}
              {chips.length > 0 && (
                <button onClick={clearAll} style={{ fontSize: 11, color: 'var(--ink-3)', background: 'none', border: 0, cursor: 'pointer', fontFamily: 'var(--sans)', padding: '0 4px' }}>
                  Hammasini tozalash
                </button>
              )}
            </div>
            <span style={{ fontSize: 12, color: 'var(--ink-3)', flexShrink: 0 }}>
              {articlesState.status === 'ok' ? `${totalCount.toLocaleString()} natija` : '…'}
            </span>
          </div>

          {/* Loading / error / list */}
          {articlesState.status === 'loading' && (
            <div style={{ textAlign: 'center', padding: '64px 0', color: 'var(--ink-3)', fontSize: 13 }}>Yuklanmoqda…</div>
          )}
          {articlesState.status === 'error' && (
            <div style={{ textAlign: 'center', padding: '64px 0', color: 'var(--ink-3)', fontSize: 13 }}>
              Xatolik yuz berdi.
            </div>
          )}
          {articlesState.status === 'ok' && (
            <>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {articles.length > 0
                  ? articles.map(a => <ArticleCard key={a.id} a={a} />)
                  : (
                    <div style={{ textAlign: 'center', padding: '64px 0', color: 'var(--ink-3)', fontSize: 14 }}>
                      Hech qanday natija topilmadi. Filtrlarni o'zgartiring yoki qidiruvni tozalang.
                    </div>
                  )
                }
              </div>
              {totalCount > PAGE_SIZE && (
                <Pagination
                  total={totalCount}
                  perPage={PAGE_SIZE}
                  current={page}
                  onPageChange={p => { setPage(p); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                />
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
