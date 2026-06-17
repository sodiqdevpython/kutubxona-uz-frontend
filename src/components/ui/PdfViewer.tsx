import { useRef, useState, useEffect } from 'react';

// PDF zoom darajalari — % bo'yicha
const ZOOM_STEPS = [50, 75, 100, 125, 150, 200, 300];

export function isPdf(url: string | null | undefined): boolean {
  if (!url) return false;
  const clean = url.split('?')[0].split('#')[0].toLowerCase();
  return clean.endsWith('.pdf');
}

export function isDocx(url: string | null | undefined): boolean {
  if (!url) return false;
  const clean = url.split('?')[0].split('#')[0].toLowerCase();
  return clean.endsWith('.docx');
}

export default function PdfViewer({ url, title }: { url: string; title: string }) {
  const [fullscreen, setFullscreen] = useState(false);
  const [zoomIdx,    setZoomIdx]    = useState(2);   // 100% default
  const containerRef = useRef<HTMLDivElement>(null);

  const zoom = ZOOM_STEPS[zoomIdx];

  // ESC bosilsa fullscreen dan chiqish
  useEffect(() => {
    if (!fullscreen) return;
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') setFullscreen(false); }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [fullscreen]);

  const zoomOut = () => setZoomIdx(i => Math.max(0, i - 1));
  const zoomIn  = () => setZoomIdx(i => Math.min(ZOOM_STEPS.length - 1, i + 1));

  return (
    <div ref={containerRef}
      style={{
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
            PDF · {title}
          </span>
        </div>
        <div style={{ display: 'flex', gap: 6, flexShrink: 0, alignItems: 'center' }}>
          {/* Zoom */}
          <div style={{
            display: 'flex', alignItems: 'center',
            border: `1px solid ${fullscreen ? 'rgba(255,255,255,0.18)' : 'var(--line-2)'}`,
            borderRadius: 6, overflow: 'hidden',
          }}>
            <button onClick={zoomOut} disabled={zoomIdx === 0}
              title="Kichraytirish"
              style={{
                width: 30, height: 30, border: 0,
                background: 'transparent', color: 'inherit',
                cursor: zoomIdx === 0 ? 'not-allowed' : 'pointer',
                fontSize: 16, lineHeight: 1, opacity: zoomIdx === 0 ? 0.4 : 1,
                fontFamily: 'var(--sans)',
              }}>−</button>
            <span style={{
              minWidth: 50, textAlign: 'center', fontSize: 11.5, fontWeight: 600,
              fontFamily: 'var(--mono)', padding: '0 4px',
              borderLeft:  `1px solid ${fullscreen ? 'rgba(255,255,255,0.18)' : 'var(--line-2)'}`,
              borderRight: `1px solid ${fullscreen ? 'rgba(255,255,255,0.18)' : 'var(--line-2)'}`,
            }}>{zoom}%</span>
            <button onClick={zoomIn} disabled={zoomIdx === ZOOM_STEPS.length - 1}
              title="Kattalashtirish"
              style={{
                width: 30, height: 30, border: 0,
                background: 'transparent', color: 'inherit',
                cursor: zoomIdx === ZOOM_STEPS.length - 1 ? 'not-allowed' : 'pointer',
                fontSize: 16, lineHeight: 1,
                opacity: zoomIdx === ZOOM_STEPS.length - 1 ? 0.4 : 1,
                fontFamily: 'var(--sans)',
              }}>+</button>
          </div>

          {/* Yangi tabda */}
          <a href={url} target="_blank" rel="noreferrer"
            title="Yangi tabda ochish"
            style={{
              height: 30, padding: '0 12px', borderRadius: 6,
              border: `1px solid ${fullscreen ? 'rgba(255,255,255,0.18)' : 'var(--line-2)'}`,
              background: 'transparent',
              color: 'inherit', fontSize: 12, fontWeight: 600,
              cursor: 'pointer', fontFamily: 'var(--sans)',
              display: 'inline-flex', alignItems: 'center', gap: 5,
              textDecoration: 'none',
            }}>
            ↗ Yangi tab
          </a>

          {/* Fullscreen */}
          <button onClick={() => setFullscreen(p => !p)}
            title={fullscreen ? 'Yopish' : 'Kengaytirish'}
            style={{
              height: 30, padding: '0 12px', borderRadius: 6,
              border: `1px solid ${fullscreen ? 'rgba(255,255,255,0.18)' : 'var(--line-2)'}`,
              background: fullscreen ? 'rgba(255,255,255,0.08)' : 'var(--paper)',
              color: 'inherit', fontSize: 12, fontWeight: 600,
              cursor: 'pointer', fontFamily: 'var(--sans)',
            }}>
            {fullscreen ? '✕ Yopish' : '⛶ Kengaytirish'}
          </button>
        </div>
      </div>

      {/* PDF iframe */}
      <div style={{
        flex: 1,
        background: 'var(--paper)',
        border: `1px solid ${fullscreen ? 'rgba(255,255,255,0.12)' : 'var(--line)'}`,
        borderTop: 'none',
        borderBottomLeftRadius: 10, borderBottomRightRadius: 10,
        overflow: 'hidden',
        minHeight: fullscreen ? 0 : 720,
        position: 'relative',
      }}>
        <iframe
          key={zoom}   /* zoom o'zgarsa iframe qayta yuklanadi */
          src={`${url}#toolbar=0&navpanes=0&view=FitH&zoom=${zoom}`}
          title={title}
          style={{ width: '100%', height: fullscreen ? '100%' : 720, border: 0, display: 'block' }}
        />
      </div>

      {!fullscreen && (
        <div style={{ marginTop: 10, fontSize: 11.5, color: 'var(--ink-4)', textAlign: 'center', fontStyle: 'italic' }}>
          PDF brauzeringizning ichki ko'rsatuvchisi orqali ko'rsatilmoqda.
          Brauzer ichki menyusi orqali zoom, sahifa va qidiruvni boshqarishingiz mumkin.
        </div>
      )}
    </div>
  );
}
