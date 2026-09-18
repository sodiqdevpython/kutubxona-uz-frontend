import { useEffect } from 'react';
import { aiReasonText } from '../../lib/ai';

interface Props {
  open: boolean;
  onClose: () => void;
  /** Backenddan kelgan sabab: not_configured | unreachable | http_<kod> */
  reason?: string;
  /** Qaysi amal to'xtatildi — masalan "AI bilan to'ldirish". */
  action?: string;
}

/**
 * «Local AI ulanmagan» modali.
 *
 * AI xizmati ishga tushgach bu modal o'z-o'zidan chiqmay qo'yadi —
 * holat `/api/ai/status/` dan real vaqtda olinadi.
 */
export default function AiUnavailableModal({ open, onClose, reason, action }: Props) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(10,25,47,0.45)',
        display: 'grid', placeItems: 'center', padding: 20,
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="ai-modal-title"
        style={{
          background: 'var(--paper)', borderRadius: 14,
          border: '1px solid var(--line)',
          boxShadow: '0 24px 60px -20px rgba(10,25,47,0.45)',
          width: '100%', maxWidth: 440, padding: '26px 26px 22px',
          fontFamily: 'var(--sans)',
        }}
      >
        <div style={{
          width: 52, height: 52, borderRadius: '50%',
          background: 'rgba(217,119,6,0.10)',
          display: 'grid', placeItems: 'center',
          fontSize: 26, marginBottom: 16,
        }}>
          🔌
        </div>

        <h3 id="ai-modal-title" style={{
          fontFamily: 'var(--serif)', fontSize: 20, fontWeight: 600,
          color: 'var(--ink)', marginBottom: 8, letterSpacing: '-0.01em',
        }}>
          Local AI ulanmagan
        </h3>

        <p style={{ fontSize: 13.5, lineHeight: 1.6, color: 'var(--ink-2)', marginBottom: 10 }}>
          {action
            ? <>«{action}» hozircha ishlamaydi — AI xizmati ulanmagan.</>
            : <>AI imkoniyatlari hozircha ishlamaydi — xizmat ulanmagan.</>}
        </p>

        <p style={{ fontSize: 12.5, lineHeight: 1.6, color: 'var(--ink-3)', marginBottom: 18 }}>
          {aiReasonText(reason)} Xizmat ishga tushgach bu amal avtomatik ishlaydi —
          hech narsani o'zgartirish shart emas.
        </p>

        <div style={{
          background: 'var(--grey-2)', borderRadius: 8,
          padding: '10px 12px', marginBottom: 18,
          fontSize: 12, color: 'var(--ink-3)', lineHeight: 1.55,
        }}>
          Shu orada maydonlarni <strong>qo'lda</strong> to'ldirishingiz mumkin —
          «Tahrirlash» tugmasi orqali.
        </div>

        <button
          onClick={onClose}
          style={{
            width: '100%', height: 42, borderRadius: 8, border: 0,
            background: 'var(--navy)', color: 'white',
            fontSize: 14, fontWeight: 600, cursor: 'pointer',
            fontFamily: 'var(--sans)',
          }}
        >
          Tushunarli
        </button>
      </div>
    </div>
  );
}
