import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Topbar from '../components/layout/Topbar';
import PageLoadBar from '../components/ui/PageLoadBar';
import AuthorAvatar from '../components/ui/AuthorAvatar';
import LoadMoreButton from '../components/ui/LoadMoreButton';
import { SearchIcon, SortIcon, ChevIcon, PinIcon, ArrowIcon } from '../components/ui/Icons';
import { useFetch } from '../lib/hooks';
import type { ApiAuthor, PaginatedResponse } from '../lib/api';
import Seo from '../components/Seo';

const BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:8000';

function AuthorCard({ a }: { a: ApiAuthor }) {
  const navigate = useNavigate();
  return (
    <div className="card-hover" onClick={() => navigate(`/authors/${a.slug}`)}
      style={{
        background: 'var(--paper)', border: '1px solid var(--line)',
        borderRadius: 12, padding: '22px 22px 18px',
        cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: 14,
      }}>

      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        {a.avatar_url
          ? <img src={a.avatar_url} alt={a.name} style={{ width: 52, height: 52, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
          : <AuthorAvatar name={a.initials} idx={a.avatar_idx} size={52} />}
        <div style={{ minWidth: 0 }}>
          <div style={{ fontFamily: 'var(--serif)', fontSize: 17, fontWeight: 600, color: 'var(--ink)', letterSpacing: '-0.01em', lineHeight: 1.2 }}>{a.name}</div>
          <div style={{ fontSize: 11.5, color: 'var(--ink-3)', marginTop: 3, lineHeight: 1.4 }}>{a.role}</div>
        </div>
      </div>

      <div style={{ fontSize: 11.5, color: 'var(--ink-3)', display: 'flex', alignItems: 'center', gap: 6, paddingBottom: 14, borderBottom: '1px solid var(--line)' }}>
        <PinIcon size={11} style={{ color: 'var(--navy-50)', flexShrink: 0 }} />
        <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.org}</span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)' }}>
        {[
          [a.article_count.toLocaleString(), 'maqola'],
          [a.total_views >= 1000 ? `${(a.total_views / 1000).toFixed(1)}k` : String(a.total_views), "ko'rish"],
        ].map(([v, k], i) => (
          <div key={i} style={{ textAlign: 'center', borderRight: i < 1 ? '1px solid var(--line)' : 'none', padding: '2px 0' }}>
            <div style={{ fontFamily: 'var(--serif)', fontSize: 17, color: 'var(--ink)', fontWeight: 600, letterSpacing: '-0.01em' }}>{v}</div>
            <div style={{ fontSize: 10, color: 'var(--ink-4)', marginTop: 1, letterSpacing: 0.15, textTransform: 'uppercase', fontWeight: 600 }}>{k}</div>
          </div>
        ))}
      </div>

      <button className="btn ghost" style={{ height: 32, fontSize: 12, justifyContent: 'center', marginTop: 'auto' }}>
        Profilni ochish <ArrowIcon size={12} />
      </button>
    </div>
  );
}

export default function AuthorsPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [debouncedQ, setDebouncedQ] = useState('');
  const [page, setPage]     = useState(1);

  useEffect(() => {
    const t = setTimeout(() => { setDebouncedQ(search); setPage(1); }, 350);
    return () => clearTimeout(t);
  }, [search]);

  const url = useMemo(() => {
    const p = new URLSearchParams();
    if (debouncedQ.trim()) p.set('search', debouncedQ.trim());
    p.set('page', String(page));
    return `${BASE}/api/authors/?${p.toString()}`;
  }, [debouncedQ, page]);

  const state = useFetch<PaginatedResponse<ApiAuthor>>(url);
  const authors    = state.status === 'ok' ? state.data.results : [];
  const totalCount = state.status === 'ok' ? state.data.count   : 0;
  const hasMore    = state.status === 'ok' ? !!state.data.next  : false;

  return (
    <div className="bg-authors" style={{ minHeight: '100vh' }}>
      <Seo title="Mualliflar" description="Kutubxona Archive mualliflari — ilmiy maqolalar e'lon qilgan tadqiqotchilar." />
      <PageLoadBar />
      <Topbar active="authors" />

      <div style={{ padding: '48px var(--px) 32px', maxWidth: 1400, margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14, fontSize: 12.5, color: 'var(--ink-3)' }}>
          <a onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>Bosh sahifa</a>
          <span style={{ color: 'var(--ink-4)' }}>/</span>
          <span style={{ color: 'var(--ink-2)', fontWeight: 500 }}>Mualliflar</span>
        </div>

        <h1 className="h-display h1-rsp" style={{ fontSize: 52, marginBottom: 14 }}>Platforma mualliflari</h1>
        <p style={{ fontSize: 15, color: 'var(--ink-3)', maxWidth: 680, lineHeight: 1.6, marginBottom: 28 }}>
          Kutubxona Archive da nashr qilinayotgan
          {totalCount > 0 ? ` ${totalCount.toLocaleString()} ta` : ''} muallif — kutubxonachilar,
          arxivchilar, sharqshunoslar, tarixchilar va doktorantlar.
        </p>

        <div style={{ display: 'flex', gap: 10, alignItems: 'center', maxWidth: 780, flexWrap: 'wrap' }}>
          <div className="searchbar" style={{ flex: 1, height: 48, minWidth: 'auto' }}>
            <SearchIcon size={18} style={{ color: 'var(--ink-4)', flexShrink: 0 }} />
            <input
              value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Ism, ish joyi yoki yo'nalish bo'yicha qidirish…"
              style={{ fontSize: 14 }}
            />
            {search && (
              <button onClick={() => setSearch('')} style={{ background: 'none', border: 0, cursor: 'pointer', color: 'var(--ink-3)', padding: '0 4px', fontSize: 16, lineHeight: 1 }}>×</button>
            )}
          </div>
          <div className="field" style={{ height: 48, minWidth: 180 }}>
            <SortIcon size={14} />
            <span style={{ fontSize: 13, color: 'var(--ink-3)' }}>Saralash:</span>
            <span style={{ color: 'var(--ink)', fontWeight: 600, marginLeft: 'auto' }}>Ism bo'yicha</span>
            <ChevIcon />
          </div>
        </div>
      </div>

      {/* Cards */}
      {state.status === 'loading' && (
        <div style={{ padding: '64px var(--px)', textAlign: 'center', color: 'var(--ink-3)', fontSize: 13 }}>Yuklanmoqda…</div>
      )}
      {state.status === 'error' && (
        <div style={{ padding: '64px var(--px)', textAlign: 'center', color: 'var(--ink-3)', fontSize: 13 }}>Mualliflarni yuklashda xatolik.</div>
      )}
      {state.status === 'ok' && (
        <>
          <div className="rsp-4" style={{ padding: '8px var(--px) 32px', maxWidth: 1400, margin: '0 auto' }}>
            {authors.length > 0
              ? authors.map(a => <AuthorCard key={a.id} a={a} />)
              : (
                <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '64px 0', color: 'var(--ink-3)', fontSize: 14 }}>
                  Mualliflar topilmadi.
                </div>
              )
            }
          </div>
          {hasMore && (
            <div style={{ padding: '0 var(--px) 64px', maxWidth: 1400, margin: '0 auto', textAlign: 'center' }}>
              <LoadMoreButton label="Yana mualliflar yuklash" onClick={() => setPage(p => p + 1)} />
            </div>
          )}
        </>
      )}
    </div>
  );
}
