const VARIANTS = [
  '#0A192F', '#1B3358', '#2B4670', '#5E7595', '#102441',
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
  const bg = VARIANTS[idx % VARIANTS.length];
  const fontSize = size <= 22 ? 9 : size <= 28 ? 10 : size <= 36 ? 12 : size <= 52 ? 14 : 20;

  if (src) {
    return (
      <img
        src={src}
        alt={alt ?? name}
        loading="lazy"
        className="avatar"
        style={{
          width: size, height: size, borderRadius: '50%',
          objectFit: 'cover', flexShrink: 0, background: bg,
        }}
      />
    );
  }

  return (
    <div className="avatar" style={{ width: size, height: size, background: bg, fontSize }}>
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
