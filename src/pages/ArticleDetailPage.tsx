import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import Topbar from '../components/layout/Topbar';
import Footer from '../components/layout/Footer';
import PageLoadBar from '../components/ui/PageLoadBar';
import AuthorAvatar from '../components/ui/AuthorAvatar';
import JournalCover from '../components/ui/JournalCover';
import PdfViewer from '../components/ui/PdfViewer';
import { isPdf, isDocx } from '../lib/file-kind';
import CommentsSection from '../components/CommentsSection';
import CitationBlock from '../components/article/CitationBlock';
import NotFoundPage from './NotFoundPage';
import AskAISection from '../components/article/AskAISection';
import DocxViewer from '../components/article/DocxViewer';
import MetaGrid from '../components/ui/MetaGrid';
import { EyeIcon } from '../components/ui/Icons';
import Seo, { type CitationMeta } from '../components/Seo';
import { useI18n, type MsgKey } from '../lib/i18n';
import { articlesApi, authorsLine, isRealDate, issueLabel, pageRange, type ApiArticle, type ApiArticleDetail } from '../lib/api';
import { JOURNAL_NAME, mediaUrl } from '../lib/config';
import type { CitationData } from '../lib/citation';

/**
 * Maqola sahifasi — Figma «Maqola detail» freymi.
 *
 * Chap ustun: yorliqlar, sarlavha, mualliflar, meta jadval, annotatsiya,
 *             to'liq matn, iqtibos, adabiyotlar, sharhlar, o'xshash maqolalar.
 * O'ng ustun: PDF/ulashish kartasi, chiqqan son, sahifa bo'ylab navigatsiya.
 */

const SECTIONS: { id: string; label: MsgKey }[] = [
  { id: 'annotatsiya', label: 'article.section.abstract' },
  { id: 'kalit',       label: 'article.section.keywords' },
  { id: 'matn',        label: 'article.section.fulltext' },
  { id: 'iqtibos',     label: 'article.section.cite' },
  { id: 'adabiyot',    label: 'article.section.refs' },
  { id: 'sharh',       label: 'article.section.comments' },
  { id: 'oxshash',     label: 'article.section.related' },
];

/** Adabiyotlar matnini qatorlarga ajratadi (har qator — bitta manba). */
function splitRefs(raw: string): string[] {
  return (raw || '')
    .split('\n')
    .map(l => l.replace(/^\s*\d+[.)]\s*/, '').trim())
    .filter(Boolean);
}

export default function ArticleDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const { t, tn, num, bytes } = useI18n();

  const [article, setArticle] = useState<ApiArticleDetail | null>(null);
  const [related, setRelated] = useState<ApiArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed,  setFailed]  = useState(false);

  const [copied, setCopied] = useState<string | null>(null);
  const [active, setActive] = useState('');
  const [pdfPages, setPdfPages] = useState(0);   // PdfViewer'dan sahifalar soni

  // slug o'zgarsa — holat render vaqtida tozalanadi
  const [seenSlug, setSeenSlug] = useState(slug);
  if (seenSlug !== slug) { setSeenSlug(slug); setLoading(true); setFailed(false); }

  useEffect(() => {
    if (!slug) return;
    articlesApi.detail(slug)
      .then(d => { setArticle(d); setLoading(false); })
      .catch(() => { setFailed(true); setLoading(false); });
    articlesApi.related(slug)
      .then(setRelated)
      .catch(() => setRelated([]));
  }, [slug]);

  // Sahifa bo'ylab: qaysi bo'lim ko'rinib turibdi
  useEffect(() => {
    if (!article) return;
    const obs = new IntersectionObserver(
      entries => {
        const vis = entries.filter(e => e.isIntersecting)
          .sort((x, y) => x.boundingClientRect.top - y.boundingClientRect.top)[0];
        if (vis) setActive(vis.target.id);
      },
      { rootMargin: '-150px 0px -70% 0px', threshold: 0 },
    );
    SECTIONS.forEach(s => {
      const el = document.getElementById(s.id);
      if (el) obs.observe(el);
    });
    return () => obs.disconnect();
  }, [article]);

  const refs = useMemo(() => splitRefs(article?.references ?? ''), [article]);

  // Annotatsiya faqat admin kiritgan bo'lsa ko'rinadi: `content` PDF'ning xom matni,
  // undan olingan parcha annotatsiya emas (sarlavha, jurnal nomi, uzilgan so'zlar).
  const abstract = article?.excerpt?.trim() ?? '';

  function copy(text: string, tag: string) {
    navigator.clipboard?.writeText(text).catch(() => {});
    setCopied(tag);
    setTimeout(() => setCopied(null), 1600);
  }

  function jump(id: string) {
    const el = document.getElementById(id);
    if (!el) return;
    window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 140, behavior: 'smooth' });
  }

  if (loading) {
    return (
      <div className="bg-detail" style={{ minHeight: '100vh' }}>
        <PageLoadBar /><Topbar active="articles" />
        <main id="main" className="page-main">
        <div className="wrap"><div className="state-box" style={{ marginTop: 40 }}>{t('common.loading')}</div></div>
        </main>
        <Footer />
      </div>
    );
  }

  if (failed || !article) return <NotFoundPage />;

  const a = article;
  // Mixed Content'dan himoya: HTTPS sahifada http:// fayl bloklanadi
  const fileUrl = mediaUrl(a.source_file_url);
  const issue = a.issue;
  const journal = issue?.journal_title ?? JOURNAL_NAME;
  // Profilli mualliflar, keyin profilsiz ismlar (takrorlanmasdan)
  const textAuthors = (a.author_names ?? []).filter(n => !a.authors.some(x => x.name.toLowerCase() === n.toLowerCase()));
  const authorNames = [...a.authors.map(x => x.name), ...textAuthors];
  const year = issue?.year ?? a.year;
  const pages = pageRange(a);
  const pageCount = a.pages || (a.page_start && a.page_end ? a.page_end - a.page_start + 1 : 0);
  const fileLabel = [a.file_kind?.toUpperCase(), pdfPages ? tn('unit.pages', pdfPages) : '', bytes(a.file_size)].filter(Boolean).join(' · ');
  const hasText = Boolean(fileUrl || a.content);
  const issueText = issue ? t('issue.year_number', { year: issue.year, n: issue.number }) : String(a.year);

  const citationData: CitationData = {
    title: a.title, authors: authorNames, journal, year,
    number: issue?.number ?? null, pageStart: a.page_start, pageEnd: a.page_end,
    url: window.location.origin + window.location.pathname, slug: a.slug,
  };
  const citationMeta: CitationMeta = [
    ['citation_title', a.title],
    ...authorNames.map((n): [string, string] => ['citation_author', n]),
    ['citation_publication_date', String(year)],
    ['citation_journal_title', journal],
    ...(issue ? [['citation_issue', String(issue.number)] as [string, string]] : []),
    ...(a.page_start ? [['citation_firstpage', String(a.page_start)] as [string, string]] : []),
    ...(a.page_end ? [['citation_lastpage', String(a.page_end)] as [string, string]] : []),
    ...(isPdf(fileUrl) && fileUrl ? [['citation_pdf_url', fileUrl] as [string, string]] : []),
  ];

  // «Sahifa bo'ylab»da faqat sahifada bor bo'limlar
  const present: Record<string, boolean> = {
    annotatsiya: Boolean(abstract), kalit: a.keywords.length > 0, matn: hasText,
    iqtibos: true, adabiyot: refs.length > 0, sharh: true, oxshash: related.length > 0,
  };

  return (
    <div className="bg-detail" style={{ minHeight: '100vh' }}>
      <Seo title={a.title}
        description={a.excerpt || `${authorNames.join(', ')}. ${journal}, ${issueText}.`}
        image={mediaUrl(a.image_url ?? a.issue_cover_url)} citation={citationMeta} />
      <PageLoadBar />
      <Topbar active="articles" />
      <main id="main" className="page-main">

      <div className="wrap" style={{ paddingTop: 26 }}>
        <nav className="crumbs">
          <Link to="/">{t('nav.home')}</Link><span>/</span>
          <Link to="/articles">{t('nav.articles')}</Link><span>/</span>
          {issue && (
            <><Link to={`/archive/${issue.id}`}>{issueText}</Link><span>/</span></>
          )}
          <span className="cur">{a.title.slice(0, 42)}{a.title.length > 42 ? '…' : ''}</span>
        </nav>
      </div>

      <div className="wrap detail-grid">
        {/* ═══ Chap ustun ═══ */}
        <article className="detail-main">
          <div className="detail-tags">
            {a.category && <span className="pill-cat">{a.category.name}</span>}
            <span className="pill-oa">{t('common.open_access_cc')}</span>
            <span className="pill-line">{t('article.peer_review')}</span>
            <span className="meta">{t('article.original')}</span>
          </div>

          <h1 className="h-display detail-title">{a.title}</h1>

          {authorNames.length > 0 && (
            <div className="detail-authors">
              {a.authors.map((au, i) => (
                <div key={au.id} className="detail-author">
                  <AuthorAvatar name={au.initials} idx={au.avatar_idx}
                    src={au.avatar_url} alt={au.name} size={40} />
                  <div>
                    <div className="detail-author-line">
                      <Link to={`/authors/${au.slug}`} className="detail-author-name">{au.name}</Link>
                      {au.orcid && (
                        <a className="orcid-link" href={`https://orcid.org/${au.orcid}`} target="_blank" rel="noreferrer">
                          ORCID {au.orcid}
                        </a>
                      )}
                      {i === 0 && authorNames.length > 1 && <span className="meta">{t('article.corresponding')}</span>}
                    </div>
                    {(au.org || au.role) && (
                      <div className="detail-author-org">
                        {[au.org, au.role].filter(Boolean).join(' · ')}
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {/* Profili yo'q mualliflar — har biri alohida */}
              {textAuthors.map(n => (
                <div key={n} className="detail-author">
                  <AuthorAvatar name={n.split(/\s+/).slice(0, 2).map(w => w[0] ?? '').join('').toUpperCase() || 'M'} size={40} />
                  <div>
                    <div className="detail-author-name" style={{ cursor: 'default' }}>{n}</div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <MetaGrid cells={[
            [t('article.meta.journal'),    journal],
            [t('article.meta.year_issue'), issueText],
            [t('article.meta.pages'),      pages ? `${pages}${pageCount ? ` (${tn('unit.pages', pageCount)})` : ''}` : (pageCount ? tn('unit.pages', pageCount) : '')],
            [t('article.meta.udk'),        a.udk],
            [t('article.meta.category'),   a.category?.name ?? ''],
            [t('article.meta.published'),  isRealDate(issue?.date_label) ? issue?.date_label ?? '' : ''],
            [t('article.meta.stats'),      <ViewsCount n={a.views} label={tn('unit.views', a.views)} />],
          ]} />

          {abstract && (
            <section id="annotatsiya" className="detail-section">
              <SectionHead title={t('article.section.abstract')} />
              <p className="detail-abstract">{abstract}</p>
            </section>
          )}

          {a.keywords.length > 0 && (
            <section id="kalit" className="detail-section">
              <div className="eyebrow" style={{ marginBottom: 10 }}>
                {t('article.keywords_hint')}
              </div>
              <div className="kw-row">
                {a.keywords.map(k => (
                  <Link key={k.slug} to={`/articles?search=${encodeURIComponent(k.name)}`} className="kw">
                    {k.name}
                  </Link>
                ))}
              </div>
            </section>
          )}

        </article>

        {/* ═══ O'ng ustun — faqat sarlavha qismi yonida (Figma), sahifa bo'ylab yopishmaydi ═══ */}
        <aside className="detail-side">
          <div className="side-card">
            {hasText ? (
              <button className="btn primary side-read" onClick={() => jump('matn')}>
                <span>{t('article.read_full')}</span>
                {a.file_size ? <span className="side-read-size">{bytes(a.file_size)}</span> : null}
              </button>
            ) : (
              <div className="meta" style={{ padding: '6px 0 10px' }}>{t('article.no_file')}</div>
            )}

            <div className="side-actions">
              <button className="btn ghost sm" onClick={() => jump('iqtibos')}>{t('article.cite_btn')}</button>
              <button className="btn ghost sm" onClick={() => copy(window.location.href, 'link')}>
                {copied === 'link' ? t('common.Copied') : t('common.share')}
              </button>
            </div>

            <div className="dl-stats meta">
              <ViewsCount n={a.views} label={tn('unit.views', a.views)} />
            </div>
          </div>

          {issue && (
            <Link to={`/archive/${issue.id}`} className="side-card issue-card">
              <div className="issue-cover">
                {issue.cover_image_url
                  ? <img src={mediaUrl(issue.cover_image_url) ?? undefined} alt={t('issue.cover_alt', { journal, n: issue.number, year: issue.year })} />
                  : <JournalCover palette={0} />}
              </div>
              <div>
                <div className="eyebrow" style={{ marginBottom: 5 }}>{t('article.issue_eyebrow')}</div>
                <div className="issue-name">
                  {journal} № {issue.number} · {issue.year}
                </div>
              </div>
            </Link>
          )}

          <div className="side-card toc-card">
            <div className="side-card-title">{t('article.toc_title')}</div>
            <nav className="toc">
              {SECTIONS.filter(s => present[s.id]).map(s => (
                <button key={s.id} className={active === s.id ? 'active' : ''} onClick={() => jump(s.id)}>
                  {t(s.label)}
                  {s.id === 'matn' && a.file_kind ? ` (${a.file_kind.toUpperCase()})` : ''}
                  {s.id === 'adabiyot' && refs.length > 0 && ` (${refs.length})`}
                </button>
              ))}
            </nav>
          </div>
        </aside>
      </div>

      {/* ═══ To'liq matn — butun kenglikda (Figma); keyin adabiyotlar va sharhlar chap ustun kengligida ═══ */}
      <div className="wrap detail-rest">
          {hasText && (
            <section id="matn" className="detail-section detail-full">
              <SectionHead title={t('article.section.fulltext')}
                right={isPdf(fileUrl) || isDocx(fileUrl) ? fileLabel : undefined} />
              {isPdf(fileUrl) && fileUrl
                ? <PdfViewer url={fileUrl} title={a.title} onInfo={i => setPdfPages(i.pages)} />
                : a.content
                  ? <DocxViewer title={a.title} html={a.content} />
                  : <div className="state-box">{t('article.file_missing')}</div>}
            </section>
          )}

        <div className="detail-main">
          <section id="iqtibos" className="detail-section">
            <SectionHead title={t('article.section.cite')} right={t('article.cite_right')} />
            <CitationBlock data={citationData} />
          </section>

          {refs.length > 0 && (
            <section id="adabiyot" className="detail-section">
              <SectionHead title={t('article.section.refs')} right={tn('unit.sources', refs.length)} />
              <ol className="ref-list">
                {refs.map((r, i) => (
                  <li key={i}>
                    <span className="ref-n">{i + 1}</span>
                    <span>{r}</span>
                  </li>
                ))}
              </ol>
            </section>
          )}

          {/* CommentsSection o'z sarlavhasini chizadi — takrorlamaymiz */}
          <section id="sharh" className="detail-section">
            <CommentsSection articleId={a.id} />
          </section>
        </div>

          {related.length > 0 && (
            <section id="oxshash" className="detail-section">
              <SectionHead title={t('article.section.related')} right={t('article.related_right')} />
              <div className="rel-grid">
                {related.slice(0, 3).map(r => (
                  <Link key={r.id} to={`/articles/${r.slug}`} className="rel-card">
                    <div className="rel-media">
                      {r.image_url || r.issue_cover_url
                        ? <img src={mediaUrl(r.image_url ?? r.issue_cover_url) ?? undefined} alt={r.image_url ? r.title : t('issue.cover_alt_short', { label: issueLabel(r) })} className={r.image_url ? undefined : 'is-cover'} loading="lazy" />
                        : <div className="home-featured-ph" />}
                    </div>
                    <div className="rel-body">
                      {r.category && <span className="tag cat">{r.category.name}</span>}
                      <span className="rel-title">{r.title}</span>
                      <span className="meta">{authorsLine(r)}</span>
                      <span className="rel-foot meta">
                        <span>{issueLabel(r)}</span>
                        <span>{num(r.views)}</span>
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}
      </div>

      {a.ai_ready && <AskAISection slug={a.slug} />}

      </main>
      <Footer />
    </div>
  );
}

// ── Kichik komponentlar ──────────────────────────────────────────────────────

/** Ko'rishlar soni: ko'z belgisi + raqam (to'liq yozuv — ekran o'quvchi va title uchun). */
function ViewsCount({ n, label }: { n: number; label: string }) {
  const { num } = useI18n();
  return (
    <span className="views-count" title={label} aria-label={label}>
      <EyeIcon size={15} />
      <span>{num(n)}</span>
    </span>
  );
}

function SectionHead({ title, right }: { title: string; right?: string }) {
  return (
    <div className="detail-head">
      <h2 className="h-display">{title}</h2>
      {right && <span className="meta">{right}</span>}
    </div>
  );
}
