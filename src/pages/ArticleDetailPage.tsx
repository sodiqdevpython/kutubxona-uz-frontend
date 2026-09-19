import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import Topbar from '../components/layout/Topbar';
import Footer from '../components/layout/Footer';
import PageLoadBar from '../components/ui/PageLoadBar';
import AuthorAvatar from '../components/ui/AuthorAvatar';
import JournalCover from '../components/ui/JournalCover';
import PdfViewer, { isPdf, isDocx } from '../components/ui/PdfViewer';
import CommentsSection from '../components/CommentsSection';
import AskAISection from '../components/article/AskAISection';
import DocxViewer from '../components/article/DocxViewer';
import Seo from '../components/Seo';
import { articlesApi, type ApiArticle, type ApiArticleDetail } from '../lib/api';
import { mediaUrl } from '../lib/config';

/**
 * Maqola sahifasi — Figma «Maqola detail» freymi.
 *
 * Chap ustun: yorliqlar, sarlavha, mualliflar, meta jadval, annotatsiya,
 *             to'liq matn, iqtibos, adabiyotlar, sharhlar, o'xshash maqolalar.
 * O'ng ustun: PDF/ulashish kartasi, chiqqan son, sahifa bo'ylab navigatsiya.
 */

const SECTIONS = [
  { id: 'annotatsiya', label: 'Annotatsiya' },
  { id: 'kalit',       label: "Kalit so‘zlar" },
  { id: 'matn',        label: "To‘liq matn" },
  { id: 'adabiyot',    label: 'Adabiyotlar' },
  { id: 'sharh',       label: 'Sharhlar' },
];

const DOI_RE = /\b(10\.\d{4,9}\/[^\s,;]+)/i;

/** Adabiyotlar matnini qatorlarga ajratadi (har qator — bitta manba). */
function splitRefs(raw: string): string[] {
  return (raw || '')
    .split('\n')
    .map(l => l.replace(/^\s*\d+[.)]\s*/, '').trim())
    .filter(Boolean);
}

export default function ArticleDetailPage() {
  const { slug } = useParams<{ slug: string }>();

  const [article, setArticle] = useState<ApiArticleDetail | null>(null);
  const [related, setRelated] = useState<ApiArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed,  setFailed]  = useState(false);

  const [copied, setCopied] = useState<string | null>(null);
  const [active, setActive] = useState('annotatsiya');
  const [pdfPages, setPdfPages] = useState(0);   // PdfViewer'dan sahifalar soni

  useEffect(() => {
    if (!slug) return;
    setLoading(true); setFailed(false);
    articlesApi.detail(slug)
      .then(d => { setArticle(d); setLoading(false); })
      .catch(() => { setFailed(true); setLoading(false); });
    // O'xshash maqolalar: kalit so'z bo'yicha topilmasa, so'nggilaridan olamiz
    articlesApi.related(slug)
      .then(rs => {
        if (rs.length) { setRelated(rs); return; }
        return articlesApi.list({ page_size: '4' })
          .then(d => setRelated(d.results.filter(x => x.slug !== slug).slice(0, 3)));
      })
      .catch(() => setRelated([]));
    window.scrollTo({ top: 0 });
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

  // Annotatsiya: excerpt bo'sh bo'lsa maqola matnining boshidan olamiz
  const abstract = useMemo(() => {
    if (!article) return '';
    if (article.excerpt?.trim()) return article.excerpt.trim();
    const plain = (article.content || '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    if (plain.length < 80) return '';
    return plain.slice(0, 520) + (plain.length > 520 ? '…' : '');
  }, [article]);
  const refsWithDoi = refs.filter(r => DOI_RE.test(r)).length;

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
        <div className="wrap"><div className="state-box" style={{ marginTop: 40 }}>Yuklanmoqda…</div></div>
        <Footer />
      </div>
    );
  }

  if (failed || !article) {
    return (
      <div className="bg-detail" style={{ minHeight: '100vh' }}>
        <PageLoadBar /><Topbar active="articles" />
        <div className="wrap">
          <div className="state-box" style={{ marginTop: 40 }}>
            Maqola topilmadi. <Link to="/articles" className="side-link">Barcha maqolalar →</Link>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const a = article;
  // Mixed Content'dan himoya: HTTPS sahifada http:// fayl bloklanadi
  const fileUrl = mediaUrl(a.source_file_url);
  const issue = a.issue;

  return (
    <div className="bg-detail" style={{ minHeight: '100vh' }}>
      <Seo title={a.title} description={a.excerpt} image={a.image_url} />
      <PageLoadBar />
      <Topbar active="articles" />

      <div className="wrap" style={{ paddingTop: 26 }}>
        <nav className="crumbs">
          <Link to="/">Bosh sahifa</Link><span>/</span>
          <Link to="/articles">Maqolalar</Link><span>/</span>
          {issue && (
            <><Link to={`/archive/${issue.id}`}>{issue.year} · № {issue.number}</Link><span>/</span></>
          )}
          <span className="cur">{a.title.slice(0, 42)}{a.title.length > 42 ? '…' : ''}</span>
        </nav>
      </div>

      <div className="wrap detail-grid">
        {/* ═══ Chap ustun ═══ */}
        <article className="detail-main">
          <div className="detail-tags">
            {a.category && <span className="pill-cat">{a.category.name}</span>}
            <span className="pill-oa">Ochiq kirish · CC BY 4.0</span>
            <span className="pill-line">Ikki tomonlama ko‘r taqriz</span>
            <span className="meta">Original maqola</span>
          </div>

          <h1 className="h-display detail-title">{a.title}</h1>

          {(a.authors.length > 0 || (a.author_names ?? []).length > 0) && (
            <div className="detail-authors">
              {a.authors.map((au, i) => (
                <div key={au.id} className="detail-author">
                  <AuthorAvatar name={au.initials} idx={au.avatar_idx}
                    src={au.avatar_url} alt={au.name} size={40} />
                  <div>
                    <div className="detail-author-line">
                      <Link to={`/authors/${au.slug}`} className="detail-author-name">{au.name}</Link>
                      {i === 0 && <span className="meta">mas’ul muallif</span>}
                    </div>
                    <div className="detail-author-org">
                      {au.org || 'Tashkilot ko‘rsatilmagan'}{au.role ? ` · ${au.role}` : ''}
                    </div>
                  </div>
                </div>
              ))}

              {a.authors.length === 0 && (a.author_names ?? []).length > 0 && (
                <div className="detail-author">
                  <AuthorAvatar name={(a.author_names[0] ?? 'M').slice(0, 2).toUpperCase()} size={40} />
                  <div>
                    <div className="detail-author-name" style={{ cursor: 'default' }}>
                      {a.author_names.join(', ')}
                    </div>
                    <div className="detail-author-org">Profil biriktirilmagan</div>
                  </div>
                </div>
              )}
            </div>
          )}

          <MetaGrid cells={[
            ['Jurnal',       issue?.journal_title ?? 'Kutubxona'],
            ['Yil / son',    issue ? `${issue.year} · № ${issue.number}` : String(a.year)],
            ['Sahifalar',    a.pages > 0 ? `${a.pages} bet` : ''],
            ['Nashr etildi', issue?.date_label || a.published_at || ''],
            ['Yo‘nalish',    a.category?.name ?? ''],
            ['Statistika',   `${a.views.toLocaleString()} ko‘rish`],
          ]} />

          {abstract && (
            <section id="annotatsiya" className="detail-section">
              <SectionHead title="Annotatsiya" />
              <p className="detail-abstract">{abstract}</p>
            </section>
          )}

          {a.keywords.length > 0 && (
            <section id="kalit" className="detail-section">
              <div className="eyebrow" style={{ marginBottom: 10 }}>
                Kalit so‘zlar — bosilganda qidiruvga o‘tadi
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

          {(fileUrl || a.content) && (
            <section id="matn" className="detail-section">
              <SectionHead title="To‘liq matn"
                right={isPdf(fileUrl) ? (pdfPages ? `PDF · ${pdfPages} bet` : 'PDF') : isDocx(fileUrl) ? 'DOCX' : undefined} />
              {isPdf(fileUrl) && fileUrl
                ? <PdfViewer url={fileUrl} title={a.title} onInfo={i => setPdfPages(i.pages)} />
                : a.content
                  ? <DocxViewer title={a.title} html={a.content} />
                  : <div className="state-box">Fayl mavjud emas.</div>}
            </section>
          )}

          {refs.length > 0 && (
            <section id="adabiyot" className="detail-section">
              <SectionHead title="Adabiyotlar"
                right={`${refs.length} manba${refsWithDoi ? ` · ${refsWithDoi} tasida DOI` : ''}`} />
              <ol className="ref-list">
                {refs.map((r, i) => {
                  const m = r.match(DOI_RE);
                  return (
                    <li key={i}>
                      <span className="ref-n">{i + 1}</span>
                      <span>
                        {m ? r.replace(m[0], '').replace(/[—–-]\s*DOI:?\s*$/i, '').trim() : r}
                        {m && (
                          <a className="ref-doi" href={`https://doi.org/${m[1]}`}
                            target="_blank" rel="noreferrer">doi:{m[1]}</a>
                        )}
                      </span>
                    </li>
                  );
                })}
              </ol>
            </section>
          )}

          {/* CommentsSection o'z sarlavhasini chizadi — takrorlamaymiz */}
          <section id="sharh" className="detail-section">
            <CommentsSection articleId={a.id} />
          </section>

          {related.length > 0 && (
            <section id="oxshash" className="detail-section">
              <SectionHead title="O‘xshash maqolalar" right="kalit so‘z va yo‘nalish bo‘yicha" />
              <div className="rel-grid">
                {related.slice(0, 3).map(r => (
                  <Link key={r.id} to={`/articles/${r.slug}`} className="rel-card">
                    <div className="rel-media">
                      {r.image_url ? <img src={r.image_url} alt="" /> : <div className="home-featured-ph" />}
                    </div>
                    <div className="rel-body">
                      {r.category && <span className="tag cat">{r.category.name}</span>}
                      <span className="rel-title">{r.title}</span>
                      <span className="meta">{r.authors.map(x => x.name).join(', ') || r.author_label}</span>
                      <span className="rel-foot meta">
                        <span>{r.year} · № {r.quarter}</span>
                        <span>{r.views.toLocaleString()}</span>
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </article>

        {/* ═══ O'ng ustun ═══ */}
        <aside className="detail-side rsp-hide">
          <div className="side-card">
            {!fileUrl && (
              <div className="meta" style={{ padding: '6px 0 10px' }}>Fayl biriktirilmagan</div>
            )}

            <button className="btn ghost sm" style={{ width: '100%' }}
              onClick={() => copy(window.location.href, 'link')}>
              {copied === 'link' ? 'Nusxalandi ✓' : 'Ulashish'}
            </button>

            <div className="dl-stats meta">
              <span>{a.views.toLocaleString()} ko‘rish</span>
            </div>
          </div>

          {issue && (
            <Link to={`/archive/${issue.id}`} className="side-card issue-card">
              <div className="issue-cover">
                {issue.cover_image_url
                  ? <img src={issue.cover_image_url} alt="" />
                  : <JournalCover palette={0} />}
              </div>
              <div>
                <div className="eyebrow" style={{ marginBottom: 5 }}>Chiqqan son</div>
                <div className="issue-name">
                  {issue.journal_title ?? 'Kutubxona'} № {issue.number} · {issue.year}
                </div>
                <div className="meta">{issue.season || issue.date_label}</div>
              </div>
            </Link>
          )}

          <div className="side-card">
            <div className="side-card-title">Sahifa bo‘ylab</div>
            <nav className="toc">
              {SECTIONS.map(s => (
                <button key={s.id} className={active === s.id ? 'active' : ''} onClick={() => jump(s.id)}>
                  {s.label}
                  {s.id === 'adabiyot' && refs.length > 0 && ` (${refs.length})`}
                </button>
              ))}
            </nav>
          </div>
        </aside>
      </div>

      {a.ai_ready && <AskAISection slug={a.slug} />}

      <Footer />
    </div>
  );
}

// ── Kichik komponentlar ──────────────────────────────────────────────────────

function SectionHead({ title, right }: { title: string; right?: string }) {
  return (
    <div className="detail-head">
      <h2 className="h-display">{title}</h2>
      {right && <span className="meta">{right}</span>}
    </div>
  );
}

/**
 * Meta jadval — bo'sh qiymatli kataklar tushib qoladi, oxirgi qatorda
 * bo'shliq qolmasligi uchun so'nggi katak qolgan ustunlarni egallaydi.
 */
function MetaGrid({ cells }: { cells: [string, string][] }) {
  const filled = cells.filter(([, v]) => v && v !== '—');
  if (filled.length === 0) return null;

  const cols = Math.min(4, filled.length);
  const rest = filled.length % cols;          // oxirgi qatordagi kataklar soni

  return (
    <div className="detail-meta" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>
      {filled.map(([k, v], i) => {
        const isLast = i === filled.length - 1;
        const span = isLast && rest !== 0 ? cols - rest + 1 : 1;
        return (
          <div key={k} className="meta-cell" style={span > 1 ? { gridColumn: `span ${span}` } : undefined}>
            <span className="meta-cell-k">{k}</span>
            <span className="meta-cell-v">{v}</span>
          </div>
        );
      })}
    </div>
  );
}
