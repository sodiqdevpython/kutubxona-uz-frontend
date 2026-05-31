import { ChevIcon } from './Icons';

interface Props {
  total:        number;
  perPage?:     number;
  current?:     number;
  label?:       string;
  onPageChange?: (page: number) => void;
}

export default function Pagination({
  total, perPage = 20, current = 1, label, onPageChange,
}: Props) {
  const totalPages = Math.max(1, Math.ceil(total / perPage));

  const pages: (number | '…')[] = (() => {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
    if (current <= 4)     return [1, 2, 3, 4, 5, '…', totalPages];
    if (current >= totalPages - 3) return [1, '…', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
    return [1, '…', current - 1, current, current + 1, '…', totalPages];
  })();

  const go = (p: number) => {
    if (p < 1 || p > totalPages) return;
    onPageChange?.(p);
  };

  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      flexWrap: 'wrap', gap: 12,
      marginTop: 32, paddingTop: 24, borderTop: '1px solid var(--line)',
    }}>
      <span style={{ fontSize: 12.5, color: 'var(--ink-3)' }}>
        {label ?? `${(current - 1) * perPage + 1}–${Math.min(current * perPage, total)} / ${total} natija`}
      </span>

      <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexWrap: 'wrap' }}>
        <button className="icon-btn" style={{ width: 36, height: 36 }}
          onClick={() => go(current - 1)} disabled={current <= 1}>
          <ChevIcon style={{ transform: 'rotate(180deg)' }} />
        </button>

        {pages.map((p, i) => (
          <button key={i} style={{
            minWidth: 36, height: 36, padding: '0 10px',
            border: p === current ? '1px solid var(--navy)' : '1px solid var(--line)',
            background: p === current ? 'var(--navy)' : 'var(--paper)',
            color: p === current ? 'white' : typeof p === 'number' ? 'var(--ink-2)' : 'var(--ink-4)',
            borderRadius: 6, fontSize: 13, fontWeight: 600,
            cursor: typeof p === 'number' ? 'pointer' : 'default',
            fontFamily: 'var(--sans)',
          }} onClick={() => typeof p === 'number' && go(p)}>{p}</button>
        ))}

        <button className="icon-btn" style={{ width: 36, height: 36 }}
          onClick={() => go(current + 1)} disabled={current >= totalPages}>
          <ChevIcon />
        </button>
      </div>

      <div className="field pag-perpage" style={{ minWidth: 120 }}>
        <span style={{ fontSize: 12, color: 'var(--ink-3)' }}>{perPage} / sahifa</span>
        <ChevIcon />
      </div>
    </div>
  );
}
