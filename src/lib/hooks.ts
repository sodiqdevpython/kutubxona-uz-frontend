import { useState, useEffect, useRef } from 'react';

// ── Fetch state union ─────────────────────────────────────────────────────────

export type FetchState<T> =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'ok';    data: T }
  | { status: 'error'; message: string };

/**
 * useFetch<T>(url)
 *
 * Fetches JSON from `url` and returns a typed state union.
 * Pass `null` to skip the fetch (stays in "idle").
 * Automatically aborts in-flight requests when `url` changes or the
 * component unmounts.
 *
 * Usage:
 *   const s = useFetch<ApiArticle[]>(`${BASE}/api/articles/`);
 *   if (s.status === 'ok') console.log(s.data);
 */
export function useFetch<T>(url: string | null): FetchState<T> {
  const [state, setState] = useState<FetchState<T>>({ status: 'idle' });
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (!url) {
      setState({ status: 'idle' });
      return;
    }

    // Abort previous request
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;

    setState({ status: 'loading' });

    fetch(url, { signal: ctrl.signal })
      .then(r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json() as Promise<T>;
      })
      .then(data => {
        if (!ctrl.signal.aborted) {
          setState({ status: 'ok', data });
        }
      })
      .catch(err => {
        if ((err as Error).name !== 'AbortError') {
          setState({ status: 'error', message: String((err as Error).message) });
        }
      });

    return () => ctrl.abort();
  }, [url]);

  return state;
}
