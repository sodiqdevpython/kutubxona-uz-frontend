import { useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import Topbar from '../components/layout/Topbar';
import Footer from '../components/layout/Footer';
import PageLoadBar from '../components/ui/PageLoadBar';
import AuthorAvatar from '../components/ui/AuthorAvatar';
import { useFetch } from '../lib/hooks';
import type { ApiArticle, ApiAuthorDetail, PaginatedResponse } from '../lib/api';
import { mediaUrl } from '../lib/config';
import Seo from '../components/Seo';

/**
 * Muallif sahifasi — Figma «Muallif detail» freymi.
 * Avatar + ism + chiplar + bio, statistika, yillar diagrammasi,
 * o'ngda identifikatorlar va hammualliflar, pastda maqolalar jadvali.
 */

const BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:8000';

type SortKey = 'new' | 'views';
const SORT: Record<SortKey, { label: string; param: string }> = {
  new:   { label: 'Eng yangi',     param: '-issue__year,-issue__number,-published_at' },
  views: { label: "Ko‘p o‘qilgan", param: '-views' },
};

/** «Anvar Umarov» → «A. Umarov» */
function short(name: string): string {
  const p = name.trim().split(/\s+/);
  return p.length > 1 ? `${p[0][0]}. ${p.slice(1).join(' ')}` : name;
}

export default function AuthorDetailPage() {
  const navigate = useNavigate();
  const { slug } = useParams<{ slug: string }>();
  const [sort, setSort] = useState<SortKey>('new');

  const authorState   = useFetch<ApiAuthorDetail>(slug ? `${BASE}/api/authors/${slug}/` : null);
  const articlesState = useFetch<PaginatedResponse<ApiArticle>>(
    slug ? `${BASE}/api/articles/?author=${slug}&page_size=100&ordering=${SORT[sort].param}` : null,
  );

  const a        = authorState.status   === 'ok' ? authorState.data           : null;
  const articles = articlesState.status === 'ok' ? articlesState.data.results : [];

  const years = useMemo(() => {
    const ys = articles.map(x => x.year).filter(Boolean);
    return ys.length ? `${Math.min(...ys)}–${Math.max(...ys)}` : '';
  }, [articles]);
  const maxYear = Math.max(1, ...(a?.years.map(y => y.count) ?? [1]));

  if (authorState.status === 'error') {
    return (
      <div className="bg-author" style={{ minHeight: '100vh' }}>
        <PageLoadBar /><Topbar active="authors" />
        <div className="wrap">
          <div className="state-box" style={{ marginTop: 40 }}>
            Muallif topilmadi. <Link to="/authors" className="side-link">Mualliflar ro‘yxati →</Link>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!a) {
    return (
      <div className="bg-author" style={{ minHeight: '100vh' }}>
        <PageLoadBar /><Topbar active="authors" />
        <div className="wrap"><div className="state-box" style={{ marginTop: 40 }}>Yuklanmoqda…</div></div>
        <Footer />
      </div>
    );
  }

  const avatar = mediaUrl(a.avatar_url);

  return (
    <div className="bg-author" style={{ minHeight: '100vh' }}>
      <Seo title={a.name} description={a.bio || `${a.name} — ${a.org}`} image={avatar} />
      <PageLoadBar />
      <Topbar active="authors" />

      <div className="wrap" style={{ paddingTop: 26 }}>
        <nav className="crumbs">
          <Link to="/">Bosh sahifa</Link><span>/</span>
          <Link to="/authors">Mualliflar</Link><span>/</span>
          <span className="cur">{a.name}</span>
        </nav>
      </div>

      <div className="wrap au-grid">
        {/* ═══ Chap ustun ═══ */}
        <div className="au-main">
          <div className="au-head">
            <div className="au-avatar">
              <AuthorAvatar name={a.initials} idx={a.avatar_idx} src={avatar} alt={a.name} size={96} />
            </div>
            <div>
              <h1 className="h-display au-name">{a.name}</h1>
              {(a.org || a.role) && (
                <div className="au-org">{[a.org, a.role].filter(Boolean).join(' · ')}</div>
              )}
              <div className="au-chips">
                {a.orcid && (
                  <a className="orcid-pill" href={`https://orcid.org/${a.orcid}`} target="_blank" rel="noreferrer">
                    ORCID {a.orcid}
                  </a>
                )}
                {a.categories.map(c => <Link key={c} to="/articles" className="pill-line">{c}</Link>)}
              </div>
            </div>
          </div>

          {a.bio && <p className="au-bio">{a.bio}</p>}

          {/* Statistika */}
          <div className="au-stats">
            <Stat k="Maqolalar" v={a.article_count} />
            <Stat k="Ko‘rishlar" v={a.total_views} />
            <Stat k="Profil ko‘rildi" v={a.profile_views} />
            <Stat k="Hammuallif" v={a.coauthors.length} />
          </div>

          {/* Yillar diagrammasi */}
          {a.years.length > 0 && (
            <div className="au-chart">
              <div className="au-chart-head">
                <span className="eyebrow">Yillar bo‘yicha faollik</span>
                <span className="meta">maqolalar soni</span>
              </div>
              <div className="au-bars" style={{ gridTemplateColumns: `repeat(${a.years.length}, minmax(0, 1fr))` }}>
                {a.years.map(y => (
                  <div key={y.year} className="au-bar-col">
                    <span className="au-bar-n">{y.count || '–'}</span>
                    <div className="au-bar-track">
                      <div className="au-bar" style={{ height: `${y.count ? Math.max(18, (y.count / maxYear) * 100) : 0}%` }} />
                    </div>
                    <span className="meta">{y.year}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ═══ O'ng ustun ═══ */}
        <aside className="au-side rsp-hide">
          <div className="side-card">
            <div className="side-card-title">Aloqa va identifikatorlar</div>
            <Row k="ORCID" v={a.orcid} href={a.orcid ? `https://orcid.org/${a.orcid}` : undefined} accent />
            <Row k="Elektron pochta" v={a.email} href={a.email ? `mailto:${a.email}` : undefined} accent />
            <Row k="Tashkilot" v={a.org} />
            <Row k="Scopus Author ID" v={a.scopus_id || 'ko‘rsatilmagan'} muted={!a.scopus_id} />
            {articles.length > 0 && (
              <Link to={`/articles?search=${encodeURIComponent(a.name)}`} className="btn primary" style={{ width: '100%', marginTop: 14 }}>
                Barcha maqolalarini ko‘rish
              </Link>
            )}
          </div>

          {a.coauthors.length > 0 && (
            <div className="side-card">
              <div className="side-card-title">Hammualliflar</div>
              {a.coauthors.map(c => (
                <Link key={c.id} to={`/authors/${c.slug}`} className="coauthor">
                  <AuthorAvatar name={c.initials} idx={c.avatar_idx} src={mediaUrl(c.avatar_url)} alt={c.name} size={32} />
                  <span>
                    <span className="coauthor-name">{c.name}</span>
                    <span className="meta">{c.shared} birgalikdagi maqola</span>
                  </span>
                </Link>
              ))}
            </div>
          )}
        </aside>
      </div>

      {/* ═══ Maqolalari ═══ */}
      <div className="wrap" style={{ paddingTop: 40, paddingBottom: 72 }}>
        <div className="detail-head" style={{ marginBottom: 18 }}>
          <h2 className="h-display" style={{ fontSize: 28, display: 'flex', alignItems: 'baseline', gap: 14 }}>
            Maqolalari
            <span className="meta">{articles.length} ta{years ? ` · ${years}` : ''}</span>
          </h2>
          <div className="segment">
            {(Object.keys(SORT) as SortKey[]).map(k => (
              <button key={k} className={sort === k ? 'active' : ''} onClick={() => setSort(k)}>{SORT[k].label}</button>
            ))}
          </div>
        </div>

        {articlesState.status === 'loading' && <div className="state-box">Yuklanmoqda…</div>}
        {articlesState.status === 'ok' && articles.length === 0 && (
          <div className="state-box">Hali chop etilgan maqolasi yo‘q.</div>
        )}

        {articles.length > 0 && (
          <div className="art-table">
            {articles.map((x, i) => {
              const others = x.authors.filter(o => o.slug !== a.slug).map(o => short(o.name));
              return (
                <article key={x.id} className="art-row au-row" onClick={() => navigate(`/articles/${x.slug}`)}>
                  <div className="art-row-num">{String(i + 1).padStart(2, '0')}</div>
                  <div className="au-row-thumb">
                    {x.image_url ? <img src={mediaUrl(x.image_url) ?? undefined} alt="" /> : <div className="home-featured-ph" />}
                  </div>
                  <div className="art-row-body">
                    <div className="art-row-tags">
                      {x.category && <span className="tag cat">{x.category.name}</span>}
                      <span className="tag ok">Ochiq kirish</span>
                    </div>
                    <h3 className="art-row-title h-display">{x.title}</h3>
                    <div className="art-row-authors">{others.length ? `${others.join(', ')} bilan` : 'yakka muallif'}</div>
                  </div>
                  <div className="art-row-meta">
                    <span>{x.year} · №&nbsp;{x.quarter}</span>
                    {x.page_start && x.page_end && <span>{x.page_start}–{x.page_end}&nbsp;b.</span>}
                    <span>{x.views.toLocaleString()} ko‘rish</span>
                    <Link to={`/articles/${x.slug}`} className="art-row-pdf" onClick={e => e.stopPropagation()}>PDF</Link>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}

function Stat({ k, v }: { k: string; v: number }) {
  return (
    <div className="au-stat">
      <span className="meta-cell-k">{k}</span>
      <span className="au-stat-n">{v.toLocaleString()}</span>
    </div>
  );
}

function Row({ k, v, href, accent, muted }: { k: string; v: string; href?: string; accent?: boolean; muted?: boolean }) {
  if (!v) return null;
  return (
    <div className="pass-row">
      <span className="pass-k">{k}</span>
      {href
        ? <a className="pass-v" data-accent={accent ? 'on' : undefined} href={href} target="_blank" rel="noreferrer" style={{ textDecoration: 'none' }}>{v}</a>
        : <span className="pass-v" style={muted ? { color: 'var(--ink-3)', fontWeight: 400 } : undefined}>{v}</span>}
    </div>
  );
}
