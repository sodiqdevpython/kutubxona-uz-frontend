import { useEffect, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import Topbar from '../components/layout/Topbar';
import Footer from '../components/layout/Footer';
import PageLoadBar from '../components/ui/PageLoadBar';
import { SearchIcon } from '../components/ui/Icons';

/**
 * 404 — sahifa topilmadi (sayt uslubida: serif sarlavha, to'q sariq urg'u,
 * qidiruv va asosiy bo'limlarga havolalar).
 */
export default function NotFoundPage() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [q, setQ] = useState('');

  useEffect(() => { document.title = 'Sahifa topilmadi · Kutubxona.uz'; }, []);

  return (
    <div className="bg-articles" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <PageLoadBar />
      <Topbar active="home" />

      <main className="wrap nf" style={{ flex: 1 }}>
        <div className="nf-code">404</div>
        <h1 className="h-display nf-title">Sahifa topilmadi</h1>
        <p className="nf-text">
          <code className="nf-path">{pathname}</code> manzilida sahifa yo‘q — u ko‘chirilgan,
          o‘chirilgan yoki manzil noto‘g‘ri terilgan bo‘lishi mumkin.
        </p>

        <form className="searchbar nf-search" onSubmit={e => { e.preventDefault(); if (q.trim()) navigate(`/articles?search=${encodeURIComponent(q.trim())}`); }}>
          <SearchIcon size={16} style={{ color: 'var(--ink-4)', flexShrink: 0 }} />
          <input value={q} onChange={e => setQ(e.target.value)} placeholder="Maqola, muallif yoki kalit so‘z bo‘yicha qidirish…" />
          <button type="submit" className="btn primary sm">Qidirish</button>
        </form>

        <div className="nf-links">
          <Link to="/" className="btn ghost">← Bosh sahifa</Link>
          <Link to="/articles" className="btn ghost">Maqolalar</Link>
          <Link to="/archive" className="btn ghost">Jurnal arxivi</Link>
          <Link to="/authors" className="btn ghost">Mualliflar</Link>
        </div>
      </main>

      <Footer />
    </div>
  );
}
