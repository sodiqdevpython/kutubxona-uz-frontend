import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Topbar from '../components/layout/Topbar';
import Footer from '../components/layout/Footer';
import PageLoadBar from '../components/ui/PageLoadBar';
import JournalCover from '../components/ui/JournalCover';
import Seo from '../components/Seo';
import { useFetch } from '../lib/hooks';
import type {
  ApiArticle, ApiCategory, ApiIssue, ApiYearGroup, PaginatedResponse,
} from '../lib/api';

/**
 * Bosh sahifa — Figma «Asosiy» freymi.
 *
 * Bloklar:
 *   1. Hero — so'nggi son, sarlavha, statistika
 *   2. So'nggi son + yon panel (sondagi yo'nalishlar, jurnal haqida)
 *   3. Sonning yetakchi maqolasi
 *   4. Shu sondan yana — raqamlangan ro'yxat
 *   5. Ko'p o'qilganlar + Yo'nalishlar
 *   6. Arxiv — muqovalar qatori
 *   7. Mualliflarga chaqiriq (to'q blok)
 */

const BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:8000';

interface Stats { articles: number; authors: number; issues: number }

export default function HomePage() {
  const navigate = useNavigate();

  const feedState  = useFetch<PaginatedResponse<ApiArticle>>(`${BASE}/api/articles/?page_size=12`);
  const trendState = useFetch<PaginatedResponse<ApiArticle>>(`${BASE}/api/articles/?ordering=-views&page_size=5`);
  const catState   = useFetch<ApiCategory[]>(`${BASE}/api/categories/`);
  const statsState = useFetch<Stats>(`${BASE}/api/articles/stats/`);
  const archState  = useFetch<ApiYearGroup[]>(`${BASE}/api/issues/archive/`);
  const caState    = useFetch<PaginatedResponse<unknown>>(`${BASE}/api/central-asia/?page_size=1`);

  const articles   = feedState.status  === 'ok' ? feedState.data.results  : [];
  const trending   = trendState.status === 'ok' ? trendState.data.results : [];
  const categories = catState.status   === 'ok' ? catState.data           : [];
  const stats      = statsState.status === 'ok' ? statsState.data         : null;
  const caCount    = caState.status    === 'ok' ? caState.data.count      : null;

  // Barcha sonlar — yangidan eskiga
  const issues = useMemo<ApiIssue[]>(() => {
    if (archState.status !== 'ok') return [];
    return archState.data.flatMap(g => g.issues);
  }, [archState]);

  const current  = issues.find(i => !i.is_upcoming) ?? issues[0] ?? null;
  const featured = articles[0] ?? null;
  const alsoIn   = articles.slice(1, 5);

  // Hero karuseli — Figma'da 4 ta nuqta bor, ya'ni 4 ta yetakchi maqola
  const slides = articles.slice(0, 4);
  const [slide, setSlide] = useState(0);
  const hero = slides[slide] ?? featured;

  useEffect(() => {
    if (slides.length < 2) return;
    const t = setInterval(() => setSlide(i => (i + 1) % slides.length), 7000);
    return () => clearInterval(t);
  }, [slides.length]);

  const go = (d: number) =>
    setSlide(i => (i + d + slides.length) % slides.length);

  // Hero foni — Figma'dagi o'qish zali fotosurati (public/main_ground.png)
  const HERO_BG = '/main_ground.png';

  return (
    <div className="bg-home" style={{ minHeight: '100vh' }}>
      <Seo
        title="Bosh sahifa"
        description="Kutubxona — axborot-kutubxona texnologiyalari ilmiy-amaliy jurnali. Ochiq kirish arxivi."
      />
      <PageLoadBar />
      <Topbar active="home" />

      {/* ═══ 1. Hero ═══ */}
      <section className="hero">
        <div className="hero-photo" style={{ backgroundImage: `url(${HERO_BG})` }} />
        <div className="hero-veil" />

        <div className="wrap hero-inner">
          <div className="hero-eyebrow">
            <span className="eyebrow accent">
              So‘nggi son · {current ? `${current.year} № ${current.number}` : '—'}
              {current?.season ? ` · ${current.season}` : ''}
            </span>
            <span className="hero-rule" />
            <span className="eyebrow" style={{ color: 'rgba(255,255,255,0.5)' }}>
              {current?.date_label || ''}
              {current?.article_count ? ` · ${current.article_count} maqola` : ''}
            </span>
          </div>

          <div className="hero-body">
            <div className="hero-text">
              <h1 className="h-display hero-title">
                {hero?.title ?? 'Ilmiy meros va kelajak raqamli formatda'}
              </h1>
              <p className="hero-lede">
                {hero?.excerpt
                  ? hero.excerpt.slice(0, 150) + (hero.excerpt.length > 150 ? '…' : '')
                  : 'Axborot-kutubxona texnologiyalari bo‘yicha ilmiy-amaliy jurnal. Barcha maqolalar ochiq kirishda.'}
              </p>
              <div className="hero-actions">
                <button className="btn primary"
                  onClick={() => current ? navigate(`/archive/${current.id}`) : navigate('/archive')}>
                  Sonni ochish
                </button>
                {hero && (
                  <button className="btn hero-ghost"
                    onClick={() => navigate(`/articles/${hero.slug}`)}>
                    Yetakchi maqola
                  </button>
                )}
              </div>
            </div>

            <div className="hero-stats">
              <HeroStat n={stats?.articles} label="Maqola" />
              <HeroStat n={stats?.authors}  label="Muallif" />
              <HeroStat n={stats?.issues}   label="Son" />
              <HeroStat n={caCount ?? undefined} label="Central Asia" />
            </div>
          </div>

          {/* Karusel boshqaruvi */}
          {slides.length > 1 && (
            <div className="hero-nav">
              <button className="hero-arrow" onClick={() => go(-1)} aria-label="Oldingi">
                <Chevron dir="left" />
              </button>
              <div className="hero-dots">
                {slides.map((_, i) => (
                  <button key={i} className={i === slide ? 'active' : ''}
                    onClick={() => setSlide(i)} aria-label={`${i + 1}-slayd`} />
                ))}
              </div>
              <button className="hero-arrow" onClick={() => go(1)} aria-label="Keyingi">
                <Chevron dir="right" />
              </button>
            </div>
          )}
        </div>
      </section>

      {/* ═══ 2. So'nggi son + yon panel ═══ */}
      <section className="wrap home-issue">
        <div>
          <div className="section-head">
            <span className="eyebrow">So‘nggi son</span>
            <span className="rule" />
            <span className="meta">
              {current?.date_label}
              {current?.article_count ? ` · ${current.article_count} maqola` : ''}
            </span>
          </div>

          <h2 className="h-display home-issue-title">
            {featured?.title ?? 'Jurnalning so‘nggi soni'}
          </h2>
          <p className="home-issue-lede">
            {current
              ? `Sonning markaziy mavzusi — axborot-kutubxona xizmatlari va mutolaa madaniyati. ${current.article_count} ta maqola, ${current.year} yil ${current.number}-son.`
              : 'Jurnal sonlari arxivda mavjud.'}
          </p>

          <div className="home-issue-actions">
            {current?.pdf_file_url && (
              <a className="btn primary" href={current.pdf_file_url} target="_blank" rel="noreferrer">
                Butun sonni yuklab olish
              </a>
            )}
            {current && <Link className="btn ghost" to={`/archive/${current.id}`}>Mundarija</Link>}
          </div>
        </div>

        <aside className="home-side">
          <div className="side-card">
            <div className="side-card-title">Sondagi yo‘nalishlar</div>
            {categories.slice(0, 5).map(c => (
              <Link key={c.id} to="/articles" className="side-row">
                <span>{c.name}</span>
                <span className="meta">{c.article_count}</span>
              </Link>
            ))}
            {categories.length === 0 && <div className="side-empty">Hozircha yo‘q</div>}
          </div>

          <div className="side-card">
            <div className="side-card-title">Jurnal haqida</div>
            <p className="side-text">
              2019-yildan chiqadigan choraklik nashr. Barcha maqolalar ochiq kirishda —
              o‘qish ham, yuklab olish ham bepul.
            </p>
            <Link to="/about/board" className="side-link">Tahririyat kengashi →</Link>
          </div>
        </aside>
      </section>

      {/* ═══ 3. Sonning yetakchi maqolasi ═══ */}
      {featured && (
        <section className="wrap home-featured">
          <div className="section-head">
            <span className="eyebrow">Sonning yetakchi maqolasi</span>
            <span className="rule" />
          </div>

          <div className="home-featured-grid">
            <Link to={`/articles/${featured.slug}`} className="home-featured-media">
              {/* Yetakchi maqola uchun doimiy foto (public/main_article.png) */}
              <img src="/main_article.png" alt="" />
            </Link>

            <div className="home-featured-meta">
              <div className="eyebrow" style={{ marginBottom: 10 }}>Ushbu maqola</div>
              <span className="tag ok" style={{ marginBottom: 12 }}>Ochiq kirish</span>
              <div className="meta" style={{ lineHeight: 1.8 }}>
                {featured.year} · №&nbsp;{featured.quarter}<br />
                {featured.pages > 0 && <>{featured.pages} bet<br /></>}
                {featured.views.toLocaleString()} ko‘rish
              </div>
              <Link to={`/articles/${featured.slug}`} className="side-link" style={{ marginTop: 14 }}>
                PDF ochish →
              </Link>
            </div>
          </div>

          <h3 className="h-display home-featured-title"
            onClick={() => navigate(`/articles/${featured.slug}`)}>
            {featured.title}
          </h3>
          {featured.excerpt && (
            <blockquote className="home-featured-quote">{featured.excerpt}</blockquote>
          )}
          <div className="meta home-featured-by">
            {featured.authors.map(a => a.name).join(', ') || featured.author_label}
            {featured.min_read ? ` · ${featured.min_read} daq.` : ''}
            {` · ${featured.views.toLocaleString()} ko‘rish`}
          </div>
        </section>
      )}

      {/* ═══ 4. Shu sondan yana ═══ */}
      {alsoIn.length > 0 && (
        <section className="wrap home-also">
          <div className="section-head">
            <span className="eyebrow">Shu sondan yana</span>
            <span className="rule" />
            <Link to="/articles" className="side-link">To‘liq mundarija →</Link>
          </div>

          <div className="art-table">
            {alsoIn.map((a, i) => (
              <article key={a.id} className="art-row" onClick={() => navigate(`/articles/${a.slug}`)}>
                <div className="art-row-num">{String(i + 2).padStart(2, '0')}</div>
                <div className="art-row-body">
                  <div className="art-row-tags">
                    {a.category && <span className="tag cat">{a.category.name}</span>}
                    <span className="tag ok">Ochiq kirish</span>
                  </div>
                  <h3 className="art-row-title h-display">{a.title}</h3>
                  <div className="art-row-authors">
                    {a.authors.map(x => x.name).join(', ') || a.author_label}
                  </div>
                </div>
                <div className="art-row-meta">
                  {a.pages > 0 && <span>{a.pages} b.</span>}
                  <span>{a.views.toLocaleString()} ko‘rish</span>
                  <span className="art-row-pdf">PDF</span>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      {/* ═══ 5. Ko'p o'qilganlar + Yo'nalishlar ═══ */}
      <section className="wrap home-two">
        <div>
          <div className="section-head">
            <span className="eyebrow">Ko‘p o‘qilganlar</span>
            <span className="rule" />
            <span className="meta">12 oy</span>
          </div>

          <div className="top-list">
            {trending.map((a, i) => (
              <Link key={a.id} to={`/articles/${a.slug}`} className="top-row">
                <span className="top-num" data-first={i === 0 ? 'on' : undefined}>
                  {String(i + 1).padStart(2, '0')}
                </span>
                <span className="top-body">
                  <span className="top-title">{a.title}</span>
                  <span className="meta">
                    {a.authors.map(x => x.name).join(', ') || a.author_label}
                    {` · ${a.year} · № ${a.quarter}`}
                  </span>
                </span>
                <span className="meta top-views">{a.views.toLocaleString()}</span>
              </Link>
            ))}
            {trending.length === 0 && <div className="side-empty">Hozircha bo‘sh</div>}
          </div>
        </div>

        <div>
          <div className="section-head">
            <span className="eyebrow">Yo‘nalishlar</span>
            <span className="rule" />
            <Link to="/articles" className="side-link">Barchasi →</Link>
          </div>

          <div className="cat-grid">
            {categories.slice(0, 6).map(c => (
              <Link key={c.id} to="/articles" className="cat-card">
                <span className="cat-card-name">{c.name}</span>
                <span className="cat-card-ghost">{c.article_count}</span>
              </Link>
            ))}
            {categories.length === 0 && <div className="side-empty">Hozircha yo‘q</div>}
          </div>
        </div>
      </section>

      {/* ═══ 6. Arxiv ═══ */}
      {issues.length > 0 && (
        <section className="wrap home-archive">
          <div className="section-head">
            <span className="eyebrow">Arxiv</span>
            <span className="rule" />
            <Link to="/archive" className="side-link">Barcha {issues.length} son →</Link>
          </div>

          <div className="cover-row">
            {issues.slice(0, 6).map(i => (
              <Link key={i.id} to={`/archive/${i.id}`} className="cover-item">
                <div className="cover-box">
                  {i.cover_image_url
                    ? <img src={i.cover_image_url} alt="" />
                    : <JournalCover palette={i.palette} />}
                </div>
                <div className="cover-cap">
                  <span>№{i.number} <span className="meta">{i.year}</span></span>
                  <span className="meta">{i.article_count} maqola</span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ═══ 7. Mualliflarga ═══ */}
      <section className="home-cta">
        <div className="wrap home-cta-inner">
          <div>
            <span className="eyebrow accent">Mualliflarga</span>
            <h2 className="h-display home-cta-title">
              Keyingi songa maqola qabul qilinmoqda
            </h2>
            <p className="home-cta-lede">
              Qo‘lyozmani Telegram bot orqali yuboring — tahririyat 3 ish kuni ichida
              qabulini tasdiqlaydi va taqrizga yo‘naltiradi.
            </p>
            <button className="btn primary"
              onClick={() => window.open('https://t.me/journal_kutubxona_bot', '_blank')}>
              Yuborish formasi
            </button>
          </div>

          <div className="home-cta-steps">
            <Step n="01" title="Talablarni o‘qing"
              text="Qamrov, hajm (8–15 bet), iqtibos uslubi va formatlash qoidalari."
              link="/about/guide" linkLabel="Qo‘llanma" />
            <Step n="02" title="Shablonni yuklang"
              text="Sarlavha, uch tilli annotatsiya, kalit so‘zlar, UDK maydonlari tayyor .docx."
              link="/about/guide" linkLabel="Shablon" />
            <Step n="03" title="Yuboring"
              text="Tahririyat 3 ish kuni ichida qabulni tasdiqlaydi va taqrizga yo‘naltiradi."
              link="/about/policy" linkLabel="Taqriz jarayoni" />
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}

// ── Kichik komponentlar ──────────────────────────────────────────────────────

function Chevron({ dir }: { dir: 'left' | 'right' }) {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none"
      style={{ transform: dir === 'left' ? 'rotate(180deg)' : undefined }}>
      <path d="M6 3l5 5-5 5" stroke="currentColor" strokeWidth="1.6"
        strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function HeroStat({ n, label }: { n?: number; label: string }) {
  return (
    <div className="hero-stat">
      <span className="hero-stat-n">{n ?? '—'}</span>
      <span className="hero-stat-l">{label}</span>
    </div>
  );
}

function Step({ n, title, text, link, linkLabel }: {
  n: string; title: string; text: string; link: string; linkLabel: string;
}) {
  return (
    <div className="cta-step">
      <span className="cta-step-n">{n}</span>
      <span className="cta-step-t">{title}</span>
      <p className="cta-step-x">{text}</p>
      <Link to={link} className="cta-step-l">{linkLabel}</Link>
    </div>
  );
}
