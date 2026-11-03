import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import Topbar from '../components/layout/Topbar';
import Footer from '../components/layout/Footer';
import PageLoadBar from '../components/ui/PageLoadBar';
import JournalCover from '../components/ui/JournalCover';
import ArticleRow from '../components/article/ArticleRow';
import Seo from '../components/Seo';
import { useFetch } from '../lib/hooks';
import {
  authorsLine, formatBytes, issueDate, issueLabel, pageRange,
  type ApiArticle, type ApiCategory, type ApiFacets, type ApiIssue, type ApiYearGroup, type PaginatedResponse,
} from '../lib/api';
import { JOURNAL_NAME, TELEGRAM_BOT_URL, mediaUrl } from '../lib/config';

/**
 * Bosh sahifa — Figma «Asosiy» freymi.
 *
 * Bloklar:
 *   1. Hero — so'nggi son, sarlavha, statistika
 *   2. So'nggi son + yetakchi maqola, yonida sondagi yo'nalishlar va jurnal haqida
 *   3. Shu sondan yana — rasmli raqamlangan ro'yxat
 *   4. Ko'p o'qilganlar + Yo'nalishlar
 *   5. Arxiv — muqovalar qatori
 *   6. Mualliflarga chaqiriq (to'q blok)
 */

const BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:8000';

interface Stats { articles: number; authors: number; issues: number }

/** Son haqidagi jumla faqat haqiqiy ma'lumotdan: rubrikalar va maqolalar soni. */
function issueSummary(issue: ApiIssue | null, facets: ApiFacets | null): string {
  if (!issue) return 'Axborot-kutubxona texnologiyalari bo‘yicha ilmiy-amaliy jurnal. Barcha maqolalar ochiq kirishda.';
  const rubrics = (facets?.categories ?? []).slice(0, 4).map(c => c.name);
  const count = `${issue.article_count} ta maqola`;
  return rubrics.length ? `Bu sonda: ${rubrics.join(', ')}. Jami ${count}.` : `Bu sonda ${count}.`;
}

export default function HomePage() {
  const feedState  = useFetch<PaginatedResponse<ApiArticle>>(`${BASE}/api/articles/?page_size=12`);
  const trendState = useFetch<PaginatedResponse<ApiArticle>>(`${BASE}/api/articles/?ordering=-views&page_size=5`);
  const catState   = useFetch<ApiCategory[]>(`${BASE}/api/categories/`);
  const statsState = useFetch<Stats>(`${BASE}/api/articles/stats/`);
  const archState  = useFetch<ApiYearGroup[]>(`${BASE}/api/issues/archive/`);
  const caState    = useFetch<PaginatedResponse<unknown>>(`${BASE}/api/central-asia/?page_size=1`);

  const articles   = feedState.status  === 'ok' ? feedState.data.results  : [];
  const trending   = trendState.status === 'ok' ? trendState.data.results : [];
  const stats      = statsState.status === 'ok' ? statsState.data         : null;
  const caCount    = caState.status    === 'ok' ? caState.data.count      : null;

  // Eng ko'p maqolali yo'nalishlar birinchi
  const categories = useMemo(() => (
    catState.status === 'ok' ? [...catState.data].sort((x, y) => y.article_count - x.article_count) : []
  ), [catState]);

  // Barcha sonlar — yangidan eskiga
  const issues = useMemo<ApiIssue[]>(() => {
    if (archState.status !== 'ok') return [];
    return archState.data.flatMap(g => g.issues);
  }, [archState]);

  const current = issues.find(i => !i.is_upcoming) ?? issues[0] ?? null;
  const facetState = useFetch<ApiFacets>(current ? `${BASE}/api/articles/facets/?issues=${current.id}` : null);
  const issueFacets = facetState.status === 'ok' ? facetState.data : null;

  const journal = current?.journal_title ?? JOURNAL_NAME;
  const inIssue = current ? articles.filter(a => a.issue_id === current.id) : articles;
  const featured = inIssue[0] ?? articles[0] ?? null;
  const alsoIn   = inIssue.slice(1, 5);
  const summary  = issueSummary(current, issueFacets);

  // Hero karuseli — Figma'da 4 ta nuqta bor, ya'ni 4 ta yetakchi maqola
  const slides = inIssue.slice(0, 4);
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

  const issueMeta = current
    ? [issueDate(current), current.total_pages ? `${current.total_pages} bet` : '', `${current.article_count} maqola`]
        .filter(Boolean).join(' · ')
    : '';

  return (
    <div className="bg-home" style={{ minHeight: '100vh' }}>
      <Seo
        title="Bosh sahifa"
        description="Kutubxona — axborot-kutubxona texnologiyalari ilmiy-amaliy jurnali. Ochiq kirish arxivi."
      />
      <PageLoadBar />
      <Topbar active="home" />
      <main id="main" className="page-main page-main-flush">

      {/* ═══ 1. Hero ═══ */}
      <section className="hero">
        <div className="hero-photo" style={{ backgroundImage: `url(${HERO_BG})` }} />
        <div className="hero-veil" />

        <div className="wrap hero-inner">
          <div className="hero-eyebrow">
            <span className="eyebrow accent">
              So‘nggi son · {current ? `${current.year} № ${current.number}` : '—'}
              {current?.season ? ` · ${current.season.toLowerCase()}` : ''}
            </span>
            <span className="hero-rule" />
            <span className="eyebrow" style={{ color: 'rgba(255,255,255,0.6)' }}>{issueMeta}</span>
          </div>

          <div className="hero-body">
            <div className="hero-text">
              <h1 className="h-display hero-title">
                {hero?.title ?? 'Ilmiy meros va kelajak raqamli formatda'}
              </h1>
              <p className="hero-lede">{hero?.excerpt ? hero.excerpt.slice(0, 150) + (hero.excerpt.length > 150 ? '…' : '') : summary}</p>
              <div className="hero-actions">
                <Link className="btn primary" to={current ? `/archive/${current.id}` : '/archive'}>
                  Sonni ochish
                </Link>
                {hero && (
                  <Link className="btn hero-ghost" to={`/articles/${hero.slug}`}>Yetakchi maqola</Link>
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

      {/* ═══ 2. So'nggi son + yetakchi maqola + yon panel ═══ */}
      <section className="wrap home-issue">
        <div>
          <div className="section-head">
            <span className="eyebrow accent">So‘nggi son</span>
            <span className="rule" />
            <span className="meta">{issueMeta}</span>
          </div>

          <h2 className="h-display home-issue-title">
            {current ? `${journal} № ${current.number} · ${current.year}` : 'Jurnalning so‘nggi soni'}
          </h2>
          <p className="home-issue-lede">{summary}</p>

          <div className="home-issue-actions">
            {current?.pdf_file_url && (
              <Link className="btn primary" to={`/archive/${current.id}#pdf`}>
                Butun sonni o‘qish{current.pdf_size ? ` · ${formatBytes(current.pdf_size)}` : ''}
              </Link>
            )}
            {current && <Link className="btn ghost" to={`/archive/${current.id}`}>Mundarija</Link>}
          </div>

          {featured && (
            <div className="home-featured">
              <div>
                <div className="eyebrow accent" style={{ marginBottom: 12 }}>Sonning yetakchi maqolasi</div>
                <Link to={`/articles/${featured.slug}`} className="home-featured-media">
                  {/* Maqolaning o'z rasmi bo'lmasa — doimiy foto (public/main_article.png) */}
                  <img src={mediaUrl(featured.image_url) ?? '/main_article.png'} alt={featured.title} />
                </Link>
                <h3 className="h-display home-featured-title">
                  <Link to={`/articles/${featured.slug}`}>{featured.title}</Link>
                </h3>
                {featured.excerpt && (
                  <blockquote className="home-featured-quote">{featured.excerpt}</blockquote>
                )}
                <div className="home-featured-by">
                  <span>{authorsLine(featured)}</span>
                  <span className="meta">
                    {[pageRange(featured) && `${pageRange(featured)} b.`, `${featured.views.toLocaleString()} ko‘rish`].filter(Boolean).join(' · ')}
                  </span>
                </div>
              </div>

              <div className="home-featured-meta">
                <div className="eyebrow" style={{ marginBottom: 10 }}>Ushbu maqola</div>
                <span className="tag ok" style={{ marginBottom: 12 }}>Ochiq kirish</span>
                <div className="meta" style={{ lineHeight: 1.7 }}>
                  {issueLabel(featured)}
                  {featured.doi && <><br />DOI {featured.doi}</>}
                </div>
                {featured.file_kind && (
                  <Link to={`/articles/${featured.slug}#matn`} className="side-link" style={{ marginTop: 12 }}>
                    {featured.file_kind.toUpperCase()}{featured.file_size ? ` · ${formatBytes(featured.file_size)}` : ''}
                  </Link>
                )}
              </div>
            </div>
          )}
        </div>

        <aside className="home-side">
          {current && issueFacets && issueFacets.categories.length > 0 && (
            <div className="side-card">
              <div className="side-card-title">Sondagi yo‘nalishlar</div>
              {issueFacets.categories.slice(0, 6).map(c => (
                <Link key={c.slug} to={`/articles?issues=${current.id}&categories=${c.slug}`} className="side-row">
                  <span>{c.name}</span>
                  <span className="meta">{c.count}</span>
                </Link>
              ))}
            </div>
          )}

          <div className="side-card side-card-soft">
            <div className="side-card-title">Jurnal haqida</div>
            <p className="side-text">
              2019-yildan chiqadigan choraklik nashr. Nashr uchun ham, o‘qish uchun ham
              to‘lov olinmaydi.
            </p>
            <Link to="/about/board" className="side-link">Tahririyat kengashi →</Link>
          </div>
        </aside>
      </section>

      {/* ═══ 3. Shu sondan yana ═══ */}
      {alsoIn.length > 0 && (
        <section className="wrap home-also">
          <div className="section-head">
            <span className="eyebrow accent">Shu sondan yana</span>
            <span className="rule" />
            <Link to={current ? `/archive/${current.id}` : '/archive'} className="side-link">To‘liq mundarija →</Link>
          </div>

          <div className="art-list">
            {alsoIn.map((a, i) => <ArticleRow key={a.id} a={a} index={i + 2} thumb />)}
          </div>
        </section>
      )}

      {/* ═══ 4. Ko'p o'qilganlar + Yo'nalishlar ═══ */}
      <section className="wrap home-two">
        <div>
          <div className="section-head">
            <span className="eyebrow accent">Ko‘p o‘qilganlar</span>
            <span className="rule" />
            <span className="meta">barcha vaqt</span>
          </div>

          <div className="top-list">
            {trending.map((a, i) => (
              <Link key={a.id} to={`/articles/${a.slug}`} className="top-row">
                <span className="top-num" data-first={i === 0 ? 'on' : undefined}>
                  {String(i + 1).padStart(2, '0')}
                </span>
                <span className="top-body">
                  <span className="top-title">{a.title}</span>
                  <span className="top-sub">{authorsLine(a)} · {issueLabel(a)}</span>
                </span>
                <span className="meta top-views">{a.views.toLocaleString()}</span>
              </Link>
            ))}
            {trending.length === 0 && <div className="side-empty">Hozircha bo‘sh</div>}
          </div>
        </div>

        {categories.length > 0 && (
          <div>
            <div className="section-head">
              <span className="eyebrow accent">Yo‘nalishlar</span>
              <span className="rule" />
              <Link to="/articles" className="side-link">Barchasi →</Link>
            </div>

            <div className="cat-grid">
              {categories.slice(0, 6).map(c => (
                <Link key={c.id} to={`/articles?categories=${c.slug}`} className="cat-card">
                  <span className="cat-card-name">{c.name}</span>
                  <span className="cat-card-ghost">{c.article_count}</span>
                </Link>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* ═══ 5. Arxiv ═══ */}
      {issues.length > 0 && (
        <section className="home-archive">
          <div className="wrap">
            <div className="section-head">
              <span className="eyebrow accent">Arxiv</span>
              <span className="rule" />
              <Link to="/archive" className="side-link">Barcha {issues.length} son →</Link>
            </div>

            <div className="cover-row">
              {issues.slice(0, 6).map(i => (
                <Link key={i.id} to={`/archive/${i.id}`} className="cover-item">
                  <div className="cover-box">
                    {i.cover_image_url
                      ? <img src={mediaUrl(i.cover_image_url) ?? undefined} alt={`${i.journal_title ?? JOURNAL_NAME} № ${i.number}, ${i.year} muqovasi`} loading="lazy" />
                      : <JournalCover palette={i.palette} />}
                  </div>
                  <div className="cover-cap">
                    <span className="cover-num">№{i.number} <span className="meta">{i.year}</span></span>
                    <span className="meta">{i.article_count} maqola</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ═══ 6. Mualliflarga ═══ */}
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
            <a className="btn primary" href={TELEGRAM_BOT_URL} target="_blank" rel="noreferrer">
              Telegram bot orqali yuborish
            </a>
          </div>

          <div className="home-cta-steps">
            <Step n="01" title="Talablarni o‘qing"
              text="Qamrov, hajm (8–15 bet), annotatsiya va kalit so‘zlar bo‘yicha qabul shartlari."
              link="/about/guide#qabul" linkLabel="Qo‘llanma" />
            <Step n="02" title="Faylni tayyorlang"
              text=".docx yoki .pdf, Times New Roman 14 kegl, adabiyotlar GOST bo‘yicha."
              link="/about/guide#formatlash" linkLabel="Formatlash talablari" />
            <Step n="03" title="Yuboring"
              text="Tahririyat 3 ish kuni ichida qabulni tasdiqlaydi va taqrizga yo‘naltiradi."
              link="/about/policy#taqriz" linkLabel="Taqriz jarayoni" />
          </div>
        </div>
      </section>

      </main>
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
