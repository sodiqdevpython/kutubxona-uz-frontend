import { ChevIcon } from './Icons';

/**
 * Raqamli sahifalash — Figma: ‹ 1 2 3 4 ›, faol sahifa to'q sariq.
 * Chap tomonda ixtiyoriy yozuv («1–20 / 77 natija»).
 */

interface Props {
  total:         number;
  perPage?:      number;
  current?:      number;
  label?:        string | null;
  onPageChange?: (page: number) => void;
}

export default function Pagination({ total, perPage = 20, current = 1, label, onPageChange }: Props) {
  const totalPages = Math.max(1, Math.ceil(total / perPage));
  if (totalPages <= 1) return null;

  const pages: (number | '…')[] = (() => {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
    if (current <= 4) return [1, 2, 3, 4, 5, '…', totalPages];
    if (current >= totalPages - 3) return [1, '…', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
    return [1, '…', current - 1, current, current + 1, '…', totalPages];
  })();

  const go = (p: number) => {
    if (p < 1 || p > totalPages || p === current) return;
    onPageChange?.(p);
  };

  const text = label === undefined
    ? `${(current - 1) * perPage + 1}–${Math.min(current * perPage, total)} / ${total} natija`
    : label;

  return (
    <div className="pager">
      {text && <span className="meta">{text}</span>}

      <div className="pager-btns">
        <button className="pager-btn" onClick={() => go(current - 1)} disabled={current <= 1} aria-label="Oldingi">
          <ChevIcon size={10} style={{ transform: 'rotate(180deg)' }} />
        </button>
        {pages.map((p, i) => (
          p === '…'
            ? <span key={`e${i}`} className="pager-dots">…</span>
            : <button key={p} className={`pager-btn${p === current ? ' active' : ''}`} onClick={() => go(p)}>{p}</button>
        ))}
        <button className="pager-btn" onClick={() => go(current + 1)} disabled={current >= totalPages} aria-label="Keyingi">
          <ChevIcon size={10} />
        </button>
      </div>
    </div>
  );
}
