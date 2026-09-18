import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Topbar from '../components/layout/Topbar';
import Footer from '../components/layout/Footer';
import PageLoadBar from '../components/ui/PageLoadBar';
import { useFetch } from '../lib/hooks';
import { centralAsiaApi, type ApiCentralAsiaPost, type ApiCentralAsiaStats, type PaginatedResponse } from '../lib/api';
import { mediaUrl } from '../lib/config';
import Seo from '../components/Seo';

/**
 * Central Asia to'plami — Figma «Central Asia» freymi (davlatlar filtrisiz).
 * Sarlavha + statistika, raqamlangan jadval, o'ngda mavzular va to'plam haqida.
 */

const BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:8000';
const PAGE = 8;

function langCode(t: string): string {
  if (/[ўқғҳЎҚҒҲ]/.test(t)) return 'ЎЗ';
  if (/[а-яА-ЯёЁ]/.test(t)) return 'RU';
  if (/\b(the|and|of|in|for|with|study|library|libraries|after)\b/i.test(t)) return 'EN';
  return 'UZ';
}

export default function CentralAsiaPage() {
  const navigate = useNavigate();
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
      <Seo title="Central Asia" description="Markaziy Osiyo mamlakatlari kutubxonalari va axborot muassasalari bo'yicha maqolalar to'plami." />
      <PageLoadBar />
      <Topbar active="central-asia" />

      <div className="wrap" style={{ paddingTop: 30 }}>
        <nav className="crumbs">
          <Link to="/">Bosh sahifa</Link><span>/</span>
          <span className="cur">Central Asia</span>
        </nav>

        {/* ── Sarlavha + statistika ── */}
        <div className="ca-head">
          <div>
            <div className="eyebrow accent" style={{ marginBottom: 14 }}>Alohida to‘plam</div>
            <h1 className="h-display ca-title">Central Asia: mintaqaviy kutubxonashunoslik to‘plami</h1>
            <p className="ca-lede">
              Markaziy Osiyo mamlakatlari kutubxonalari va axborot muassasalari bo‘yicha maqolalar.
              Jurnal arxividan alohida turadi: bu yerda mintaqa mualliflarining ishlari, IFLA
              mintaqaviy hisobotlari va qiyosiy tadqiqotlar jamlangan.
            </p>
          </div>
          <div className="ca-stats">
            <div className="au-stat"><span className="meta-cell-k">Maqolalar</span><span className="au-stat-n">{stats?.articles ?? '—'}</span></div>
            <div className="au-stat"><span className="meta-cell-k">Mavzular</span><span className="au-stat-n">{stats?.topics.length ?? '—'}</span></div>
            <div className="au-stat"><span className="meta-cell-k">Mualliflar</span><span className="au-stat-n">{stats?.authors ?? '—'}</span></div>
            <div className="au-stat"><span className="meta-cell-k">Tillar</span><span className="au-stat-n">{stats?.languages.length ?? '—'}</span></div>
          </div>
        </div>
      </div>

      <div className="wrap ca-grid">
        {/* ── Ro'yxat ── */}
        <div>
          <div className="detail-head" style={{ marginBottom: 16 }}>
            <h2 className="h-display" style={{ fontSize: 26, display: 'flex', alignItems: 'baseline', gap: 14 }}>
              {topic ? `${topic}` : 'Barcha maqolalar'}
              <span className="meta">{shown.length} ta ko‘rsatilmoqda</span>
            </h2>
            {topic && (
              <button className="active-chip" onClick={() => { setTopic(null); setLimit(PAGE); }}>
                {topic} <span>×</span>
              </button>
            )}
          </div>

          {listState.status === 'loading' && <div className="state-box">Yuklanmoqda…</div>}
          {listState.status === 'ok' && shown.length === 0 && <div className="state-box">Hozircha maqola yo‘q.</div>}

          {shown.length > 0 && (
            <div className="art-table">
              {shown.map((p, i) => (
                <article key={p.id} className="art-row au-row" onClick={() => navigate(`/central-asia/${p.slug}`)}>
                  <div className="art-row-num">{String(i + 1).padStart(2, '0')}</div>
                  <div className="au-row-thumb">
                    {p.image_url ? <img src={mediaUrl(p.image_url) ?? undefined} alt="" /> : <div className="home-featured-ph" />}
                  </div>
                  <div className="art-row-body">
                    <div className="art-row-tags">
                      <span className="tag cat">{p.source_category || 'Central Asia'}</span>
                      <span className="tag ok">Ochiq kirish</span>
                      <span className="meta">{langCode(p.title)}</span>
                    </div>
                    <h3 className="art-row-title h-display">{p.title}</h3>
                    {p.author_line && <div className="art-row-authors">{p.author_line}</div>}
                  </div>
                  <div className="art-row-meta">
                    {p.published_at && <span>{p.published_at.slice(0, 4)}</span>}
                    <span>{p.total_views.toLocaleString()} ko‘rish</span>
                    {p.doi && <span className="art-row-pdf">DOI</span>}
                  </div>
                </article>
              ))}
            </div>
          )}

          {rest > 0 && (
            <div style={{ textAlign: 'center', paddingTop: 22 }}>
              <button className="btn ghost" onClick={() => setLimit(l => l + 20)}>
                Yana {Math.min(rest, 20)} maqola
              </button>
            </div>
          )}
        </div>

        {/* ── Yon panel ── */}
        <aside className="ca-side rsp-hide">
          {stats && stats.topics.length > 0 && (
            <div className="side-card">
              <div className="side-card-title">Mavzular</div>
              {stats.topics.map(t => (
                <button key={t.name} className={`side-row side-row-btn${topic === t.name ? ' on' : ''}`}
                  onClick={() => { setTopic(topic === t.name ? null : t.name); setLimit(PAGE); }}>
                  <span>{t.name}</span>
                  <span className="meta">{t.count}</span>
                </button>
              ))}
            </div>
          )}
          <div className="side-card" style={{ background: 'var(--grey-2)' }}>
            <div className="side-card-title">To‘plam haqida</div>
            <p className="side-text">
              Central Asia to‘plami 2022-yilda IFLA mintaqaviy bo‘limi bilan hamkorlikda ochilgan.
              Maqolalar jurnal sonlaridan tashqari ham qabul qilinadi.
            </p>
            <Link to="/about/guide" className="side-link">Qabul shartlari</Link>
          </div>
        </aside>
      </div>

      <Footer />
    </div>
  );
}
