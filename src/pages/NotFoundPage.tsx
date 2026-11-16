import { useEffect, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import Topbar from '../components/layout/Topbar';
import Footer from '../components/layout/Footer';
import PageLoadBar from '../components/ui/PageLoadBar';
import { SearchIcon } from '../components/ui/Icons';
import { useI18n } from '../lib/i18n';

/**
 * 404 — sahifa topilmadi (sayt uslubida: serif sarlavha, to'q sariq urg'u,
 * qidiruv va asosiy bo'limlarga havolalar).
 */
export default function NotFoundPage() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { t } = useI18n();
  const [q, setQ] = useState('');

  useEffect(() => {
    document.title = t('notfound.doc_title');
    // Server 200 qaytargan holat uchun (mavjud bo'lmagan maqola): qidiruvga tushmasin
    const robots = document.createElement('meta');
    robots.setAttribute('name', 'robots');
    robots.setAttribute('content', 'noindex');
    document.head.appendChild(robots);
    return () => robots.remove();
  }, [t]);

  // Manzil <code> ichida — matndagi {path} o'rniga element qo'yiladi (so'z tartibi tilga qarab farq qiladi)
  const [before, after] = t('notfound.text').split('{path}');

  return (
    <div className="bg-articles" style={{ minHeight: '100vh' }}>
      <PageLoadBar />
      <Topbar active="home" />

      <main id="main" className="wrap nf page-main">
        <div className="nf-code">404</div>
        <h1 className="h-display nf-title">{t('notfound.title')}</h1>
        <p className="nf-text">
          {before}<code className="nf-path">{pathname}</code>{after}
        </p>

        <form className="searchbar nf-search" onSubmit={e => { e.preventDefault(); if (q.trim()) navigate(`/articles?search=${encodeURIComponent(q.trim())}`); }}>
          <SearchIcon size={16} style={{ color: 'var(--ink-4)', flexShrink: 0 }} />
          <input value={q} onChange={e => setQ(e.target.value)} placeholder={t('notfound.search_placeholder')} aria-label={t('common.search')} />
          <button type="submit" className="btn primary sm">{t('common.search')}</button>
        </form>

        <div className="nf-links">
          <Link to="/" className="btn ghost">{t('notfound.home')}</Link>
          <Link to="/articles" className="btn ghost">{t('nav.articles')}</Link>
          <Link to="/archive" className="btn ghost">{t('nav.archive')}</Link>
          <Link to="/authors" className="btn ghost">{t('nav.authors')}</Link>
        </div>
      </main>

      <Footer />
    </div>
  );
}
