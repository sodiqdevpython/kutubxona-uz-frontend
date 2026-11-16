import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import Topbar from '../components/layout/Topbar';
import Footer from '../components/layout/Footer';
import PageLoadBar from '../components/ui/PageLoadBar';
import { useI18n } from '../lib/i18n';
import { centralAsiaApi, type ApiCentralAsiaPost, type ApiCentralAsiaPostDetail } from '../lib/api';
import { mediaUrl } from '../lib/config';
import Seo from '../components/Seo';

/**
 * Central Asia maqola sahifasi.
 * Figma'da bu freym yo'q — to'plam ro'yxati va maqola sahifasi uslubidan
 * kelib chiqib yaratildi: to'liq enli rasmli sarlavha, o'qish ustuni,
 * yon panelda manba va o'xshash maqolalar.
 */

export default function CentralAsiaDetailPage() {
  const { slug = '' } = useParams<{ slug: string }>();
  const { t, num, date } = useI18n();
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
        <main id="main" className="page-main">
        <div className="wrap"><div className="state-box" style={{ marginTop: 40 }}>
          {t('ca.not_found')} <Link to="/central-asia" className="side-link">{t('cad.back_arrow')}</Link>
        </div></div>
        </main>
        <Footer />
      </div>
    );
  }
  if (!post) {
    return (
      <div className="bg-detail" style={{ minHeight: '100vh' }}>
        <PageLoadBar /><Topbar active="central-asia" />
        <main id="main" className="page-main">
        <div className="wrap"><div className="state-box" style={{ marginTop: 40 }}>{t('common.loading')}</div></div>
        </main>
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
      <main id="main" className="page-main">

      {/* ═══ To'liq enli sarlavha bloki ═══ */}
      <section className="cad-hero">
        {img && <div className="hero-photo" style={{ backgroundImage: `url(${img})` }} />}
        <div className="cad-veil" />
        <div className="wrap cad-hero-inner">
          <nav className="crumbs cad-crumbs">
            <Link to="/">{t('nav.home')}</Link><span>/</span>
            <Link to="/central-asia">{t('ca.title')}</Link><span>/</span>
            <span className="cur">{post.source_category || t('cad.article')}</span>
          </nav>
          <div className="detail-tags" style={{ marginBottom: 16 }}>
            <span className="pill-cat">{post.source_category || 'Central Asia'}</span>
            <span className="pill-oa" style={{ borderColor: 'rgba(255,255,255,.35)', color: '#fff' }}>{t('common.open_access')}</span>
          </div>
          <h1 className="h-display cad-title">{post.title}</h1>
          {post.author_line && <div className="cad-author">{post.author_line}</div>}
        </div>
      </section>

      {/* ═══ Meta chiziq ═══ */}
      <div className="wrap">
        <div className="cad-meta">
          {post.published_at && <span><b>{t('cad.published')}</b>{date(post.published_at)}</span>}
          <span><b>{t('cad.views')}</b>{num(post.total_views)}</span>
          {post.quote_number > 0 && <span><b>{t('cad.quotes')}</b>{post.quote_number}</span>}
          <span style={{ marginLeft: 'auto' }}>
            <button className="btn ghost sm" onClick={share}>{copied ? t('common.Copied') : t('common.share')}</button>
          </span>
        </div>
      </div>

      {/* ═══ Matn + yon panel ═══ */}
      <div className="wrap cad-grid">
        <article className="cad-body">
          {post.excerpt && <p className="cad-lede">{post.excerpt}</p>}
          {post.content
            ? <div className="prose" dangerouslySetInnerHTML={{ __html: post.content }} />
            : <div className="state-box">{t('cad.no_text')}</div>}
        </article>

        <aside className="cad-side">
          {post.source_url && (
            <div className="side-card">
              <div className="side-card-title">{t('cad.source')}</div>
              <p className="side-text" style={{ marginTop: 8 }}>{t('cad.source_text')}</p>
              <a className="btn ghost sm" href={post.source_url} target="_blank" rel="noreferrer" style={{ width: '100%' }}>
                {t('cad.open_source')}
              </a>
            </div>
          )}
          {more.length > 0 && (
            <div className="side-card">
              <div className="side-card-title">{t('cad.more')}</div>
              {more.map(mm => (
                <Link key={mm.id} to={`/central-asia/${mm.slug}`} className="cad-more">
                  <span className="tag cat">{mm.source_category || 'Central Asia'}</span>
                  <span className="cad-more-title">{mm.title}</span>
                  <span className="meta">{mm.author_line}</span>
                </Link>
              ))}
            </div>
          )}
          <Link to="/central-asia" className="btn ghost" style={{ width: '100%' }}>{t('cad.back')}</Link>
        </aside>
      </div>

      </main>
      <Footer />
    </div>
  );
}
