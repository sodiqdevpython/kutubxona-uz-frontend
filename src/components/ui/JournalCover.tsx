const PALETTES = [
  { bg: '#0A192F', fg: '#F5F7FA', accent: '#5E7595' },
  { bg: '#1B3358', fg: '#FFFFFF', accent: '#9DAEC4' },
  { bg: '#F5F7FA', fg: '#0A192F', accent: '#0A192F', border: true },
  { bg: '#2B4670', fg: '#FFFFFF', accent: '#D7DEE9' },
  { bg: '#FFFFFF', fg: '#0A192F', accent: '#0A192F', border: true },
  { bg: '#102441', fg: '#FFFFFF', accent: '#9DAEC4' },
];

interface Props {
  title?: string;
  vol?: string;
  year?: number;
  n?: number;
  palette?: number;
  w?: number;
  h?: number;
}

export default function JournalCover({ title = 'Kutubxona Arxivi', vol = 'Vol. 42', year = 2026, n = 1, palette = 0, w = 180, h = 240 }: Props) {
  const p = PALETTES[palette % PALETTES.length];
  const borderColor = p.bg === '#FFFFFF' || p.bg === '#F5F7FA' ? 'rgba(10,25,47,0.15)' : 'rgba(255,255,255,0.18)';

  return (
    <div style={{
      width: w, height: h,
      background: p.bg, color: p.fg,
      borderRadius: 3,
      padding: '18px 16px',
      display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
      border: p.border ? '1px solid #E4E8EF' : '1px solid rgba(255,255,255,0.05)',
      boxShadow: '0 18px 32px -16px rgba(10,25,47,0.35), 0 2px 4px rgba(10,25,47,0.10)',
      position: 'relative',
      overflow: 'hidden',
      flexShrink: 0,
    }}>
      <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 4, background: p.accent, opacity: 0.85 }} />
      <div>
        <div style={{ fontSize: 9, letterSpacing: 0.22, textTransform: 'uppercase', fontWeight: 600, opacity: 0.8 }}>Kutubxona</div>
        <div style={{ fontSize: 9, letterSpacing: 0.22, textTransform: 'uppercase', fontWeight: 600, opacity: 0.55, marginTop: 2 }}>Archive</div>
      </div>
      <div>
        <div style={{ fontFamily: 'var(--serif)', fontSize: 18, letterSpacing: '-0.015em', lineHeight: 1.1, fontWeight: 600 }}>{title}</div>
        <div style={{
          marginTop: 14, paddingTop: 10,
          borderTop: `1px solid ${borderColor}`,
          display: 'flex', justifyContent: 'space-between',
          fontSize: 9.5, fontFamily: 'var(--mono)', letterSpacing: 0.3, opacity: 0.85,
        }}>
          <span>{vol} · №{n}</span>
          <span>{year}</span>
        </div>
      </div>
    </div>
  );
}
