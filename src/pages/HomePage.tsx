import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import Topbar from '../components/layout/Topbar';
import Footer from '../components/layout/Footer';
import PageLoadBar from '../components/ui/PageLoadBar';
import JournalCover from '../components/ui/JournalCover';
import ArticleRow from '../components/article/ArticleRow';
import Seo from '../components/Seo';
import { useFetch } from '../lib/hooks';
import { useI18n, type I18n } from '../lib/i18n';
import {
  authorsLine, issueDate, issueLabel, pageRange,
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
function issueSummary(issue: ApiIssue | null, facets: ApiFacets | null, { t, tn }: I18n): string {
  if (!issue) return t('home.summary.default');
  const rubrics = (facets?.categories ?? []).slice(0, 4).map(c => c.name);
  const count = tn('unit.articles_ta', issue.article_count);
  return rubrics.length
    ? t('home.summary.with_rubrics', { rubrics: rubrics.join(', '), count })
    : t('home.summary.count_only', { count });
}

export default function HomePage() {
  const i18n = useI18n();
  const { t, tn, num, bytes } = i18n;

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
  const summary  = issueSummary(current, issueFacets, i18n);

  // Hero karuseli — Figma'da 4 ta nuqta bor, ya'ni 4 ta yetakchi maqola
  const slides = inIssue.slice(0, 4);
  const [slide, setSlide] = useState(0);
  const hero = slides[slide] ?? featured;

  useEffect(() => {
    if (slides.length < 2) return;
    const timer = setInterval(() => setSlide(i => (i + 1) % slides.length), 7000);
    return () => clearInterval(timer);
  }, [slides.length]);

  const go = (d: number) =>
    setSlide(i => (i + d + slides.length) % slides.length);

  // Hero foni — Figma'dagi o'qish zali fotosurati (public/main_ground.png)
  const HERO_BG = '/main_ground.png';

  const issueMeta = current
    ? [issueDate(current), current.total_pages ? tn('unit.pages', current.total_pages) : '', tn('unit.articles', current.article_count)]
        .filter(Boolean).join(' · ')
    : '';

  return (
    <div className="bg-home" style={{ minHeight: '100vh' }}>
      <Seo
        title={t('nav.home')}
        description={t('home.seo.description')}
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
              {t('home.hero.latest_issue')} · {current ? `${current.year} № ${current.number}` : '—'}
            </span>
            <span className="hero-rule" />
            <span className="eyebrow" style={{ color: 'rgba(255,255,255,0.6)' }}>{issueMeta}</span>
          </div>

          <div className="hero-body">
            <div className="hero-text">
              <h1 className="h-display hero-title">
                {hero?.title ?? t('home.hero.title_default')}
              </h1>
              <p className="hero-lede">{hero?.excerpt ? hero.excerpt.slice(0, 150) + (hero.excerpt.length > 150 ? '…' : '') : summary}</p>
              <div className="hero-actions">
                <Link className="btn primary" to={current ? `/archive/${current.id}` : '/archive'}>
                  {t('home.hero.open_issue')}
                </Link>
                {hero && (
                  <Link className="btn hero-ghost" to={`/articles/${hero.slug}`}>{t('home.hero.featured')}</Link>
                )}
              </div>
            </div>

            <div className="hero-stats">
              <HeroStat n={stats?.articles} label={t('home.stat.articles')} />
              <HeroStat n={stats?.authors}  label={t('home.stat.authors')} />
              <HeroStat n={stats?.issues}   label={t('home.stat.issues')} />
              <HeroStat n={caCount ?? undefined} label={t('nav.central_asia')} />
            </div>
          </div>

          {/* Karusel boshqaruvi */}
          {slides.length > 1 && (
            <div className="hero-nav">
              <button className="hero-arrow" onClick={() => go(-1)} aria-label={t('common.prev')}>
                <Chevron dir="left" />
              </button>
              <div className="hero-dots">
                {slides.map((_, i) => (
                  <button key={i} className={i === slide ? 'active' : ''}
                    onClick={() => setSlide(i)} aria-label={t('home.hero.slide', { n: i + 1 })} />
                ))}
              </div>
              <button className="hero-arrow" onClick={() => go(1)} aria-label={t('common.next')}>
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
            <span className="eyebrow accent">{t('home.hero.latest_issue')}</span>
            <span className="rule" />
            <span className="meta">{issueMeta}</span>
          </div>

          <h2 className="h-display home-issue-title">
            {current ? `${journal} № ${current.number} · ${current.year}` : t('home.issue.latest_default')}
          </h2>
          <p className="home-issue-lede">{summary}</p>

          <div className="home-issue-actions">
            {current?.pdf_file_url && (
              <Link className="btn primary" to={`/archive/${current.id}#pdf`}>
                {t('home.issue.read_full')}{current.pdf_size ? ` · ${bytes(current.pdf_size)}` : ''}
              </Link>
            )}
            {current && <Link className="btn ghost" to={`/archive/${current.id}`}>{t('common.table_of_contents')}</Link>}
          </div>

          {featured && (
            <div className="home-featured">
              <div>
                <div className="eyebrow accent" style={{ marginBottom: 12 }}>{t('home.issue.featured_eyebrow')}</div>
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
                    {[pageRange(featured) && t('unit.pages_abbr', { n: pageRange(featured) }), tn('unit.views', featured.views)].filter(Boolean).join(' · ')}
                  </span>
                </div>
              </div>

              <div className="home-featured-meta">
                <div className="eyebrow" style={{ marginBottom: 10 }}>{t('home.issue.this_article')}</div>
                <span className="tag ok" style={{ marginBottom: 12 }}>{t('common.open_access')}</span>
                <div className="meta" style={{ lineHeight: 1.7 }}>
                  {issueLabel(featured)}
                </div>
                {featured.file_kind && (
                  <Link to={`/articles/${featured.slug}#matn`} className="side-link" style={{ marginTop: 12 }}>
                    {featured.file_kind.toUpperCase()}{featured.file_size ? ` · ${bytes(featured.file_size)}` : ''}
                  </Link>
                )}
              </div>
            </div>
          )}
        </div>

        <aside className="home-side">
          {current && issueFacets && issueFacets.categories.length > 0 && (
            <div className="side-card">
              <div className="side-card-title">{t('home.side.rubrics')}</div>
              {issueFacets.categories.slice(0, 6).map(c => (
                <Link key={c.slug} to={`/articles?issues=${current.id}&categories=${c.slug}`} className="side-row">
                  <span>{c.name}</span>
                  <span className="meta">{c.count}</span>
                </Link>
              ))}
            </div>
          )}

          <div className="side-card side-card-soft">
            <div className="side-card-title">{t('home.side.about_title')}</div>
            <p className="side-text">{t('home.side.about_text')}</p>
            <Link to="/about/board" className="side-link">{t('home.side.board_link')}</Link>
          </div>
        </aside>
      </section>

      {/* ═══ 3. Shu sondan yana ═══ */}
      {alsoIn.length > 0 && (
        <section className="wrap home-also">
          <div className="section-head">
            <span className="eyebrow accent">{t('home.also.eyebrow')}</span>
            <span className="rule" />
            <Link to={current ? `/archive/${current.id}` : '/archive'} className="side-link">{t('home.also.full_toc')}</Link>
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
            <span className="eyebrow accent">{t('home.top.eyebrow')}</span>
            <span className="rule" />
            <span className="meta">{t('home.top.all_time')}</span>
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
                <span className="meta top-views">{num(a.views)}</span>
              </Link>
            ))}
            {trending.length === 0 && <div className="side-empty">{t('home.top.empty')}</div>}
          </div>
        </div>

        {categories.length > 0 && (
          <div>
            <div className="section-head">
              <span className="eyebrow accent">{t('home.cats.eyebrow')}</span>
              <span className="rule" />
              <Link to="/articles" className="side-link">{t('common.all_arrow')}</Link>
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
              <span className="eyebrow accent">{t('home.archive.eyebrow')}</span>
              <span className="rule" />
              <Link to="/archive" className="side-link">{t('home.archive.all', { n: issues.length })}</Link>
            </div>

            <div className="cover-row">
              {issues.slice(0, 6).map(i => (
                <Link key={i.id} to={`/archive/${i.id}`} className="cover-item">
                  <div className="cover-box">
                    {i.cover_image_url
                      ? <img src={mediaUrl(i.cover_image_url) ?? undefined} alt={t('issue.cover_alt', { journal: i.journal_title ?? JOURNAL_NAME, n: i.number, year: i.year })} loading="lazy" />
                      : <JournalCover palette={i.palette} />}
                  </div>
                  <div className="cover-cap">
                    <span className="cover-num">№{i.number} <span className="meta">{i.year}</span></span>
                    <span className="meta">{tn('unit.articles', i.article_count)}</span>
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
            <span className="eyebrow accent">{t('home.cta.eyebrow')}</span>
            <h2 className="h-display home-cta-title">{t('home.cta.title')}</h2>
            <p className="home-cta-lede">{t('home.cta.lede')}</p>
            <a className="btn primary" href={TELEGRAM_BOT_URL} target="_blank" rel="noreferrer">
              {t('home.cta.button')}
            </a>
          </div>

          <div className="home-cta-steps">
            <Step n="01" title={t('home.cta.step1.title')} text={t('home.cta.step1.text')}
              link="/about/guide#qabul" linkLabel={t('home.cta.step1.link')} />
            <Step n="02" title={t('home.cta.step2.title')} text={t('home.cta.step2.text')}
              link="/about/guide#formatlash" linkLabel={t('home.cta.step2.link')} />
            <Step n="03" title={t('home.cta.step3.title')} text={t('home.cta.step3.text')}
              link="/about/policy#taqriz" linkLabel={t('home.cta.step3.link')} />
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
