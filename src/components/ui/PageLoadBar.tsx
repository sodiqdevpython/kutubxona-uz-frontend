import { useEffect, useState } from 'react';

export default function PageLoadBar() {
  const [done, setDone] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setDone(true), 1600);
    return () => clearTimeout(t);
  }, []);
  if (done) return null;
  return <div className="page-loadbar" aria-hidden="true" />;
}
