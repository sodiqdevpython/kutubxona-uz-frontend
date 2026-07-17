import { useState, useMemo, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Topbar from '../components/layout/Topbar';
import PageLoadBar from '../components/ui/PageLoadBar';
import Pagination from '../components/ui/Pagination';
import { SearchIcon, ArrowIcon, EyeIcon } from '../components/ui/Icons';
import { useFetch } from '../lib/hooks';
import type { ApiCentralAsiaPost, PaginatedResponse } from '../lib/api';
import Seo from '../components/Seo';

const BASE      = import.meta.env.VITE_API_URL ?? 'http://localhost:8000';
const PAGE_SIZE = 15;

// ── Card (unified Inter typography) ───────────────────────────────────────────

function PostCard({ p, index }: { p: ApiCentralAsiaPost; index: number }) {
  const navigate = useNavigate();
  const authorFirst = (p.author_line || '').split(',')[0].trim();

  return (
    <article
      className="card-hover ca-card"
      onClick={() => navigate(`/central-asia/${p.slug}`)}
      style={{
        display: 'grid',
        gridTemplateColumns: 'auto 1fr auto',
        gap: 20,
        padding: '22px 24px',
        background: 'var(--paper)',
        border: '1px solid var(--line)',
        borderRadius: 14,
        cursor: 'pointer',
        fontFamily: 'var(--sans)',
      }}
    >
      {/* Index badge */}
      <div style={{
        width: 44, height: 44, borderRadius: 10,
        background: 'var(--navy-08)', color: 'var(--navy)',
        display: 'grid', placeItems: 'center',
        fontSize: 13, fontWeight: 700, fontFamily: 'var(--mono)',
        flexShrink: 0, letterSpacing: '-0.02em',
      }}>
        {String(index).padStart(2, '0')}
      </div>

      {/* Content */}
      <div style={{ minWidth: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <span className="tag navy-soft">{p.source_category || 'Central Asia'}</span>
          {p.doi && (
            <span style={{
              fontSize: 11, color: 'var(--ink-4)', fontFamily: 'var(--mono)',
              letterSpacing: '-0.01em',
            }}>DOI · {p.doi}</span>
          )}
        </div>

        <h3 style={{
          fontFamily: 'var(--sans)',
          fontSize: 17, lineHeight: 1.35,
          fontWeight: 600, letterSpacing: '-0.01em',
          color: 'var(--ink)', margin: 0,
          display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
        }}>{p.title}</h3>

        {authorFirst && (
          <p style={{
            fontFamily: 'var(--sans)',
            fontSize: 13, lineHeight: 1.5, color: 'var(--ink-3)', margin: 0,
            display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical', overflow: 'hidden',
          }}>{authorFirst}</p>
        )}
      </div>

      {/* Meta strip */}
      <div className="ca-card-meta" style={{
        display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
        alignItems: 'flex-end', gap: 10, minWidth: 96,
        borderLeft: '1px solid var(--line)', paddingLeft: 20,
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'flex-end', fontFamily: 'var(--sans)' }}>
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 5,
            fontSize: 12, color: 'var(--ink-2)', fontWeight: 600, fontVariantNumeric: 'tabular-nums',
          }}>
            <EyeIcon size={12} style={{ color: 'var(--ink-4)' }} /> {p.total_views.toLocaleString()}
          </span>
          <span style={{
            fontSize: 11, color: 'var(--ink-4)', fontFamily: 'var(--mono)',
          }}>❝ {p.quote_number}</span>
        </div>
        <span style={{
          display: 'inline-flex', alignItems: 'center', gap: 4,
          fontSize: 12, fontWeight: 600, color: 'var(--navy)',
        }}>
          O'qish <ArrowIcon size={11} />
        </span>
      </div>
    </article>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function CentralAsiaPage() {
  const [urlParams]      = useSearchParams();
  const initialSearch    = urlParams.get('search') ?? '';
  const [search, setSearch]         = useState(initialSearch);
  const [debouncedQ, setDebouncedQ] = useState(initialSearch);
  const [page, setPage]             = useState(1);

  useEffect(() => {
    const t = setTimeout(() => { setDebouncedQ(search); setPage(1); }, 400);
    return () => clearTimeout(t);
  }, [search]);

  const url = useMemo(() => {
    const p = new URLSearchParams();
    if (debouncedQ.trim()) p.set('search', debouncedQ.trim());
    p.set('page', String(page));
    p.set('page_size', String(PAGE_SIZE));
    return `${BASE}/api/central-asia/?${p.toString()}`;
  }, [debouncedQ, page]);

  const state = useFetch<PaginatedResponse<ApiCentralAsiaPost>>(url);
  const posts = state.status === 'ok' ? state.data.results : [];
  const total = state.status === 'ok' ? state.data.count   : 0;
  const startIdx = (page - 1) * PAGE_SIZE;

  return (
    <div className="bg-articles" style={{ minHeight: '100vh', fontFamily: 'var(--sans)' }}>
      <Seo
        title="Central Asia"
        description="einfolib.uz'dan yig'ilgan Central Asia bo'limi maqolalari."
      />
      <PageLoadBar />
      <Topbar active="central-asia" />

      <div style={{ padding: '48px var(--px) 32px', maxWidth: 1200, margin: '0 auto' }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14,
          fontSize: 12.5, color: 'var(--ink-3)', fontFamily: 'var(--sans)',
        }}>
          <a href="/" style={{ color: 'var(--ink-3)' }}>Bosh sahifa</a>
          <span style={{ color: 'var(--ink-4)' }}>/</span>
          <span style={{ color: 'var(--ink-2)', fontWeight: 500 }}>Central Asia</span>
        </div>

        {/* Hero */}
        <div style={{
          display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between',
          gap: 24, flexWrap: 'wrap', marginBottom: 28,
        }}>
          <div style={{ maxWidth: 720 }}>
            <span className="eyebrow" style={{ display: 'block', marginBottom: 10 }}>
              einfolib.uz · manba
            </span>
            <h1 style={{
              fontFamily: 'var(--sans)',
              fontSize: 42, lineHeight: 1.1,
              fontWeight: 700, letterSpacing: '-0.03em',
              color: 'var(--ink)', margin: '0 0 12px',
            }}>Central Asia</h1>
            <p style={{
              fontFamily: 'var(--sans)',
              fontSize: 15, lineHeight: 1.6, color: 'var(--ink-3)', margin: 0,
              maxWidth: 640,
            }}>
              «Central Asia» axborot-kutubxona ilmiy jurnalining barcha maqolalari.
              Yangi son chiqishi bilan avtomatik yangilanadi.
            </p>
          </div>

          {state.status === 'ok' && (
            <div style={{
              display: 'flex', gap: 24, padding: '14px 22px',
              background: 'var(--paper)', border: '1px solid var(--line)',
              borderRadius: 12, fontFamily: 'var(--sans)',
            }}>
              <div>
                <div style={{ fontSize: 11, color: 'var(--ink-4)', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Maqola</div>
                <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--ink)', letterSpacing: '-0.02em' }}>{total.toLocaleString()}</div>
              </div>
              <div style={{ width: 1, background: 'var(--line)' }} />
              <div>
                <div style={{ fontSize: 11, color: 'var(--ink-4)', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Sahifa</div>
                <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--ink)', letterSpacing: '-0.02em' }}>
                  {page} / {Math.max(1, Math.ceil(total / PAGE_SIZE))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Search */}
        <div className="searchbar" style={{
          marginBottom: 24, height: 48, borderRadius: 10,
          background: 'var(--paper)', border: '1px solid var(--line)',
        }}>
          <SearchIcon size={16} style={{ color: 'var(--ink-4)', flexShrink: 0 }} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Sarlavha, muallif yoki matn bo'yicha qidirish…"
            style={{ fontSize: 14, fontFamily: 'var(--sans)' }}
          />
          {search && (
            <button onClick={() => setSearch('')}
              style={{ background: 'none', border: 0, cursor: 'pointer', color: 'var(--ink-3)', padding: '0 4px', fontSize: 16, lineHeight: 1 }}>
              ×
            </button>
          )}
        </div>

        {state.status === 'loading' && (
          <div style={{ textAlign: 'center', padding: '96px 0', color: 'var(--ink-3)', fontSize: 13 }}>Yuklanmoqda…</div>
        )}
        {state.status === 'error' && (
          <div style={{ textAlign: 'center', padding: '96px 0', color: 'var(--ink-3)', fontSize: 13 }}>
            Xatolik yuz berdi. Backend ishga tushirilganini tekshiring.
          </div>
        )}
        {state.status === 'ok' && (
          <>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {posts.length > 0
                ? posts.map((p, i) => <PostCard key={p.id} p={p} index={startIdx + i + 1} />)
                : (
                  <div style={{ textAlign: 'center', padding: '96px 0', color: 'var(--ink-3)', fontSize: 14 }}>
                    Hech qanday maqola topilmadi. Qidiruvni o'zgartiring yoki admin panelidan «einfolib.uz — yangilash»ni bosing.
                  </div>
                )
              }
            </div>
            {total > PAGE_SIZE && (
              <Pagination
                total={total}
                perPage={PAGE_SIZE}
                current={page}
                onPageChange={p => { setPage(p); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
              />
            )}
          </>
        )}
      </div>

      <style>{`
        @media (max-width: 720px) {
          .ca-card { grid-template-columns: 1fr !important; }
          .ca-card-meta { border-left: 0 !important; padding-left: 0 !important;
            flex-direction: row !important; align-items: center !important; justify-content: space-between !important;
            border-top: 1px solid var(--line); padding-top: 10px !important; }
        }
      `}</style>
    </div>
  );
}
