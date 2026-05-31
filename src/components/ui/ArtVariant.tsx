import React from 'react';

interface Props { kind?: string; }

export default function ArtVariant({ kind = 'rdf' }: Props) {
  const wrap = (children: React.ReactNode, bg = '#F5F7FA') => (
    <div style={{ position: 'absolute', inset: 0, background: bg }}>{children}</div>
  );

  if (kind === 'manuscript-hero') return wrap(
    <svg viewBox="0 0 800 320" preserveAspectRatio="xMidYMid slice" style={{ width: '100%', height: '100%' }}>
      <defs>
        <linearGradient id="mh" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0" stopColor="#102441" /><stop offset="1" stopColor="#0A192F" />
        </linearGradient>
      </defs>
      <rect width="800" height="320" fill="url(#mh)" />
      <g transform="translate(80,30)">
        <g transform="rotate(-3)">
          <rect x="0" y="0" width="280" height="240" fill="#F5F7FA" stroke="#5E7595" strokeWidth="0.8" />
          <g fill="#0A192F" opacity="0.7">
            {Array.from({ length: 18 }).map((_, i) => <rect key={i} x="22" y={20 + i * 12} width={Math.max(40, 220 - (i % 4) * 30)} height="2" />)}
          </g>
          <rect x="22" y="20" width="36" height="36" fill="#0A192F" />
          <text x="40" y="44" fill="#F5F7FA" fontFamily="Playfair Display" fontSize="26" fontWeight="700" textAnchor="middle" fontStyle="italic">م</text>
        </g>
        <g transform="translate(280,6) rotate(2)">
          <rect x="0" y="0" width="240" height="220" fill="#FFFFFF" stroke="#5E7595" strokeWidth="0.8" />
          <g fill="#0A192F" opacity="0.6">
            {Array.from({ length: 16 }).map((_, i) => <rect key={i} x="20" y={20 + i * 12} width={Math.max(30, 200 - (i % 5) * 20)} height="2" />)}
          </g>
        </g>
      </g>
      <g transform="translate(620,220)" opacity="0.45">
        <circle cx="0" cy="0" r="38" fill="none" stroke="#5E7595" strokeWidth="1.2" />
        <circle cx="0" cy="0" r="30" fill="none" stroke="#5E7595" strokeWidth="0.8" />
        <text x="0" y="-4" fill="#9DAEC4" fontFamily="Playfair Display" fontStyle="italic" fontSize="11" textAnchor="middle">1907</text>
        <text x="0" y="10" fill="#9DAEC4" fontFamily="Inter" fontSize="6" letterSpacing="1" textAnchor="middle">TOSHKENT</text>
      </g>
    </svg>, 'transparent'
  );

  if (kind === 'rdf') return wrap(
    <svg viewBox="0 0 320 160" preserveAspectRatio="xMidYMid slice" style={{ width: '100%', height: '100%' }}>
      <rect width="320" height="160" fill="#F5F7FA" />
      <g stroke="#0A192F" strokeWidth="1" fill="none" opacity="0.6">
        <line x1="80" y1="60" x2="160" y2="60" /><line x1="160" y1="60" x2="240" y2="60" /><line x1="160" y1="60" x2="160" y2="120" />
      </g>
      {([[80,60],[160,60],[240,60],[160,120]] as [number,number][]).map(([x,y],i)=>(
        <g key={i}><circle cx={x} cy={y} r="14" fill={i===1?'#0A192F':'#FFFFFF'} stroke="#0A192F" strokeWidth="1.2"/></g>
      ))}
    </svg>
  );

  if (kind === 'grid') return wrap(
    <svg viewBox="0 0 320 160" preserveAspectRatio="xMidYMid slice" style={{ width: '100%', height: '100%' }}>
      <rect width="320" height="160" fill="#0A192F" />
      <g fill="#F5F7FA">
        {Array.from({ length: 8 }).map((_, r) =>
          Array.from({ length: 14 }).map((_, c) => {
            const v = ((r * c) % 5) / 4;
            return <rect key={`${r}-${c}`} x={20 + c * 20} y={16 + r * 16} width="14" height="10" opacity={0.15 + v * 0.7} />;
          })
        )}
      </g>
    </svg>
  );

  if (kind === 'bars') return wrap(
    <svg viewBox="0 0 320 160" preserveAspectRatio="xMidYMid slice" style={{ width: '100%', height: '100%' }}>
      <rect width="320" height="160" fill="#F5F7FA" />
      {[40,55,72,90,72,84,108,124,140,124].map((h,i)=>(
        <rect key={i} x={24+i*28} y={140-h} width="20" height={h} fill={i===8?'#0A192F':'#1B3358'} opacity={0.5+i/20}/>
      ))}
      <line x1="20" y1="140" x2="300" y2="140" stroke="#0A192F" strokeWidth="1"/>
    </svg>
  );

  if (kind === 'dossier') return wrap(
    <svg viewBox="0 0 320 160" preserveAspectRatio="xMidYMid slice" style={{ width: '100%', height: '100%' }}>
      <rect width="320" height="160" fill="#F5F7FA" />
      <g transform="translate(70,22)">
        <rect x="-2" y="-2" width="184" height="124" fill="#9DAEC4" opacity="0.4"/>
        <rect x="2"  y="2"  width="184" height="124" fill="#D7DEE9"/>
        <rect x="6"  y="6"  width="184" height="124" fill="#FFFFFF" stroke="#0A192F" strokeWidth="0.6"/>
        <rect x="22" y="22" width="48"  height="6"   fill="#0A192F"/>
        <g fill="#0A192F" opacity="0.7">
          {Array.from({length:8}).map((_,i)=><rect key={i} x="22" y={40+i*9} width={Math.max(40,152-(i%3)*30)} height="2"/>)}
        </g>
        <rect x="138" y="22" width="36" height="14" fill="none" stroke="#0A192F" strokeWidth="0.8"/>
        <text x="156" y="32" fill="#0A192F" fontSize="7" textAnchor="middle" fontFamily="JetBrains Mono">CONF.</text>
      </g>
    </svg>
  );

  if (kind === 'glyph') return wrap(
    <svg viewBox="0 0 320 160" preserveAspectRatio="xMidYMid slice" style={{ width: '100%', height: '100%' }}>
      <rect width="320" height="160" fill="#102441"/>
      <g fill="none" stroke="#F5F7FA" strokeWidth="1.5">
        <path d="M 60 90 Q 100 30 140 90 Q 180 150 220 90"/>
        <path d="M 220 90 Q 240 70 260 90" opacity="0.5"/>
        <circle cx="100" cy="90" r="4" fill="#F5F7FA"/>
        <circle cx="180" cy="90" r="4" fill="#F5F7FA"/>
      </g>
      <g fill="#5E7595" fontFamily="JetBrains Mono" fontSize="8" opacity="0.7">
        <text x="20" y="28">U+0644</text><text x="20" y="42">U+064A</text><text x="20" y="56">U+0645</text>
      </g>
    </svg>
  );

  if (kind === 'map') return wrap(
    <svg viewBox="0 0 320 160" preserveAspectRatio="xMidYMid slice" style={{ width: '100%', height: '100%' }}>
      <rect width="320" height="160" fill="#F5F7FA"/>
      <g stroke="#9DAEC4" strokeWidth="0.4" fill="none">
        {Array.from({length:14}).map((_,i)=><line key={`h${i}`} x1="0" x2="320" y1={i*12} y2={i*12}/>)}
        {Array.from({length:28}).map((_,i)=><line key={`v${i}`} x1={i*12} x2={i*12} y1="0" y2="160"/>)}
      </g>
      <g stroke="#0A192F" strokeWidth="1.2" fill="none">
        <path d="M 20 100 Q 60 60 100 80 T 200 70 T 300 90"/>
        <path d="M 40 130 Q 100 110 160 130 T 280 120"/>
      </g>
      {([[80,80],[140,72],[200,70],[260,88],[110,128],[180,130],[240,124]] as [number,number][]).map(([x,y],i)=>(
        <g key={i}><circle cx={x} cy={y} r="4" fill="#0A192F"/></g>
      ))}
    </svg>
  );

  if (kind === 'manuscript') return wrap(
    <svg viewBox="0 0 320 200" preserveAspectRatio="xMidYMid slice" style={{ width: '100%', height: '100%' }}>
      <rect width="320" height="200" fill="#0A192F"/>
      <g transform="translate(60,20)">
        <rect x="0" y="0" width="200" height="160" fill="#F5F7FA" stroke="#5E7595" strokeWidth="0.8"/>
        <g fill="#0A192F" opacity="0.7">
          {Array.from({length:14}).map((_,i)=><rect key={i} x="16" y={16+i*10} width={Math.max(30,168-(i%4)*25)} height="2"/>)}
        </g>
        <rect x="16" y="16" width="30" height="30" fill="#0A192F"/>
        <text x="31" y="37" fill="#F5F7FA" fontFamily="Playfair Display" fontSize="20" textAnchor="middle" fontStyle="italic">م</text>
      </g>
    </svg>
  );

  return wrap(<div />);
}
