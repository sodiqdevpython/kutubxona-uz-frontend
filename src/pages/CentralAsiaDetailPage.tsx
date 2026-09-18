import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import Topbar from '../components/layout/Topbar';
import Footer from '../components/layout/Footer';
import PageLoadBar from '../components/ui/PageLoadBar';
import { centralAsiaApi, type ApiCentralAsiaPost, type ApiCentralAsiaPostDetail } from '../lib/api';
import { mediaUrl } from '../lib/config';
import Seo from '../components/Seo';

/**
 * Central Asia maqola sahifasi.
 * Figma'da bu freym yo'q — to'plam ro'yxati va maqola sahifasi uslubidan
 * kelib chiqib yaratildi: to'liq enli rasmli sarlavha, o'qish ustuni,
 * yon panelda manba va o'xshash maqolalar.
 */

const MONTHS = ['yanvar', 'fevral', 'mart', 'aprel', 'may', 'iyun', 'iyul', 'avgust', 'sentabr', 'oktabr', 'noyabr', 'dekabr'];
function fmtDate(iso: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? iso : `${d.getDate()}-${MONTHS[d.getMonth()]}, ${d.getFullYear()}`;
}

export default function CentralAsiaDetailPage() {
  const { slug = '' } = useParams<{ slug: string }>();
  const [post, setPost]   = useState<ApiCentralAsiaPostDetail | null>(null);
  const [more, setMore]   = useState<ApiCentralAsiaPost[]>([]);
  const [error, setError] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setError(false); setPost(null);
    if (!slug) return;
    window.scrollTo({ top: 0 });
    centralAsiaApi.detail(slug).then(setPost).catch(() => setError(true));
    centralAsiaApi.list({ page_size: '4' })
      .then(d => setMore(d.results.filter(p => p.slug !== slug).slice(0, 3)))
      .catch(() => setMore([]));
  }, [slug]);

  function share() {
    navigator.clipboard?.writeText(window.location.href).catch(() => {});
    setCopied(true); setTimeout(() => setCopied(false), 1600);
  }

  if (error) {
    return (
      <div className="bg-detail" style={{ minHeight: '100vh' }}>
        <PageLoadBar /><Topbar active="central-asia" />
        <div className="wrap"><div className="state-box" style={{ marginTop: 40 }}>
          Maqola topilmadi. <Link to="/central-asia" className="side-link">To‘plamga qaytish →</Link>
        </div></div>
        <Footer />
      </div>
    );
  }
  if (!post) {
    return (
      <div className="bg-detail" style={{ minHeight: '100vh' }}>
        <PageLoadBar /><Topbar active="central-asia" />
        <div className="wrap"><div className="state-box" style={{ marginTop: 40 }}>Yuklanmoqda…</div></div>
        <Footer />
      </div>
    );
  }

  const img = mediaUrl(post.image_url);

  return (
    <div className="bg-detail" style={{ minHeight: '100vh' }}>
      <Seo title={post.title} description={post.excerpt} image={img} />
      <PageLoadBar />
      <Topbar active="central-asia" />

      {/* ═══ To'liq enli sarlavha bloki ═══ */}
      <section className="cad-hero">
        {img && <div className="hero-photo" style={{ backgroundImage: `url(${img})` }} />}
        <div className="cad-veil" />
        <div className="wrap cad-hero-inner">
          <nav className="crumbs cad-crumbs">
            <Link to="/">Bosh sahifa</Link><span>/</span>
            <Link to="/central-asia">Central Asia</Link><span>/</span>
            <span className="cur">{post.source_category || 'Maqola'}</span>
          </nav>
          <div className="detail-tags" style={{ marginBottom: 16 }}>
            <span className="pill-cat">{post.source_category || 'Central Asia'}</span>
            <span className="pill-oa" style={{ borderColor: 'rgba(255,255,255,.35)', color: '#fff' }}>Ochiq kirish</span>
          </div>
          <h1 className="h-display cad-title">{post.title}</h1>
          {post.author_line && <div className="cad-author">{post.author_line}</div>}
        </div>
      </section>

      {/* ═══ Meta chiziq ═══ */}
      <div className="wrap">
        <div className="cad-meta">
          {post.published_at && <span><b>Nashr etildi</b>{fmtDate(post.published_at)}</span>}
          <span><b>Ko‘rishlar</b>{post.total_views.toLocaleString()}</span>
          {post.quote_number > 0 && <span><b>Iqtiboslar</b>{post.quote_number}</span>}
          {post.doi && <span><b>DOI</b><a href={`https://doi.org/${post.doi}`} target="_blank" rel="noreferrer">{post.doi}</a></span>}
          <span style={{ marginLeft: 'auto' }}>
            <button className="btn ghost sm" onClick={share}>{copied ? 'Nusxalandi ✓' : 'Ulashish'}</button>
          </span>
        </div>
      </div>

      {/* ═══ Matn + yon panel ═══ */}
      <div className="wrap cad-grid">
        <article className="cad-body">
          {post.excerpt && <p className="cad-lede">{post.excerpt}</p>}
          {post.content
            ? <div className="prose" dangerouslySetInnerHTML={{ __html: post.content }} />
            : <div className="state-box">Matn mavjud emas.</div>}
        </article>

        <aside className="cad-side rsp-hide">
          {post.source_url && (
            <div className="side-card">
              <div className="side-card-title">Manba</div>
              <p className="side-text" style={{ marginTop: 8 }}>Maqola asl manzilida to‘liq ko‘rinishda mavjud.</p>
              <a className="btn ghost sm" href={post.source_url} target="_blank" rel="noreferrer" style={{ width: '100%' }}>
                Manbada ochish ↗
              </a>
            </div>
          )}
          {more.length > 0 && (
            <div className="side-card">
              <div className="side-card-title">To‘plamdan yana</div>
              {more.map(m => (
                <Link key={m.id} to={`/central-asia/${m.slug}`} className="cad-more">
                  <span className="tag cat">{m.source_category || 'Central Asia'}</span>
                  <span className="cad-more-title">{m.title}</span>
                  <span className="meta">{m.author_line}</span>
                </Link>
              ))}
            </div>
          )}
          <Link to="/central-asia" className="btn ghost" style={{ width: '100%' }}>← To‘plamga qaytish</Link>
        </aside>
      </div>

      <Footer />
    </div>
  );
}
