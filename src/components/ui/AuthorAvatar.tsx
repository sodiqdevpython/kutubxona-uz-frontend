const VARIANTS = [
  '#0A192F', '#1B3358', '#2B4670', '#5E7595', '#102441',
];

interface Props {
  name?: string;
  size?: number;
  idx?: number;
}

export default function AuthorAvatar({ name = '?', size = 32, idx = 0 }: Props) {
  const bg = VARIANTS[idx % VARIANTS.length];
  const fontSize = size <= 22 ? 9 : size <= 28 ? 10 : size <= 36 ? 12 : size <= 52 ? 14 : 20;
  return (
    <div className="avatar" style={{ width: size, height: size, background: bg, fontSize }}>
      {name}
    </div>
  );
}

interface StackProps {
  authors: { initials: string; idx?: number }[];
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
          <AuthorAvatar name={a.initials} idx={a.idx ?? i} size={size} />
        </div>
      ))}
    </div>
  );
}
