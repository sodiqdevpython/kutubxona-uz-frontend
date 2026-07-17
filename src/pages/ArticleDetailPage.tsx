import { useRef, useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Topbar from '../components/layout/Topbar';
import PageLoadBar from '../components/ui/PageLoadBar';
import AuthorAvatar, { AvatarStack } from '../components/ui/AuthorAvatar';
import JournalCover from '../components/ui/JournalCover';
import PdfViewer, { isPdf, isDocx } from '../components/ui/PdfViewer';
import CommentsSection from '../components/CommentsSection';
import { CheckIcon, ClockIcon, SparkIcon, SearchIcon, SendIcon, ArrowIcon, EyeIcon } from '../components/ui/Icons';
import { DETAIL_ARTICLE } from '../data';
import { ICON_MAP } from '../components/ui/Icons';
import { articlesApi, type ApiArticle, type ApiArticleDetail } from '../lib/api';
import Seo from '../components/Seo';

const SUGGESTED_QUESTIONS: string[] = [
  "Bu maqola nima haqida?",
  "Asosiy xulosa nima?",
  "Mualliflar kimlar?",
  "Qaysi metod ishlatilgan?",
  "Kalit so'zlar nima?",
  "Adabiyotlar ro'yxatida nimalar bor?",
];

function RDFGraph() {
  return (
    <svg viewBox="0 0 640 240" style={{ width: '100%', height: 'auto', display: 'block' }}>
      <defs>
        <marker id="arr" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto">
          <path d="M0 0 L10 5 L0 10 z" fill="#0A192F" />
        </marker>
      </defs>
      <g>
        <rect x="20" y="40" width="200" height="160" fill="#FFFFFF" stroke="#D5DBE5" strokeDasharray="3 3" rx="6"/>
        <text x="36" y="32" fontFamily="Inter" fontSize="10" fill="#586478" letterSpacing="1.5">KODIKOLOGIYA</text>
      </g>
      <g>
        <rect x="420" y="40" width="200" height="160" fill="#FFFFFF" stroke="#D5DBE5" strokeDasharray="3 3" rx="6"/>
        <text x="436" y="32" fontFamily="Inter" fontSize="10" fill="#586478" letterSpacing="1.5">MATN TARIXI</text>
      </g>
      {[
        { x:120, y:80,  label:'Object',  fill:'#0A192F', fg:'#fff' },
        { x:60,  y:160, label:'Paper',   fill:'#FFFFFF', fg:'#0A192F' },
        { x:180, y:160, label:'Script',  fill:'#FFFFFF', fg:'#0A192F' },
        { x:520, y:80,  label:'Witness', fill:'#0A192F', fg:'#fff' },
        { x:460, y:160, label:'Work',    fill:'#FFFFFF', fg:'#0A192F' },
        { x:580, y:160, label:'Author',  fill:'#FFFFFF', fg:'#0A192F' },
      ].map((n, i) => (
        <g key={i}>
          <rect x={n.x - 44} y={n.y - 16} width="88" height="32" rx="16" fill={n.fill} stroke="#0A192F"/>
          <text x={n.x} y={n.y + 4} fontFamily="Inter" fontSize="11" fill={n.fg} textAnchor="middle" fontWeight="600">{n.label}</text>
        </g>
      ))}
      <g stroke="#0A192F" strokeWidth="1" fill="none">
        <line x1="120" y1="96" x2="60"  y2="144" markerEnd="url(#arr)"/>
        <line x1="120" y1="96" x2="180" y2="144" markerEnd="url(#arr)"/>
        <line x1="520" y1="96" x2="460" y2="144" markerEnd="url(#arr)"/>
        <line x1="520" y1="96" x2="580" y2="144" markerEnd="url(#arr)"/>
      </g>
      <g>
        <line x1="164" y1="80" x2="476" y2="80" stroke="#0A192F" strokeWidth="1.6" markerEnd="url(#arr)"/>
        <rect x="280" y="64" width="80" height="22" rx="11" fill="#F5F7FA" stroke="#0A192F"/>
        <text x="320" y="79" fontFamily="Inter" fontSize="9.5" fill="#0A192F" textAnchor="middle">km:witnesses</text>
      </g>
    </svg>
  );
}

type Msg = { who: 'ai' | 'user'; name: string; src: string | null; text: string };

function AskAISection({ slug }: { slug: string }) {
  const seed: Msg[] = [{ who: 'ai', name: 'Kutubxona AI', src: null, text: "Salom! Men ushbu maqolaning to'liq matnini o'qib chiqdim. Pastdagi tayyor savollardan birini bosing yoki o'zingiz yozing — javobni maqola ichidan topib beraman." }];
  const [msgs, setMsgs] = useState<Msg[]>(seed);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const logRef = useRef<HTMLDivElement>(null);
  const asked = msgs.filter(m => m.who === 'user').length;

  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [msgs, typing]);

  async function ask(text: string) {
    const q = text.trim();
    if (!q || typing) return;
    setInput('');
    setMsgs(m => [...m, { who: 'user', name: "Anonim o'quvchi", src: null, text: q }]);
    setTyping(true);
    try {
      const res = await articlesApi.ask(slug, q);
      setMsgs(m => [...m, { who: 'ai', name: 'Kutubxona AI', src: null, text: res.answer }]);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      let nice = "Hozir javob ololmadim. Iltimos, biroz kutib qayta urinib ko'ring.";
      if (/429/.test(msg)) nice = "Juda tez-tez savol berayapsiz. Bir oz kuting va qaytadan urinib ko'ring.";
      else if (/400/.test(msg)) nice = "Bu maqola uchun manba fayl mavjud emas yoki savol noto'g'ri.";
      setMsgs(m => [...m, { who: 'ai', name: 'Kutubxona AI', src: null, text: nice }]);
    } finally {
      setTyping(false);
    }
  }

  return (
    <section className="bg-ai" style={{ padding: '72px 0 80px', position: 'relative', borderTop: '1px solid var(--line)', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', left: '8%', top: '14%', width: 420, height: 420, borderRadius: '50%', background: 'radial-gradient(circle,rgba(43,70,112,0.14),transparent 70%)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', right: '4%', bottom: '8%', width: 340, height: 340, borderRadius: '50%', background: 'radial-gradient(circle,rgba(94,117,149,0.22),transparent 70%)', pointerEvents: 'none' }} />
      <div style={{ maxWidth: 1340, margin: '0 auto', padding: '0 var(--px)', position: 'relative' }}>
        <header style={{ textAlign: 'center', marginBottom: 36 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '7px 14px', borderRadius: 20, background: 'linear-gradient(135deg,#2B4670,#0A192F)', color: 'white', fontSize: 11.5, fontWeight: 600, letterSpacing: 0.2, textTransform: 'uppercase', marginBottom: 18, boxShadow: '0 6px 18px -8px rgba(10,25,47,0.40)' }}>
            <SparkIcon size={13} /> Kutubxona AI · Beta
          </div>
          <h2 className="h-display" style={{ fontSize: 44, lineHeight: 1.05, letterSpacing: '-0.025em', marginBottom: 14 }}>Bu maqola <em>haqida</em> so'rang.</h2>
          <p style={{ fontSize: 15.5, lineHeight: 1.6, color: 'var(--ink-3)', maxWidth: 640, margin: '0 auto' }}>Tayyor savolni bosing yoki o'zingiz yozing — AI javobni shu maqola matnidan topib, aniq paragrafga havola qiladi.</p>
        </header>
        <div style={{ background: 'var(--paper)', border: '1px solid var(--line)', borderRadius: 12, boxShadow: '0 28px 60px -28px rgba(10,25,47,0.26),0 4px 12px rgba(10,25,47,0.05)', overflow: 'hidden' }}>
          {/* Chat header */}
          <div style={{ padding: '16px 22px', borderBottom: '1px solid var(--line)', background: 'linear-gradient(180deg,var(--grey-1),var(--paper))', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 38, height: 38, borderRadius: 8, background: 'linear-gradient(135deg,#2B4670,#0A192F)', display: 'grid', placeItems: 'center', color: 'white', boxShadow: '0 4px 12px -4px rgba(10,25,47,0.40)' }}><SparkIcon size={16} /></div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink)', display: 'flex', alignItems: 'center', gap: 8 }}>Kutubxona AI <span className="live-dot" /></div>
                <div style={{ fontSize: 11.5, color: 'var(--ink-3)', marginTop: 2 }}>Maqola matni indekslandi</div>
              </div>
            </div>
            <span className="tag navy-soft">Faqat shu maqola</span>
          </div>
          {/* Messages */}
          <div ref={logRef} style={{ padding: '26px 28px 18px', display: 'flex', flexDirection: 'column', gap: 20, maxHeight: 380, overflowY: 'auto' }}>
            {msgs.map((m, i) => (
              <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                <div style={{ width: 30, height: 30, borderRadius: '50%', flexShrink: 0, background: m.who === 'ai' ? 'linear-gradient(135deg,#2B4670,#0A192F)' : 'var(--grey-3)', color: m.who === 'ai' ? 'white' : 'var(--ink-3)', display: 'grid', placeItems: 'center' }}>
                  {m.who === 'ai' ? <SparkIcon size={14} /> : <span style={{ fontSize: 11, fontWeight: 600 }}>A</span>}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 6 }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink)' }}>{m.name}</span>
                    {m.src && <span style={{ fontSize: 10, color: 'var(--navy)', fontFamily: 'var(--mono)', background: 'var(--navy-08)', padding: '2px 6px', borderRadius: 3, fontWeight: 600 }}>Manba: {m.src}</span>}
                  </div>
                  <div style={{ fontSize: 13.5, lineHeight: 1.65, color: 'var(--ink-2)', background: m.who === 'ai' ? 'var(--grey-2)' : 'transparent', padding: m.who === 'ai' ? '12px 14px' : 0, borderRadius: m.who === 'ai' ? 10 : 0, border: m.who === 'ai' ? '1px solid var(--line)' : 'none', maxWidth: '95%' }}>{m.text}</div>
                </div>
              </div>
            ))}
            {typing && (
              <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                <div style={{ width: 30, height: 30, borderRadius: '50%', flexShrink: 0, background: 'linear-gradient(135deg,#2B4670,#0A192F)', color: 'white', display: 'grid', placeItems: 'center' }}><SparkIcon size={14} /></div>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: 'var(--grey-2)', border: '1px solid var(--line)', borderRadius: 10, padding: '13px 16px' }}>
                  {[0,1,2].map(i => <span key={i} style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--navy-50)', display: 'inline-block', animation: `typingDot 1.2s ${i*0.18}s infinite ease-in-out` }} />)}
                </div>
              </div>
            )}
          </div>
          {/* Suggested questions */}
          <div style={{ padding: '4px 22px 14px', borderTop: '1px solid var(--line)' }}>
            <div style={{ fontSize: 11, color: 'var(--ink-4)', fontWeight: 600, letterSpacing: 0.14, textTransform: 'uppercase', margin: '12px 2px 10px' }}>Tayyor savollar — bosing</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {SUGGESTED_QUESTIONS.map((q, i) => {
                const Ic = ICON_MAP['doc'];
                return (
                  <button key={i} className="ai-pill" onClick={() => ask(q)} disabled={typing}>
                    <span className="ai-pill-icon"><Ic size={12} /></span>
                    <span>{q}</span>
                  </button>
                );
              })}
            </div>
          </div>
          {/* Input */}
          <div style={{ padding: '14px 22px 22px', borderTop: '1px solid var(--line)', background: 'linear-gradient(180deg,var(--grey-1) 0%,var(--paper) 100%)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '4px 4px 4px 16px', background: 'var(--paper)', border: '1px solid var(--line-2)', borderRadius: 28, boxShadow: '0 2px 8px rgba(10,25,47,0.06)' }}>
              <SearchIcon size={14} style={{ color: 'var(--ink-4)', flexShrink: 0 }} />
              <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') ask(input); }}
                placeholder="Maqola bo'yicha o'z savolingizni yozing…"
                style={{ flex: 1, border: 0, outline: 0, background: 'transparent', fontFamily: 'var(--sans)', fontSize: 14, color: 'var(--ink)', padding: '12px 0' }} />
              <button onClick={() => ask(input)} disabled={typing || !input.trim()} style={{ height: 40, padding: '0 18px', borderRadius: 20, background: (typing || !input.trim()) ? 'var(--navy-30)' : 'linear-gradient(135deg,#2B4670,#0A192F)', color: 'white', border: 0, cursor: (typing || !input.trim()) ? 'default' : 'pointer', display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 600, fontFamily: 'var(--sans)', boxShadow: (typing || !input.trim()) ? 'none' : '0 6px 16px -6px rgba(10,25,47,0.50)' }}>
                So'rash <SendIcon size={13} />
              </button>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 12, fontSize: 11.5, color: 'var(--ink-4)' }}>
              <span>Javoblar faqat ushbu maqola matni doirasida beriladi.</span>
              <span>{asked} ta savol berildi · Enter — yuborish</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ── DOCX Viewer (PDF kabi, lekin server'da mammoth parse qilgan HTML ni o'qiydi) ─

const DOCX_ZOOM_STEPS = [80, 90, 100, 115, 130, 150, 175];

function DocxViewer({ title, html }: { title: string; html: string }) {
  const [fullscreen, setFullscreen] = useState(false);
  const [zoomIdx,    setZoomIdx]    = useState(2);   // 100% default

  const zoom = DOCX_ZOOM_STEPS[zoomIdx];

  useEffect(() => {
    if (!fullscreen) return;
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') setFullscreen(false); }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [fullscreen]);

  const zoomOut = () => setZoomIdx(i => Math.max(0, i - 1));
  const zoomIn  = () => setZoomIdx(i => Math.min(DOCX_ZOOM_STEPS.length - 1, i + 1));

  return (
    <div style={{
      position: fullscreen ? 'fixed' : 'relative',
      inset: fullscreen ? 0 : undefined,
      zIndex: fullscreen ? 1000 : undefined,
      background: fullscreen ? 'rgba(10,25,47,0.92)' : 'transparent',
      padding: fullscreen ? '24px' : 0,
      display: 'flex', flexDirection: 'column',
      marginBottom: 32,
    }}>
      {/* Toolbar */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        gap: 10, padding: '12px 16px',
        background: fullscreen ? 'var(--navy)' : 'var(--grey-2)',
        border: `1px solid ${fullscreen ? 'rgba(255,255,255,0.12)' : 'var(--line)'}`,
        borderBottom: 'none',
        borderTopLeftRadius: 10, borderTopRightRadius: 10,
        color: fullscreen ? 'white' : 'var(--ink-2)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M14 2v6h6M9 13h6M9 17h6M9 9h2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span style={{
            fontSize: 12.5, fontWeight: 600,
            overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis',
            fontFamily: 'var(--sans)',
          }}>
            DOCX · {title}
          </span>
        </div>
        <div style={{ display: 'flex', gap: 6, flexShrink: 0, alignItems: 'center' }}>
          <div style={{
            display: 'flex', alignItems: 'center',
            border: `1px solid ${fullscreen ? 'rgba(255,255,255,0.18)' : 'var(--line-2)'}`,
            borderRadius: 6, overflow: 'hidden',
          }}>
            <button onClick={zoomOut} disabled={zoomIdx === 0} title="Kichraytirish"
              style={{ width: 30, height: 30, border: 0, background: 'transparent', color: 'inherit',
                cursor: zoomIdx === 0 ? 'not-allowed' : 'pointer', fontSize: 16, lineHeight: 1,
                opacity: zoomIdx === 0 ? 0.4 : 1, fontFamily: 'var(--sans)' }}>−</button>
            <span style={{ minWidth: 50, textAlign: 'center', fontSize: 11.5, fontWeight: 600,
              fontFamily: 'var(--mono)', padding: '0 4px',
              borderLeft:  `1px solid ${fullscreen ? 'rgba(255,255,255,0.18)' : 'var(--line-2)'}`,
              borderRight: `1px solid ${fullscreen ? 'rgba(255,255,255,0.18)' : 'var(--line-2)'}` }}>{zoom}%</span>
            <button onClick={zoomIn} disabled={zoomIdx === DOCX_ZOOM_STEPS.length - 1} title="Kattalashtirish"
              style={{ width: 30, height: 30, border: 0, background: 'transparent', color: 'inherit',
                cursor: zoomIdx === DOCX_ZOOM_STEPS.length - 1 ? 'not-allowed' : 'pointer',
                fontSize: 16, lineHeight: 1,
                opacity: zoomIdx === DOCX_ZOOM_STEPS.length - 1 ? 0.4 : 1,
                fontFamily: 'var(--sans)' }}>+</button>
          </div>

          <button onClick={() => setFullscreen(p => !p)} title={fullscreen ? 'Yopish' : 'Kengaytirish'}
            style={{ height: 30, padding: '0 12px', borderRadius: 6,
              border: `1px solid ${fullscreen ? 'rgba(255,255,255,0.18)' : 'var(--line-2)'}`,
              background: fullscreen ? 'rgba(255,255,255,0.08)' : 'var(--paper)',
              color: 'inherit', fontSize: 12, fontWeight: 600,
              cursor: 'pointer', fontFamily: 'var(--sans)' }}>
            {fullscreen ? '✕ Yopish' : '⛶ Kengaytirish'}
          </button>
        </div>
      </div>

      {/* Reader — sahifa ko'rinishidagi konteyner, parsed HTML */}
      <div style={{
        background: 'var(--paper)',
        border: `1px solid ${fullscreen ? 'rgba(255,255,255,0.12)' : 'var(--line)'}`,
        borderTop: 'none',
        borderBottomLeftRadius: 10, borderBottomRightRadius: 10,
        height: fullscreen ? 'calc(100vh - 110px)' : 720,
        overflowY: 'auto',
        padding: '40px clamp(20px, 6%, 64px)',
      }}>
        <div
          className="article-content"
          dangerouslySetInnerHTML={{ __html: html }}
          style={{
            fontSize: 16 * (zoom / 100),
            lineHeight: 1.75,
            color: 'var(--ink-2)',
            letterSpacing: '-0.003em',
            maxWidth: 820,
            margin: '0 auto',
          }}
        />
      </div>

    </div>
  );
}

export default function ArticleDetailPage() {
  const navigate = useNavigate();
  const { slug } = useParams<{ slug: string }>();
  const [apiArticle, setApiArticle] = useState<ApiArticleDetail | null>(null);
  const [apiLoading, setApiLoading] = useState(true);
  const [related,    setRelated]    = useState<ApiArticle[]>([]);

  useEffect(() => {
    if (!slug) { setApiLoading(false); return; }
    setApiLoading(true);
    window.scrollTo({ top: 0 });
    articlesApi.detail(slug)
      .then(d => { setApiArticle(d); setApiLoading(false); })
      .catch(() => setApiLoading(false));
    articlesApi.related(slug)
      .then(setRelated)
      .catch(() => setRelated([]));
  }, [slug]);

  const a = DETAIL_ARTICLE;

  // Muallif noma'lum bo'lishi tabiiy holat — bunda muallif bloki umuman ko'rsatilmaydi.
  const showAuthor = !apiArticle || apiArticle.authors.length > 0 || apiArticle.author_names.length > 0;

  return (
    <div className="bg-detail" style={{ minHeight: '100vh' }}>
      <Seo
        title={apiArticle?.title}
        description={apiArticle?.excerpt}
        image={apiArticle?.image_url}
      />
      <PageLoadBar />
      <Topbar active="articles" />

      {/* Breadcrumbs */}
      <div style={{ padding: '16px var(--px)', background: 'var(--grey-1)', borderBottom: '1px solid var(--line)', fontSize: 12.5, color: 'var(--ink-3)' }}>
        <div style={{ maxWidth: 1340, margin: '0 auto', display: 'flex', alignItems: 'center', gap: 10 }}>
          <a onClick={() => navigate('/')} style={{ color: 'var(--ink-3)', cursor: 'pointer' }}>Bosh sahifa</a>
          <span style={{ color: 'var(--ink-4)' }}>/</span>
          <a onClick={() => navigate('/articles')} style={{ color: 'var(--ink-3)', cursor: 'pointer' }}>Maqolalar</a>
          <span style={{ color: 'var(--ink-4)' }}>/</span>
          <a style={{ color: 'var(--ink-3)', cursor: 'pointer' }}>Arxiv ishi</a>
          <span style={{ color: 'var(--ink-4)' }}>/</span>
          <span style={{ color: 'var(--ink)', fontWeight: 500 }}>{a.title}</span>
        </div>
      </div>

      <div className="rsp-detail" style={{ padding: '48px var(--px) 32px', maxWidth: 1340, margin: '0 auto' }}>
        {/* Article body */}
        <article>
          <header style={{ marginBottom: 36 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 22 }}>
              <span className="tag navy">{apiArticle?.category?.name ?? 'Arxiv ishi'}</span>
              {(apiArticle?.status ?? 'open') === 'open'
                ? <span className="tag ok"><CheckIcon size={10} /> Ochiq kirish</span>
                : <span className="tag line">Obunachi</span>
              }
              <span className="tag line">Taqriz qilingan</span>
            </div>
            <h1 className="h-display h1-rsp" style={{ fontSize: 52, lineHeight: 1.05, letterSpacing: '-0.025em', marginBottom: 22 }}>
              {apiArticle?.title ?? a.title}
            </h1>
            {/* Subtitle (excerpt) — pastda "Annotatsiya" bloki bor, bu yerda takrorlamaymiz */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 14, paddingTop: 22, paddingBottom: 22, borderTop: '1px solid var(--line)', borderBottom: '1px solid var(--line)' }}>
              {showAuthor ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  {apiArticle
                    ? (apiArticle.authors[0]
                        ? <AuthorAvatar name={apiArticle.authors[0].initials} idx={apiArticle.authors[0].avatar_idx} size={40} />
                        : <AuthorAvatar name={(apiArticle.author_names[0] ?? 'M')[0]} idx={0} size={40} />)
                    : <AvatarStack authors={a.authors} size={40} />
                  }
                  <div>
                    {/* AI ajratgan mualliflar (maqola ichidagi) — matn */}
                    <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--ink)' }}>
                      {apiArticle
                        ? (apiArticle.author_names.length > 0
                            ? apiArticle.author_names.join(', ')
                            : apiArticle.author_label)
                        : a.authorLabel}
                    </div>
                    {/* Yuborgan (profil egasi) */}
                    {apiArticle?.authors[0] && (
                      <div style={{ fontSize: 12, color: 'var(--ink-3)', marginTop: 2 }}>
                        Yuborgan:{' '}
                        <a onClick={() => navigate(`/authors/${apiArticle.authors[0].slug}`)}
                          style={{ color: 'var(--navy)', cursor: 'pointer', fontWeight: 500 }}>
                          {apiArticle.authors[0].name}
                        </a>
                      </div>
                    )}
                    {!apiArticle && (
                      <div style={{ fontSize: 12, color: 'var(--ink-3)', marginTop: 2 }}>{a.authorOrg}</div>
                    )}
                  </div>
                </div>
              ) : (
                <div style={{ fontSize: 13, color: 'var(--ink-3)', fontStyle: 'italic' }}>Muallifi noma'lum</div>
              )}
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{ fontSize: 12, color: 'var(--ink-3)', textAlign: 'right' }}>
                  <div>{apiArticle?.published_at ?? a.date}</div>
                  {apiArticle && (
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
                      <EyeIcon size={11} /> {apiArticle.views.toLocaleString()} ko'rish
                    </div>
                  )}
                </div>
              </div>
            </div>
          </header>

          {/* Loading skeleton */}
          {apiLoading && (
            <div style={{ padding: '48px 0', textAlign: 'center', color: 'var(--ink-4)', fontSize: 14 }}>
              Yuklanmoqda…
            </div>
          )}

          {/* API article body — abstract + PDF viewer (rasm yo'q) */}
          {!apiLoading && apiArticle && (
            <>
              {/* Abstract */}
              {apiArticle.excerpt && (
                <section style={{ marginBottom: 28, padding: '24px 28px', background: 'var(--grey-2)', borderRadius: 12, borderLeft: '3px solid var(--navy)' }}>
                  <div className="eyebrow" style={{ marginBottom: 10 }}>Annotatsiya</div>
                  <p style={{ fontSize: 14.5, lineHeight: 1.7, color: 'var(--ink-2)', margin: 0 }}>
                    {apiArticle.excerpt}
                  </p>
                </section>
              )}

              {/* Viewer — fayl turiga qarab PDF iframe yoki DOCX reader (parsed HTML) */}
              {isPdf(apiArticle.source_file_url) ? (
                <PdfViewer url={apiArticle.source_file_url!} title={apiArticle.title} />
              ) : isDocx(apiArticle.source_file_url) && apiArticle.content ? (
                <DocxViewer
                  title={apiArticle.title}
                  html={apiArticle.content}
                />
              ) : apiArticle.content ? (
                /* Fayl yo'q yoki noma'lum format — parsed HTML ni oddiy ko'rinishda */
                <div
                  className="article-content"
                  dangerouslySetInnerHTML={{ __html: apiArticle.content }}
                  style={{ fontSize: 16, lineHeight: 1.75, color: 'var(--ink-2)', letterSpacing: '-0.003em' }}
                />
              ) : (
                <div style={{ padding: '48px 0', textAlign: 'center', color: 'var(--ink-4)', fontSize: 14, fontStyle: 'italic' }}>
                  Maqola matni hozirgacha yuklanmagan.
                </div>
              )}
            </>
          )}

          {/* Static demo content — shown only when no API article (demo slug "a1") */}
          {!apiLoading && !apiArticle && (<>
          {/* Abstract */}
          <section style={{ marginBottom: 32, padding: '24px 28px', background: 'var(--grey-2)', borderRadius: 12, borderLeft: '3px solid var(--navy)' }}>
            <div className="eyebrow" style={{ marginBottom: 10 }}>Annotatsiya</div>
            <p style={{ fontSize: 14.5, lineHeight: 1.7, color: 'var(--ink-2)', margin: 0 }}>
              Sharq qo'lyozmalarini kataloglashda klassik bibliografik tavsif standartlari paleografik va kodikologik tafsilotlarni to'la qamrab ololmaydi. Ushbu maqolada O'zbekiston Milliy kutubxonasi fondidagi 12,840 ta qo'lyozma materialining RDF/SKOS asosidagi tasniflash modeli, bu modelni amalga oshirish jarayoni va dastlabki natijalar muhokama qilinadi.
            </p>
          </section>

          <h2 className="h-display" style={{ fontSize: 32, marginTop: 36, marginBottom: 18, letterSpacing: '-0.02em', display: 'flex', alignItems: 'baseline', gap: 14 }}>
            <span style={{ fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: 15, color: 'var(--navy-50)', fontWeight: 400 }}>§1</span>Kirish
          </h2>
          {['O\'zbekiston Milliy kutubxonasining Sharq qo\'lyozmalari fondi mamlakatdagi eng yirik majmualardan biri bo\'lib, XII asrdan boshlanuvchi va Buxoro, Samarqand, Xiva hamda Toshkent madrasalarida bitilgan o\'n ikki ming sakkiz yuz qirq nusxani o\'z ichiga oladi.', "Ushbu fondning tavsifi hozirgacha 1979-yilda tuzilgan tipografik katalogga asoslanib kelgan. Mazkur katalogning hajmi (yetti tom) va batafsilligi ko'p hollarda yetarli bo'lsa-da, raqamli qidiruv, taqqoslash va kross-referent tahlil imkoniyatlarini umuman ta'minlamaydi."].map((t, i) => (
            <p key={i} style={{ fontSize: 16, lineHeight: 1.75, color: 'var(--ink-2)', marginBottom: 18, fontFamily: 'var(--sans)', letterSpacing: '-0.003em' }}>{t}</p>
          ))}

          <blockquote className="article-bleed" style={{ margin: '40px -8px', padding: '28px 32px', borderLeft: '3px solid var(--navy)', background: 'var(--paper)' }}>
            <p style={{ fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: 24, lineHeight: 1.4, letterSpacing: '-0.015em', color: 'var(--ink)', margin: 0 }}>
              "Raqamli katalog — bu kitobning aksi emas, balki uning o'qiluvchi muhitining xaritasidir."
            </p>
            <footer style={{ marginTop: 14, fontSize: 12, color: 'var(--ink-3)', letterSpacing: 0.04 }}>— A. Yusupov, Konferensiya hisoboti, 2024</footer>
          </blockquote>

          <h2 className="h-display" style={{ fontSize: 32, marginTop: 36, marginBottom: 18, letterSpacing: '-0.02em', display: 'flex', alignItems: 'baseline', gap: 14 }}>
            <span style={{ fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: 15, color: 'var(--navy-50)', fontWeight: 400 }}>§2</span>Avvalgi tajribalar
          </h2>
          {["Sharq qo'lyozmalarini elektron tasniflash bo'yicha birinchi yirik tajriba 2003-yilda Tehron Markaziy kutubxonasida amalga oshirilgan bo'lib, MARC21 standartining mahalliylashtirilgan varianti asos qilib olingan. Keyinchalik Istanbul Süleymaniye, Qohira Dar al-Kutub va Dehli Khuda Bakhsh kutubxonalarida ham shu yo'l takrorlandi.", "Bizning kuzatuvlarimiz shuni ko'rsatdiki, MARC21 ramkasi paleografik (xat turi, siyoh kompozitsiyasi), kodikologik (qog'oz turi, varaqlash tartibi) va matn-tarixiy (qiyosiy nusxalar, sharhlar) maydonlarni to'liq tasvirlashda chegaralangan."].map((t, i) => (
            <p key={i} style={{ fontSize: 16, lineHeight: 1.75, color: 'var(--ink-2)', marginBottom: 18, fontFamily: 'var(--sans)', letterSpacing: '-0.003em' }}>{t}</p>
          ))}

          {/* Figure */}
          <figure className="article-bleed" style={{ margin: '36px -8px 36px' }}>
            <div style={{ background: 'var(--grey-2)', border: '1px solid var(--line)', borderRadius: 12, padding: 28, position: 'relative' }}>
              <div style={{ position: 'absolute', top: 14, right: 18, fontSize: 10.5, color: 'var(--ink-4)', fontFamily: 'var(--mono)', letterSpacing: 0.3 }}>FIG. 1</div>
              <RDFGraph />
            </div>
            <figcaption style={{ marginTop: 14, fontSize: 12.5, color: 'var(--ink-3)', lineHeight: 1.6 }}>
              <span style={{ fontWeight: 600, color: 'var(--ink-2)' }}>1-rasm.</span> Kodikologik va matn-tarixiy graflarning RDF dagi bog'lanish sxemasi.
            </figcaption>
          </figure>

          <h2 className="h-display" style={{ fontSize: 32, marginTop: 36, marginBottom: 18, letterSpacing: '-0.02em', display: 'flex', alignItems: 'baseline', gap: 14 }}>
            <span style={{ fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: 15, color: 'var(--navy-50)', fontWeight: 400 }}>§3</span>RDF asosidagi yangi model
          </h2>
          {["Taklif etilayotgan model ikkita mustaqil grafdan iborat: birinchisi — kodikologik tavsif (jismoniy ob'ekt), ikkinchisi — matn-tarixiy tavsif (asarning ma'lum bir nusxasi). Bu ikki graf orasidagi bog'lanish km:witnesses munosabati orqali amalga oshiriladi.", "Sxema SKOS lug'atlari bilan to'ldirilgan: xat turlari (nasx, ta'liq, shikasta), qog'oz turlari (samarqandiy, xivaliq, evropacha) va boshqa qo'shimcha terminlar uchun controlled vocabulary mavjud."].map((t, i) => (
            <p key={i} style={{ fontSize: 16, lineHeight: 1.75, color: 'var(--ink-2)', marginBottom: 18, fontFamily: 'var(--sans)', letterSpacing: '-0.003em' }}>{t}</p>
          ))}
          </>)}
        </article>

        {/* Metadata sidebar */}
        <aside className="rsp-hide" style={{ position: 'sticky', top: 148, display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* Journal cover — issue bo'lsa */}
          {apiArticle?.issue && (
            <div className="card-hover" style={{ background: 'var(--grey-2)', border: '1px solid var(--line)', borderRadius: 12, padding: 24, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
              <span className="eyebrow" style={{ alignSelf: 'flex-start' }}>Chiqqan jurnal</span>
              <div className="cover-hover" style={{ marginTop: 18, marginBottom: 18, cursor: apiArticle.issue.journal_id ? 'pointer' : 'default' }}
                onClick={() => apiArticle.issue?.journal_id && navigate(`/journals/${apiArticle.issue.journal_id}`)}>
                {apiArticle.issue.cover_image_url ? (
                  <img src={apiArticle.issue.cover_image_url} alt="Jurnal muqovasi"
                    style={{ width: 150, height: 200, objectFit: 'cover', borderRadius: 6, border: '1px solid var(--line)', display: 'block' }} />
                ) : (
                  <JournalCover title="Kutubxona Arxivi" vol={`Vol. ${apiArticle.issue.volume}`} year={apiArticle.issue.year} n={apiArticle.issue.number} palette={0} w={150} h={200} />
                )}
              </div>
              <div className="h-display" style={{ fontSize: 19, fontWeight: 600, color: 'var(--ink)', letterSpacing: '-0.02em', lineHeight: 1.2, cursor: apiArticle.issue.journal_id ? 'pointer' : 'default' }}
                onClick={() => apiArticle.issue?.journal_id && navigate(`/journals/${apiArticle.issue.journal_id}`)}>
                {apiArticle.issue.journal_title ?? 'Kutubxona Arxivi'}
              </div>
              <div style={{ fontSize: 13, color: 'var(--ink-3)', marginTop: 6, fontFamily: 'var(--sans)' }}>
                <b style={{ color: 'var(--ink-2)' }}>{apiArticle.issue.volume}-jild · {apiArticle.issue.number}-son</b>
                <span style={{ color: 'var(--ink-4)' }}> · </span>
                {apiArticle.issue.year}
              </div>
              {apiArticle.issue.date_label && (
                <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid var(--line)', width: '100%', fontSize: 11.5, color: 'var(--ink-3)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                  <span style={{ fontFamily: 'var(--mono)', textTransform: 'uppercase', letterSpacing: 0.3 }}>{apiArticle.issue.date_label}</span>
                </div>
              )}
            </div>
          )}

          {/* Profil egasi (Telegram orqali yuborgan) */}
          {apiArticle?.authors[0] && (
            <div className="card-hover" style={{ background: 'var(--paper)', border: '1px solid var(--line)', borderRadius: 12, padding: '22px 22px' }}>
              <span className="eyebrow">Yuborgan muallif</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 14 }}>
                <AuthorAvatar name={apiArticle.authors[0].initials} idx={apiArticle.authors[0].avatar_idx} size={48} />
                <div>
                  <div style={{ fontFamily: 'var(--serif)', fontSize: 16, fontWeight: 600, color: 'var(--ink)' }}>{apiArticle.authors[0].name}</div>
                </div>
              </div>
              <button className="btn ghost" onClick={() => navigate(`/authors/${apiArticle.authors[0].slug}`)}
                style={{ width: '100%', height: 34, fontSize: 12.5, justifyContent: 'center', marginTop: 14 }}>
                Profilni ochish <ArrowIcon size={12} />
              </button>
            </div>
          )}

          {/* Kalit so'zlar */}
          {apiArticle && apiArticle.keywords.length > 0 && (
            <div className="card-hover" style={{ background: 'var(--paper)', border: '1px solid var(--line)', borderRadius: 12, padding: '22px 22px' }}>
              <span className="eyebrow">Kalit so'zlar</span>
              <div style={{ marginTop: 14, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {apiArticle.keywords.map((k, i) => (
                  <span key={i} className="tag line" style={{ height: 24 }}>{k.name}</span>
                ))}
              </div>
            </div>
          )}

          {/* Shunga yaqin maqolalar — keywords bo'yicha */}
          {related.length > 0 && (
            <div className="card-hover" style={{ background: 'var(--paper)', border: '1px solid var(--line)', borderRadius: 12, padding: '22px 22px' }}>
              <span className="eyebrow" style={{ marginBottom: 6, display: 'block' }}>Shunga yaqin maqolalar</span>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {related.map((r, i) => (
                  <a key={r.id} className="row-hover" onClick={() => navigate(`/articles/${r.slug}`)}
                    style={{ display: 'grid', gridTemplateColumns: '26px 1fr', gap: 12, alignItems: 'start', padding: '14px 8px', borderTop: i === 0 ? 'none' : '1px solid var(--line)', cursor: 'pointer', textDecoration: 'none' }}>
                    <span style={{ fontFamily: 'var(--serif)', fontSize: 18, color: 'var(--navy-30)', fontWeight: 700, letterSpacing: '-0.02em', lineHeight: 1.1 }}>{String(i + 1).padStart(2, '0')}</span>
                    <div style={{ minWidth: 0 }}>
                      {r.category && <div style={{ fontSize: 9.5, color: 'var(--navy)', letterSpacing: 0.15, textTransform: 'uppercase', fontWeight: 700, marginBottom: 5 }}>{r.category.name}</div>}
                      <div style={{ fontFamily: 'var(--serif)', fontSize: 14, color: 'var(--ink)', lineHeight: 1.3, letterSpacing: '-0.005em', fontWeight: 500, marginBottom: 6 }}>{r.title}</div>
                      <div style={{ fontSize: 11, color: 'var(--ink-4)', display: 'inline-flex', alignItems: 'center', gap: 5 }}><ClockIcon size={10} /></div>
                    </div>
                  </a>
                ))}
              </div>
            </div>
          )}
        </aside>
      </div>

      {apiArticle?.ai_ready && <AskAISection slug={apiArticle.slug} />}
      {apiArticle && <CommentsSection articleId={apiArticle.id} />}
    </div>
  );
}
