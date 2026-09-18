/**
 * Muallif avatari — Figma: och doira ichida serif bosh harflar.
 * Har uchinchi muallif to'q sariq halqada, qolganlari kulrang.
 */
const VARIANTS = [
  { bg: 'var(--accent-08)', border: 'var(--accent)', color: 'var(--accent)' },
  { bg: 'var(--grey-2)',    border: 'var(--line-2)', color: 'var(--ink-2)'  },
  { bg: 'var(--grey-2)',    border: 'var(--line-2)', color: 'var(--ink-2)'  },
];

interface Props {
  name?: string;
  size?: number;
  idx?: number;
  /**
   * Profil rasmi. Berilgan bo'lsa — bosh harflar o'rniga rasm ko'rsatiladi.
   * Rasm har doim muallif profilidan o'qiladi, shuning uchun maqola
   * qo'shilganda rasm bo'lmagan bo'lsa ham, keyin yuklansa darhol chiqadi.
   */
  src?: string | null;
  alt?: string;
}

export default function AuthorAvatar({ name = '?', size = 32, idx = 0, src, alt }: Props) {
  const v = VARIANTS[idx % VARIANTS.length];
  const fontSize = size <= 22 ? 9 : size <= 28 ? 10.5 : size <= 36 ? 12.5 : size <= 56 ? 17 : 28;
  const border = size <= 28 ? 1 : 1.5;

  if (src) {
    return (
      <img
        src={src}
        alt={alt ?? name}
        loading="lazy"
        className="avatar"
        style={{
          width: size, height: size, borderRadius: '50%',
          objectFit: 'cover', flexShrink: 0, background: v.bg,
          border: `${border}px solid ${v.border}`, boxSizing: 'border-box',
        }}
      />
    );
  }

  return (
    <div className="avatar" style={{
      width: size, height: size, fontSize,
      background: v.bg, color: v.color,
      border: `${border}px solid ${v.border}`, boxSizing: 'border-box',
      fontFamily: 'var(--serif)', fontWeight: 600, letterSpacing: '.01em',
    }}>
      {name}
    </div>
  );
}

interface StackAuthor {
  initials: string;
  idx?: number;
  avatar_idx?: number;
  avatar_url?: string | null;
  name?: string;
}

interface StackProps {
  authors: StackAuthor[];
  size?: number;
}

export function AvatarStack({ authors, size = 24 }: StackProps) {
  return (
    <div style={{ display: 'flex' }}>
      {authors.map((a, i) => (
        <div key={i} style={{
          marginLeft: i === 0 ? 0 : -8,
          position: 'relative',
          zIndex: 10 - i,
          boxShadow: '0 0 0 2px #fff',
          borderRadius: '50%',
        }}>
          <AuthorAvatar
            name={a.initials}
            idx={a.avatar_idx ?? a.idx ?? i}
            src={a.avatar_url}
            alt={a.name}
            size={size}
          />
        </div>
      ))}
    </div>
  );
}
