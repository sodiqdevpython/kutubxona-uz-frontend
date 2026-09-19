/**
 * Meta jadval (maqola / son sahifalari) — bo'sh qiymatli kataklar tushib qoladi,
 * oxirgi qatorda bo'shliq qolmasligi uchun so'nggi katak qolgan ustunlarni egallaydi.
 */
export default function MetaGrid({ cells, className }: { cells: [string, string][]; className?: string }) {
  const filled = cells.filter(([, v]) => v && v !== '—');
  if (filled.length === 0) return null;

  const cols = Math.min(4, filled.length);
  const rest = filled.length % cols;          // oxirgi qatordagi kataklar soni

  return (
    <div className={`detail-meta${className ? ` ${className}` : ''}`} style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>
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
