import { useRef, useState } from 'react';
import { ChevIcon } from './Icons';

interface Props {
  label?: string;
  onClick?: () => void;
}

export default function LoadMoreButton({ label = 'Yana yuklash', onClick }: Props) {
  const [loading, setLoading] = useState(false);
  const ref = useRef<ReturnType<typeof setTimeout> | null>(null);

  function go() {
    if (loading) return;
    setLoading(true);
    ref.current = setTimeout(() => { setLoading(false); onClick?.(); }, 900);
  }

  return (
    <button className="btn ghost" onClick={go} disabled={loading}
      style={{ minWidth: 220, justifyContent: 'center', gap: 10 }}>
      {loading ? (
        <>
          <span className="spinner" />
          <span>Yuklanmoqda…</span>
          <span className="indet-track" />
        </>
      ) : (
        <>
          <span>{label}</span>
          <ChevIcon size={12} />
        </>
      )}
    </button>
  );
}
