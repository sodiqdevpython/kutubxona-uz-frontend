import { useNavigate, useParams } from 'react-router-dom';
import Topbar from '../components/layout/Topbar';
import PageLoadBar from '../components/ui/PageLoadBar';
import AuthorAvatar from '../components/ui/AuthorAvatar';
import LoadMoreButton from '../components/ui/LoadMoreButton';
import { CheckIcon, LockIcon, EyeIcon, ClockIcon, ArrowIcon } from '../components/ui/Icons';
import { useFetch } from '../lib/hooks';
import type { ApiAuthor, ApiArticle, PaginatedResponse } from '../lib/api';
import Seo from '../components/Seo';

const BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:8000';

function StatusTag({ status }: { status: string }) {
  return status === 'open'
    ? <span className="tag ok" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><CheckIcon size={10} /> Ochiq</span>
    : <span className="tag line" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><LockIcon size={10} /> Obunachi</span>;
}

function formatDate(iso: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleDateString('uz-UZ', { year: 'numeric', month: 'long' });
}

export default function AuthorDetailPage() {
  const navigate          = useNavigate();
  const { slug }          = useParams<{ slug: string }>();

  const authorState   = useFetch<ApiAuthor>(slug ? `${BASE}/api/authors/${slug}/` : null);
  const articlesState = useFetch<PaginatedResponse<ApiArticle>>(slug ? `${BASE}/api/articles/?author=${slug}&ordering=-published_at` : null);

  const a        = authorState.status   === 'ok' ? authorState.data            : null;
  const articles = articlesState.status === 'ok' ? articlesState.data.results  : [];
  const total    = articlesState.status === 'ok' ? articlesState.data.count     : 0;
  const hasMore  = articlesState.status === 'ok' ? !!articlesState.data.next    : false;

  // ── 404 / error ─────────────────────────────────────────────────────────────
  if (authorState.status === 'error') {
    return (
      <div className="bg-author" style={{ minHeight: '100vh' }}>
        <PageLoadBar />
        <Topbar active="authors" />
        <div style={{ padding: '80px var(--px)', textAlign: 'center', color: 'var(--ink-3)' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>404</div>
          <p style={{ fontSize: 16, marginBottom: 24 }}>Muallif topilmadi.</p>
          <button className="btn ghost" onClick={() => navigate('/authors')}>← Mualliflar ro'yxatiga qaytish</button>
        </div>
      </div>
    );
  }

  // ── Loading skeleton ─────────────────────────────────────────────────────────
  const loading = authorState.status === 'loading' || authorState.status === 'idle';

  return (
    <div className="bg-author" style={{ minHeight: '100vh' }}>
      <Seo
        title={a ? `${a.name}${a.degree ? ` — ${a.degree}` : ''}` : 'Muallif'}
        description={a?.bio || (a ? `${a.name}${a.org ? `, ${a.org}` : ''}. ${a.article_count} ta maqola muallifi.` : '')}
      />
      <PageLoadBar />
      <Topbar active="authors" />

      {/* Profile header */}
      <div style={{ background: 'var(--grey-2)', borderBottom: '1px solid var(--line)' }}>
        <div style={{ padding: '40px var(--px) 48px', maxWidth: 1400, margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24, fontSize: 12.5, color: 'var(--ink-3)' }}>
            <a onClick={() => navigate('/')} style={{ color: 'var(--ink-3)', cursor: 'pointer' }}>Bosh sahifa</a>
            <span style={{ color: 'var(--ink-4)' }}>/</span>
            <a onClick={() => navigate('/authors')} style={{ color: 'var(--ink-3)', cursor: 'pointer' }}>Mualliflar</a>
            <span style={{ color: 'var(--ink-4)' }}>/</span>
            <span style={{ color: 'var(--ink-2)', fontWeight: 500 }}>{a?.name ?? '…'}</span>
          </div>

          {loading ? (
            <div style={{ display: 'flex', gap: 32, alignItems: 'center' }}>
              <div style={{ width: 140, height: 140, borderRadius: '50%', background: 'var(--grey-3)' }} />
              <div style={{ flex: 1 }}>
                <div style={{ height: 16, width: 120, background: 'var(--grey-3)', borderRadius: 4, marginBottom: 12 }} />
                <div style={{ height: 48, width: 380, background: 'var(--grey-3)', borderRadius: 4, marginBottom: 14 }} />
                <div style={{ height: 14, width: '60%', background: 'var(--grey-3)', borderRadius: 4 }} />
              </div>
            </div>
          ) : a && (
            <div className="rsp-author-profile">
              <div>
                <AuthorAvatar name={a.initials} idx={a.avatar_idx} size={140} />
              </div>
              <div>
                {a.degree && <span className="eyebrow" style={{ fontSize: 10.5 }}>{a.degree}</span>}
                <h1 className="h-display h1-rsp" style={{ fontSize: 52, lineHeight: 1.05, letterSpacing: '-0.025em', marginTop: 8, marginBottom: 14 }}>{a.name}</h1>
                {a.org && (
                  <p style={{ fontSize: 13, color: 'var(--ink-3)', marginBottom: 10 }}>{a.org}</p>
                )}
                {a.bio && (
                  <p style={{ fontSize: 15, lineHeight: 1.65, color: 'var(--ink-2)', maxWidth: 720 }}>{a.bio}</p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Stats */}
      {a && (
        <div style={{ padding: '40px var(--px) 0', maxWidth: 1400, margin: '0 auto' }}>
          <div className="rsp-stats-author">
            {([
              [a.article_count,    'Qabul qilingan maqolalar', <CheckIcon size={14} />],
              [a.total_views,      "Maqolalar ko'rilgan",       <EyeIcon size={14} />],
              [a.profile_views,    "Profil ko'rilgan",          <EyeIcon size={14} />],
            ] as [number, string, React.ReactNode][]).map(([v, k, icon], i) => (
              <div key={i} style={{ background: 'var(--paper)', padding: '26px 28px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10, color: 'var(--navy)' }}>
                  {icon}
                  <span className="eyebrow" style={{ fontSize: 10.5 }}>{k}</span>
                </div>
                <div style={{ fontFamily: 'var(--serif)', fontSize: 48, letterSpacing: '-0.03em', color: 'var(--navy)', fontWeight: 600, lineHeight: 1 }}>
                  {v.toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Body */}
      <div className="rsp-aside" style={{ padding: '48px var(--px) 80px', maxWidth: 1400, margin: '0 auto' }}>
        {/* Articles */}
        <div>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 20 }}>
            <h2 className="h-display" style={{ fontSize: 28 }}>Maqolalar</h2>
            <span style={{ fontSize: 13, color: 'var(--ink-3)' }}>
              {articlesState.status === 'ok' ? `${total} ta` : ''}
            </span>
          </div>

          {articlesState.status === 'loading' && (
            <div style={{ padding: '48px 0', textAlign: 'center', color: 'var(--ink-3)', fontSize: 13 }}>Yuklanmoqda…</div>
          )}

          {articlesState.status === 'ok' && (
            <>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {articles.length > 0 ? articles.map(art => (
                  <article key={art.id} className="row-hover" onClick={() => navigate(`/articles/${art.slug}`)}
                    style={{ display: 'grid', gridTemplateColumns: '1fr auto auto auto', gap: 20, alignItems: 'center', padding: '18px 12px', borderTop: '1px solid var(--line)', cursor: 'pointer' }}>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                        {art.category && <span className="tag navy-soft">{art.category.name}</span>}
                        <StatusTag status={art.status} />
                      </div>
                      <h4 className="h-display" style={{ fontSize: 18, lineHeight: 1.25, letterSpacing: '-0.01em' }}>{art.title}</h4>
                    </div>
                    <span style={{ fontSize: 12, color: 'var(--ink-3)', whiteSpace: 'nowrap' }}>
                      {formatDate(art.published_at)}
                    </span>
                    <span style={{ fontSize: 12, color: 'var(--ink-3)', display: 'inline-flex', alignItems: 'center', gap: 5, whiteSpace: 'nowrap' }}>
                      <ClockIcon size={11} /> {art.min_read} daq.
                    </span>
                    <span style={{ fontSize: 12, color: 'var(--ink-3)', display: 'inline-flex', alignItems: 'center', gap: 5, whiteSpace: 'nowrap' }}>
                      <EyeIcon size={11} /> {art.views.toLocaleString()}
                    </span>
                  </article>
                )) : (
                  <div style={{ padding: '48px 0', textAlign: 'center', color: 'var(--ink-3)', fontSize: 14 }}>
                    Hali maqolalar mavjud emas.
                  </div>
                )}
              </div>

              {hasMore && (
                <div style={{ display: 'flex', justifyContent: 'center', marginTop: 24 }}>
                  <LoadMoreButton label={`Barcha ${total} maqolani ko'rsatish`} />
                </div>
              )}
            </>
          )}
        </div>

        {/* Aside */}
        <aside className="rsp-hide" style={{ position: 'sticky', top: 92, display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* Author meta card */}
          {a && (
            <div style={{ background: 'var(--paper)', border: '1px solid var(--line)', borderRadius: 12, padding: '22px 22px' }}>
              <span className="eyebrow">Muallif haqida</span>
              <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 10, fontSize: 13, color: 'var(--ink-2)' }}>
                {a.org && (
                  <div>
                    <span style={{ color: 'var(--ink-4)', fontSize: 11, textTransform: 'uppercase', fontWeight: 600, letterSpacing: 0.2, display: 'block', marginBottom: 2 }}>Tashkilot</span>
                    {a.org}
                  </div>
                )}
                {a.role && (
                  <div>
                    <span style={{ color: 'var(--ink-4)', fontSize: 11, textTransform: 'uppercase', fontWeight: 600, letterSpacing: 0.2, display: 'block', marginBottom: 2 }}>Lavozim</span>
                    {a.role}
                  </div>
                )}
                {a.degree && (
                  <div>
                    <span style={{ color: 'var(--ink-4)', fontSize: 11, textTransform: 'uppercase', fontWeight: 600, letterSpacing: 0.2, display: 'block', marginBottom: 2 }}>Ilmiy daraja</span>
                    {a.degree}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Article categories for this author */}
          {articles.length > 0 && (() => {
            const cats = [...new Set(articles.map(a => a.category?.name).filter(Boolean))] as string[];
            return cats.length > 0 ? (
              <div style={{ background: 'var(--paper)', border: '1px solid var(--line)', borderRadius: 12, padding: '22px 22px' }}>
                <span className="eyebrow">Tadqiqot yo'nalishlari</span>
                <div style={{ marginTop: 14, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {cats.map((t, i) => (
                    <span key={i} className="tag line" style={{ height: 26 }}>{t}</span>
                  ))}
                </div>
              </div>
            ) : null;
          })()}

          {/* Navigate to all articles */}
          <button className="btn ghost" style={{ justifyContent: 'center', gap: 8 }}
            onClick={() => navigate('/articles')}>
            Barcha maqolalar <ArrowIcon size={12} />
          </button>
        </aside>
      </div>
    </div>
  );
}
