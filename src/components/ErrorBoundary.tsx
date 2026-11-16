import { Component, type ErrorInfo, type ReactNode } from 'react';
import { tr } from '../lib/i18n/runtime';

/**
 * Global xato tutgich — React daraxti qulaganda oq sahifa o'rniga
 * tushunarli xabar va xato matni ko'rsatiladi (diagnostika uchun).
 * Class komponent — hook ishlamaydi, shuning uchun `tr()` (joriy til) ishlatiladi.
 */
interface State { error: Error | null }

export default class ErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[kutubxona] sahifa xatosi:', error, info.componentStack);
  }

  render() {
    if (!this.state.error) return this.props.children;
    const err = this.state.error;
    return (
      <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: 24, background: 'var(--page)', fontFamily: 'var(--sans)' }}>
        <div style={{ maxWidth: 560, width: '100%', background: 'var(--paper)', border: '1px solid var(--line)', borderRadius: 14, padding: '28px 30px' }}>
          <div style={{ fontFamily: 'var(--mono)', fontSize: 11, letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--accent)', marginBottom: 10 }}>{tr('eb.label')}</div>
          <h1 style={{ fontFamily: 'var(--serif)', fontSize: 26, margin: '0 0 8px', color: 'var(--ink)' }}>{tr('eb.title')}</h1>
          <p style={{ fontSize: 14, color: 'var(--ink-2)', margin: '0 0 16px', lineHeight: 1.55 }}>
            {tr('eb.text')}
          </p>
          <pre style={{ background: 'var(--grey-3)', borderRadius: 8, padding: '12px 14px', fontSize: 12, color: 'var(--ink-2)', whiteSpace: 'pre-wrap', wordBreak: 'break-word', margin: '0 0 18px', maxHeight: 220, overflow: 'auto' }}>
            {err.name}: {err.message}{err.stack ? `\n\n${err.stack.split('\n').slice(1, 6).join('\n')}` : ''}
          </pre>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button className="btn primary" onClick={() => window.location.reload()}>{tr('eb.reload')}</button>
            <a className="btn ghost" href="/">{tr('eb.home')}</a>
            <a className="btn ghost" href="/admin">{tr('eb.admin')}</a>
          </div>
        </div>
      </div>
    );
  }
}
