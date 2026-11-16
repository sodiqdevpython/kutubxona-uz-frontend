import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import Topbar from '../components/layout/Topbar';
import Footer from '../components/layout/Footer';
import PageLoadBar from '../components/ui/PageLoadBar';
import { useFetch } from '../lib/hooks';
import { useI18n } from '../lib/i18n';
import { centralAsiaApi, type ApiCentralAsiaPost, type ApiCentralAsiaStats, type PaginatedResponse } from '../lib/api';
import { mediaUrl } from '../lib/config';
import Seo from '../components/Seo';

/**
 * Central Asia to'plami — Figma «Central Asia» freymi (davlatlar filtrisiz).
 * Sarlavha + statistika, raqamlangan jadval, o'ngda mavzular va to'plam haqida.
 */

const BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:8000';
const PAGE = 8;

/** Maqola tili — sarlavha yozuvidan taxmin; kod sifatida ko'rsatiladi, tarjima qilinmaydi. */
function langCode(t: string): string {
  if (/[ўқғҳЎҚҒҲ]/.test(t)) return 'ЎЗ';
  if (/[а-яА-ЯёЁ]/.test(t)) return 'RU';
  if (/\b(the|and|of|in|for|with|study|library|libraries|after)\b/i.test(t)) return 'EN';
  return 'UZ';
}

export default function CentralAsiaPage() {
  const { t, tn } = useI18n();
  const [topic, setTopic] = useState<string | null>(null);
  const [limit, setLimit] = useState(PAGE);
  const [stats, setStats] = useState<ApiCentralAsiaStats | null>(null);

  useEffect(() => { centralAsiaApi.stats().then(setStats).catch(() => null); }, []);

  const listState = useFetch<PaginatedResponse<ApiCentralAsiaPost>>(`${BASE}/api/central-asia/?page_size=100`);
  const all = listState.status === 'ok' ? listState.data.results : [];

  const filtered = useMemo(
    () => topic ? all.filter(p => (p.source_category || 'Central Asia') === topic) : all,
    [all, topic],
  );
  const shown = filtered.slice(0, limit);
  const rest  = filtered.length - shown.length;

  return (
    <div className="bg-articles" style={{ minHeight: '100vh' }}>
      <Seo title={t('ca.title')} description={t('ca.seo.description')} />
      <PageLoadBar />
      <Topbar active="central-asia" />
      <main id="main" className="page-main">

      <div className="wrap" style={{ paddingTop: 30 }}>
        <nav className="crumbs">
          <Link to="/">{t('nav.home')}</Link><span>/</span>
          <span className="cur">{t('ca.title')}</span>
        </nav>

        {/* ── Sarlavha + statistika ── */}
        <div className="ca-head">
          <div>
            <div className="eyebrow accent" style={{ marginBottom: 14 }}>{t('ca.collection')}</div>
            <h1 className="h-display ca-title">{t('ca.title_full')}</h1>
            <p className="ca-lede">{t('ca.lede')}</p>
          </div>
          <div className="ca-stats">
            <div className="au-stat"><span className="meta-cell-k">{t('ca.stat.articles')}</span><span className="au-stat-n">{stats?.articles ?? '—'}</span></div>
            <div className="au-stat"><span className="meta-cell-k">{t('ca.stat.topics')}</span><span className="au-stat-n">{stats?.topics.length ?? '—'}</span></div>
            <div className="au-stat"><span className="meta-cell-k">{t('ca.stat.authors')}</span><span className="au-stat-n">{stats?.authors ?? '—'}</span></div>
            <div className="au-stat"><span className="meta-cell-k">{t('ca.stat.languages')}</span><span className="au-stat-n">{stats?.languages.length ?? '—'}</span></div>
          </div>
        </div>
      </div>

      <div className="wrap ca-grid">
        {/* ── Ro'yxat ── */}
        <div>
          <div className="detail-head" style={{ marginBottom: 16 }}>
            <h2 className="h-display" style={{ fontSize: 26, display: 'flex', alignItems: 'baseline', gap: 14 }}>
              {topic ? `${topic}` : t('ca.all')}
              <span className="meta">{tn('unit.shown', shown.length)}</span>
            </h2>
            {topic && (
              <button className="active-chip" onClick={() => { setTopic(null); setLimit(PAGE); }}>
                {topic} <span>×</span>
              </button>
            )}
          </div>

          {listState.status === 'loading' && <div className="state-box">{t('common.loading')}</div>}
          {listState.status === 'ok' && shown.length === 0 && <div className="state-box">{t('ca.empty')}</div>}

          {shown.length > 0 && (
            <div className="art-table">
              {shown.map((p, i) => (
                <Link key={p.id} to={`/central-asia/${p.slug}`} className="art-row au-row">
                  <div className="art-row-num">{String(i + 1).padStart(2, '0')}</div>
                  <div className="au-row-thumb">
                    {p.image_url ? <img src={mediaUrl(p.image_url) ?? undefined} alt={p.title} loading="lazy" /> : <div className="home-featured-ph" />}
                  </div>
                  <div className="art-row-body">
                    <div className="art-row-tags">
                      <span className="tag cat">{p.source_category || 'Central Asia'}</span>
                      <span className="tag ok">{t('common.open_access')}</span>
                      <span className="meta">{langCode(p.title)}</span>
                    </div>
                    <h3 className="art-row-title h-display">{p.title}</h3>
                    {p.author_line && <div className="art-row-authors">{p.author_line}</div>}
                  </div>
                  <div className="art-row-meta">
                    {p.published_at && <span>{p.published_at.slice(0, 4)}</span>}
                    <span>{tn('unit.views', p.total_views)}</span>
                  </div>
                </Link>
              ))}
            </div>
          )}

          {rest > 0 && (
            <div style={{ textAlign: 'center', paddingTop: 22 }}>
              <button className="btn ghost" onClick={() => setLimit(l => l + 20)}>
                {tn('ca.more', Math.min(rest, 20))}
              </button>
            </div>
          )}
        </div>

        {/* ── Yon panel ── */}
        <aside className="ca-side">
          {stats && stats.topics.length > 0 && (
            <div className="side-card">
              <div className="side-card-title">{t('ca.topics')}</div>
              {stats.topics.map(tp => (
                <button key={tp.name} className={`side-row side-row-btn${topic === tp.name ? ' on' : ''}`}
                  onClick={() => { setTopic(topic === tp.name ? null : tp.name); setLimit(PAGE); }}>
                  <span>{tp.name}</span>
                  <span className="meta">{tp.count}</span>
                </button>
              ))}
            </div>
          )}
          <div className="side-card" style={{ background: 'var(--grey-2)' }}>
            <div className="side-card-title">{t('ca.about_title')}</div>
            <p className="side-text">{t('ca.about_text')}</p>
            <Link to="/about/guide" className="side-link">{t('ca.terms')}</Link>
          </div>
        </aside>
      </div>

      </main>
      <Footer />
    </div>
  );
}
