import { useEffect, useRef, useState } from 'react';
import * as pdfjs from 'pdfjs-dist';
import type { PDFDocumentProxy, RenderTask } from 'pdfjs-dist';

/**
 * PDF ko'rsatuvchi — Figma «Maqola detail» dagi «To'liq matn» bloki.
 *
 * Sahifalar ketma-ket (uzluksiz) joylashadi: pastga surilsa keyingi sahifa
 * keladi; faqat ko'rinish yaqinidagi sahifalar chiziladi (xotira tejaladi).
 * Toolbar: sahifa raqami / o'tish, zoom, matn ichidan qidirish, to'liq ekran.
 * Yuklab olish / yangi tabda ochish ATAYLAB yo'q — oddiy foydalanuvchi PDF'ni
 * yuklab olmaydi.
 */

// Worker'ni Vite o'zi .js chunk sifatida yig'adi — serverda .mjs uchun MIME
// sozlamasi bo'lmasa ham ishlaydi (nginx "application/octet-stream" muammosi).
pdfjs.GlobalWorkerOptions.workerPort = new Worker(
  new URL('pdfjs-dist/build/pdf.worker.min.mjs', import.meta.url),
  { type: 'module' },
);

const ZOOM_STEPS = [50, 75, 100, 125, 150, 200];
const PAGE_MAX_W = 880;   // 100% da sahifa kengligi (px) — butun kenglikdagi blokda o'rtada, katta
const FRAME_PAD  = 28;    // .pdfv-frame padding

/**
 * Faylni avval shu sahifa domenidan (/media/…) o'qishga urinamiz — CORS'siz;
 * bo'lmasa berilgan manzilning o'zi.
 */
function candidates(url: string): string[] {
  const out: string[] = [];
  try {
    const u = new URL(url, window.location.href);
    if (u.origin !== window.location.origin) out.push(window.location.origin + u.pathname + u.search);
  } catch { /* noto'g'ri URL — faqat asl manzil */ }
  out.push(url);
  return out;
}

interface Size { w: number; h: number }

interface Props {
  url:     string;
  title:   string;
  onInfo?: (info: { pages: number }) => void;
}

export default function PdfViewer({ url, title, onInfo }: Props) {
  const [doc, setDoc]         = useState<PDFDocumentProxy | null>(null);
  const [sizes, setSizes]     = useState<Size[]>([]);          // har sahifaning 100% o'lchami
  const [status, setStatus]   = useState<'loading' | 'ok' | 'error'>('loading');
  const [page, setPage]       = useState(1);
  const [pageInput, setPageInput] = useState('1');
  const [zoomIdx, setZoomIdx] = useState(2);                    // 100%
  const [fullscreen, setFullscreen] = useState(false);
  const [width, setWidth]     = useState(0);
  const [visible, setVisible] = useState<Set<number>>(() => new Set([1]));

  const [q, setQ]             = useState('');
  const [hits, setHits]       = useState<number[] | null>(null);
  const [hitsFor, setHitsFor] = useState('');
  const [hitIdx, setHitIdx]   = useState(0);
  const [searching, setSearching] = useState(false);

  const frameRef  = useRef<HTMLDivElement>(null);
  const pageRefs  = useRef<(HTMLDivElement | null)[]>([]);
  const textCache = useRef<Map<number, string>>(new Map());
  const raf       = useRef(0);

  const pages = doc?.numPages ?? 0;

  // URL almashsa — holatni render vaqtida tozalaymiz
  const [loadedUrl, setLoadedUrl] = useState(url);
  if (loadedUrl !== url) {
    setLoadedUrl(url); setDoc(null); setSizes([]); setStatus('loading'); setPage(1); setPageInput('1');
    setVisible(new Set([1])); setHits(null); setHitsFor(''); textCache.current = new Map();
  }
  // Scroll bilan sahifa o'zgarsa — input'dagi raqam ham
  const [seenPage, setSeenPage] = useState(page);
  if (seenPage !== page) { setSeenPage(page); setPageInput(String(page)); }

  // ── Hujjatni yuklash ──
  useEffect(() => {
    let cancelled = false;
    let loaded: PDFDocumentProxy | null = null;

    (async () => {
      for (const src of candidates(url)) {
        try {
          const d = await pdfjs.getDocument({ url: src }).promise;
          if (cancelled) { d.destroy(); return; }
          loaded = d;
          const first = d.numPages ? (await d.getPage(1)).getViewport({ scale: 1 }) : null;
          if (cancelled) return;
          const all: Size[] = first ? [{ w: first.width, h: first.height }] : [];
          setSizes(all); setDoc(d); setStatus('ok');
          onInfo?.({ pages: d.numPages });
          // Qolgan sahifalar o'lchami — joy egallovchilar balandligi aniq bo'lsin
          for (let n = 2; n <= d.numPages; n++) {
            const vp = (await d.getPage(n)).getViewport({ scale: 1 });
            if (cancelled) return;
            all.push({ w: vp.width, h: vp.height });
          }
          setSizes([...all]);
          return;
        } catch { /* keyingi manzil */ }
      }
      if (!cancelled) setStatus('error');
    })();

    return () => { cancelled = true; loaded?.destroy(); };
    // onInfo — ota komponent callback'i, bog'liqlikka kirmaydi
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url]);

  // ── Konteyner kengligi (sahifani sig'dirish uchun) ──
  useEffect(() => {
    const el = frameRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setWidth(el.clientWidth));
    ro.observe(el);
    return () => ro.disconnect();
  }, [fullscreen]);

  // ── Qaysi sahifalar ko'rinish yaqinida — faqat shular chiziladi ──
  useEffect(() => {
    const frame = frameRef.current;
    if (!frame || !pages) return;
    const io = new IntersectionObserver(entries => {
      setVisible(prev => {
        const next = new Set(prev);
        for (const e of entries) {
          const n = Number((e.target as HTMLElement).dataset.page);
          if (e.isIntersecting) next.add(n); else next.delete(n);
        }
        return next;
      });
    }, { root: frame, rootMargin: '900px 0px' });
    pageRefs.current.slice(0, pages).forEach(el => el && io.observe(el));
    return () => io.disconnect();
  }, [pages]);

  // ── Klaviatura: ← → sahifa (to'liq ekranda), Esc — chiqish ──
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === 'Escape' && fullscreen) setFullscreen(false);
      if (!fullscreen) return;
      if (e.key === 'ArrowRight') go(page + 1);
      if (e.key === 'ArrowLeft')  go(page - 1);
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fullscreen, page, pages]);

  useEffect(() => {
    document.body.style.overflow = fullscreen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [fullscreen]);

  /** Scroll paytida joriy sahifa: ko'rinish balandligining 35% chizig'idagi sahifa */
  function onScroll() {
    if (raf.current) return;
    raf.current = requestAnimationFrame(() => {
      raf.current = 0;
      const frame = frameRef.current;
      if (!frame) return;
      const y = frame.scrollTop + frame.clientHeight * 0.35;
      let cur = 1;
      pageRefs.current.slice(0, pages).forEach((el, i) => { if (el && el.offsetTop <= y) cur = i + 1; });
      setPage(cur);
    });
  }

  function go(n: number) {
    if (!pages) return;
    const clamped = Math.min(pages, Math.max(1, n));
    const el = pageRefs.current[clamped - 1];
    const frame = frameRef.current;
    if (el && frame) frame.scrollTo({ top: el.offsetTop - FRAME_PAD, behavior: 'smooth' });
    setPage(clamped);
  }

  // ── Qidiruv: so'z uchragan sahifalar bo'ylab yurish ──
  async function search() {
    if (!doc) return;
    const term = q.trim().toLowerCase();
    if (!term) { setHits(null); setHitsFor(''); return; }

    if (hits && hitsFor === term) {                 // keyingi topilgan sahifa
      if (!hits.length) return;
      const i = (hitIdx + 1) % hits.length;
      setHitIdx(i); go(hits[i]);
      return;
    }

    setSearching(true);
    const found: number[] = [];
    for (let n = 1; n <= doc.numPages; n++) {
      let text = textCache.current.get(n);
      if (text === undefined) {
        const pg = await doc.getPage(n);
        const tc = await pg.getTextContent();
        text = tc.items.map(it => ('str' in it ? it.str : '')).join(' ').toLowerCase();
        textCache.current.set(n, text);
      }
      if (text.includes(term)) found.push(n);
    }
    setHits(found); setHitsFor(term); setHitIdx(0); setSearching(false);
    if (found.length) go(found[0]);
  }

  const zoom  = ZOOM_STEPS[zoomIdx];
  const base  = sizes[0];
  const fit   = base && width ? Math.min(Math.max(260, width - FRAME_PAD * 2), PAGE_MAX_W) / base.w : 0;
  const scale = fit * zoom / 100;

  return (
    <div className={`pdfv${fullscreen ? ' full' : ''}`}>
      {/* ── Toolbar ── */}
      <div className="pdfv-bar">
        <div className="pdfv-grp">
          <button className="pdfv-btn" onClick={() => go(page - 1)} disabled={page <= 1} aria-label="Oldingi sahifa">‹</button>
          <form className="pdfv-num" onSubmit={e => { e.preventDefault(); go(parseInt(pageInput, 10) || 1); }}>
            <input value={pageInput} onChange={e => setPageInput(e.target.value.replace(/\D/g, ''))}
              onBlur={() => go(parseInt(pageInput, 10) || page)} aria-label="Sahifa" />
            <span>/ {pages || '–'}</span>
          </form>
          <button className="pdfv-btn" onClick={() => go(page + 1)} disabled={!pages || page >= pages} aria-label="Keyingi sahifa">›</button>
        </div>

        <div className="pdfv-grp">
          <button className="pdfv-btn" onClick={() => setZoomIdx(i => Math.max(0, i - 1))} disabled={zoomIdx === 0} aria-label="Kichraytirish">−</button>
          <span className="pdfv-zoom">{zoom}%</span>
          <button className="pdfv-btn" onClick={() => setZoomIdx(i => Math.min(ZOOM_STEPS.length - 1, i + 1))} disabled={zoomIdx === ZOOM_STEPS.length - 1} aria-label="Kattalashtirish">+</button>
        </div>

        <form className="pdfv-search" onSubmit={e => { e.preventDefault(); search(); }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2"/><path d="M20 20l-3.5-3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
          <input value={q} onChange={e => setQ(e.target.value)} placeholder="Matn ichidan qidirish" disabled={status !== 'ok'} />
          {searching && <span className="pdfv-hint">…</span>}
          {!searching && hits && hitsFor === q.trim().toLowerCase() && (
            <span className="pdfv-hint">{hits.length ? `${hitIdx + 1}/${hits.length} sahifa` : 'topilmadi'}</span>
          )}
        </form>

        <div className="pdfv-grp" style={{ marginLeft: 'auto' }}>
          <button className="pdfv-btn wide" onClick={() => setFullscreen(f => !f)}>
            {fullscreen ? '✕ Yopish' : 'To‘liq ekran'}
          </button>
        </div>
      </div>

      {/* ── Sahifalar (uzluksiz) ── */}
      <div className="pdfv-frame" ref={frameRef} onScroll={onScroll}>
        {status === 'error' && (
          <div className="pdfv-msg">PDF ko‘rsatib bo‘lmadi. Keyinroq qayta urinib ko‘ring.</div>
        )}
        {status === 'loading' && (
          <div className="pdfv-page pdfv-ph"><span className="pdfv-msg">Yuklanmoqda…</span></div>
        )}
        {status === 'ok' && doc && base && scale > 0 && Array.from({ length: pages }, (_, i) => {
          const s = sizes[i] ?? base;
          return (
            <div key={i} className="pdfv-page" data-page={i + 1} ref={el => { pageRefs.current[i] = el; }}
              style={{ width: Math.floor(s.w * scale), height: Math.floor(s.h * scale) }}
              aria-label={`${title} — ${i + 1}-sahifa`}>
              {visible.has(i + 1) && <PageCanvas doc={doc} n={i + 1} scale={scale} />}
              <div className="pdfv-foot">{i + 1}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/** Bitta sahifa — ko'rinish yaqiniga kelganda chiziladi, uzoqlashsa olib tashlanadi. */
function PageCanvas({ doc, n, scale }: { doc: PDFDocumentProxy; n: number; scale: number }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    let cancelled = false;
    let task: RenderTask | null = null;
    (async () => {
      const p = await doc.getPage(n);
      if (cancelled) return;
      const vp = p.getViewport({ scale });
      const canvas = ref.current;
      if (!canvas) return;
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      canvas.width  = Math.floor(vp.width * dpr);
      canvas.height = Math.floor(vp.height * dpr);
      canvas.style.width  = `${Math.floor(vp.width)}px`;
      canvas.style.height = `${Math.floor(vp.height)}px`;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      task = p.render({ canvasContext: ctx, viewport: vp, transform: dpr !== 1 ? [dpr, 0, 0, dpr, 0, 0] : undefined });
      try { await task.promise; } catch { /* bekor qilingan render */ }
    })();
    return () => { cancelled = true; task?.cancel(); };
  }, [doc, n, scale]);

  return <canvas ref={ref} />;
}
