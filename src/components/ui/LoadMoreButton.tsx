import { useRef, useState } from 'react';
import { ChevIcon } from './Icons';
import { useI18n } from '../../lib/i18n';

interface Props {
  label?: string;
  onClick?: () => void;
}

export default function LoadMoreButton({ label, onClick }: Props) {
  const { t } = useI18n();
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
          <span>{t('common.loading')}</span>
          <span className="indet-track" />
        </>
      ) : (
        <>
          <span>{label ?? t('common.load_more')}</span>
          <ChevIcon size={12} />
        </>
      )}
    </button>
  );
}
