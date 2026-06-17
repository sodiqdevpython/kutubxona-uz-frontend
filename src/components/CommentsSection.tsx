import { useRef, useState, useEffect } from 'react';
import AuthorAvatar from './ui/AuthorAvatar';
import { SendIcon } from './ui/Icons';
import { commentsApi, type ApiComment } from '../lib/api';
import { useAuth } from '../context/AuthContext';

// ── Vaqtni nisbiy ko'rsatish ──────────────────────────────────────────────────

function relTime(iso: string): string {
  const d  = new Date(iso);
  const dt = Math.floor((Date.now() - d.getTime()) / 1000);
  if (dt < 60)     return 'hozir';
  if (dt < 3600)   return `${Math.floor(dt / 60)} daqiqa oldin`;
  if (dt < 86400)  return `${Math.floor(dt / 3600)} soat oldin`;
  if (dt < 604800) return `${Math.floor(dt / 86400)} kun oldin`;
  return d.toLocaleDateString('uz-UZ', { day: 'numeric', month: 'short', year: 'numeric' });
}

function initialsOf(name: string): string {
  return name.split(' ').map(p => p[0]).join('').slice(0, 2).toUpperCase() || '?';
}

// ── Bitta izoh kartochkasi (replies bilan) ────────────────────────────────────

function CommentItem({
  c, depth = 0, isAdmin, onReply, onDelete,
}: {
  c: ApiComment;
  depth?: number;
  isAdmin: boolean;
  onReply: (parent: ApiComment) => void;
  onDelete: (c: ApiComment) => void;
}) {
  return (
    <article style={{
      display: 'grid', gridTemplateColumns: '40px 1fr', gap: 14,
      padding: '20px 0',
      borderTop: depth === 0 ? '1px solid var(--line)' : 'none',
      paddingLeft: depth > 0 ? 16 : 0,
      marginLeft: depth > 0 ? 16 : 0,
      borderLeft: depth > 0 ? '2px solid var(--line)' : undefined,
    }}>
      <AuthorAvatar name={initialsOf(c.name)} idx={(c.name.length) % 5} size={36} />
      <div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, flexWrap: 'wrap', marginBottom: 6 }}>
          <span style={{ fontFamily: 'var(--serif)', fontSize: 14.5, fontWeight: 600, color: 'var(--ink)', letterSpacing: '-0.01em' }}>{c.name}</span>
          <span style={{ fontSize: 11, color: 'var(--ink-4)' }}>· {relTime(c.created_at)}</span>
        </div>
        <p style={{ fontSize: 14, lineHeight: 1.6, color: 'var(--ink-2)', margin: '0 0 8px', whiteSpace: 'pre-wrap' }}>
          {c.text}
        </p>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 14 }}>
          <button onClick={() => onReply(c)}
            style={{ background: 'none', border: 0, padding: 0, fontSize: 11.5, color: 'var(--navy)', fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--sans)' }}>
            ↩ Javob berish
          </button>
          {isAdmin && (
            <button onClick={() => onDelete(c)}
              title="Sharhni o'chirish"
              style={{ background: 'none', border: 0, padding: 0, fontSize: 11.5, color: '#DC2626', fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--sans)' }}>
              🗑 O'chirish
            </button>
          )}
        </div>
        {c.replies && c.replies.length > 0 && (
          <div style={{ marginTop: 12 }}>
            {c.replies.map(r => (
              <CommentItem key={r.id} c={r} depth={depth + 1}
                isAdmin={isAdmin} onReply={onReply} onDelete={onDelete} />
            ))}
          </div>
        )}
      </div>
    </article>
  );
}

// ── Comments bo'limi (maqola yoki jurnal soni uchun) ──────────────────────────

export default function CommentsSection({ articleId, issueId }: { articleId?: string; issueId?: string }) {
  const { user, isAuthenticated } = useAuth();
  const isAdmin = isAuthenticated && !!user?.is_staff;

  const targetId = articleId ?? issueId ?? '';

  const [comments, setComments] = useState<ApiComment[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [name,     setName]     = useState('');
  const [text,     setText]     = useState('');
  const [sending,  setSending]  = useState(false);
  const [error,    setError]    = useState('');
  const [replyTo,  setReplyTo]  = useState<ApiComment | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Daraxtdan comment'ni o'chirish (recursive)
  function removeFromTree(list: ApiComment[], targetId: string): ApiComment[] {
    return list
      .filter(c => c.id !== targetId)
      .map(c => ({ ...c, replies: removeFromTree(c.replies ?? [], targetId) }));
  }

  async function handleDelete(c: ApiComment) {
    if (!confirm(`Sharhni o'chirasizmi?\n\n"${c.text.slice(0, 80)}${c.text.length > 80 ? '…' : ''}"`)) return;
    try {
      await commentsApi.remove(c.id);
      setComments(prev => removeFromTree(prev, c.id));
    } catch (e) {
      alert(`O'chirib bo'lmadi: ${(e as Error).message}`);
    }
  }

  useEffect(() => {
    if (!targetId) return;
    const target = articleId ? { article: articleId } : { issue: issueId! };
    commentsApi.list(target)
      .then(d => { setComments(d.results); setLoading(false); })
      .catch(() => setLoading(false));
  }, [targetId, articleId, issueId]);

  // Total count (replies bilan)
  function countAll(list: ApiComment[]): number {
    return list.reduce((s, c) => s + 1 + countAll(c.replies ?? []), 0);
  }
  const total = countAll(comments);

  function startReply(parent: ApiComment) {
    setReplyTo(parent);
    textareaRef.current?.focus();
    textareaRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  // Reply ni daraxtga qo'shish
  function appendReply(list: ApiComment[], parentId: string, reply: ApiComment): ApiComment[] {
    return list.map(c => {
      if (c.id === parentId) return { ...c, replies: [...(c.replies ?? []), reply] };
      if (c.replies?.length) return { ...c, replies: appendReply(c.replies, parentId, reply) };
      return c;
    });
  }

  async function submit() {
    setError('');
    const trimmed = text.trim();
    if (!trimmed) { setError("Sharh matni bo'sh bo'lmasligi kerak."); return; }
    setSending(true);
    try {
      const body: { article?: string; issue?: string; name: string; text: string; parent?: string } = {
        name:    name.trim() || "Anonim o'quvchi",
        text:    trimmed,
      };
      if (articleId) body.article = articleId;
      else           body.issue   = issueId;
      if (replyTo) body.parent = replyTo.id;

      const created = await commentsApi.create(body);

      if (replyTo) {
        setComments(prev => appendReply(prev, replyTo.id, created));
      } else {
        setComments(prev => [...prev, created]);
      }

      setText(''); setReplyTo(null);
    } catch (e) {
      setError(`Yuborishda xato: ${(e as Error).message}`);
    } finally {
      setSending(false);
    }
  }

  const charCount = text.length;

  return (
    <section style={{ padding: '72px var(--px) 96px', maxWidth: 1340, margin: '0 auto' }}>
      <header style={{ display: 'flex', alignItems: 'end', marginBottom: 28, paddingBottom: 18, borderBottom: '1px solid var(--line)' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 14 }}>
          <h2 className="h-display" style={{ fontSize: 32 }}>Sharhlar</h2>
          <span style={{ fontFamily: 'var(--mono)', fontSize: 13, background: 'var(--grey-2)', color: 'var(--ink-3)', padding: '4px 10px', borderRadius: 4, fontWeight: 600 }}>{total}</span>
        </div>
      </header>

      {/* ── Composer ── */}
      <div style={{ background: 'var(--paper)', border: '1px solid var(--line)', borderRadius: 12, padding: 4, marginBottom: 32, boxShadow: '0 1px 2px rgba(10,25,47,0.04)' }}>
        <div style={{ background: 'linear-gradient(180deg,var(--grey-1),var(--paper))', borderRadius: 10, padding: '18px 20px' }}>

          {/* Reply ko'rsatkichi */}
          {replyTo && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', marginBottom: 14, background: 'var(--navy-08)', borderLeft: '3px solid var(--navy)', borderRadius: 4 }}>
              <div style={{ fontSize: 12, color: 'var(--ink-2)', minWidth: 0 }}>
                <b style={{ color: 'var(--navy)' }}>{replyTo.name}</b> ga javob bermoqdasiz —{' '}
                <span style={{ color: 'var(--ink-3)', fontStyle: 'italic' }}>
                  «{replyTo.text.slice(0, 60)}{replyTo.text.length > 60 ? '…' : ''}»
                </span>
              </div>
              <button onClick={() => setReplyTo(null)}
                style={{ background: 'none', border: 0, padding: 0, fontSize: 16, color: 'var(--ink-3)', cursor: 'pointer', flexShrink: 0, marginLeft: 8 }}>×</button>
            </div>
          )}

          <div style={{ display: 'flex', gap: 14 }}>
            <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--grey-3)', color: 'var(--ink-3)', display: 'grid', placeItems: 'center', fontFamily: 'var(--serif)', fontStyle: 'italic', fontWeight: 600, fontSize: 18, flexShrink: 0 }}>
              {initialsOf(name || "?")}
            </div>
            <div style={{ flex: 1 }}>
              <textarea
                ref={textareaRef}
                value={text} onChange={e => setText(e.target.value)} maxLength={1200}
                placeholder={replyTo ? "Javobingizni yozing…" : "Sharhingizni yozing — ro'yxatdan o'tish shart emas…"}
                style={{ width: '100%', minHeight: 64, border: 0, outline: 0, background: 'transparent', fontFamily: 'var(--sans)', fontSize: 14, color: 'var(--ink)', resize: 'vertical', padding: 0, lineHeight: 1.5 }} />
            </div>
          </div>

          <div className="comment-bar" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 14, paddingTop: 14, borderTop: '1px dashed var(--line)', gap: 10, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 200 }}>
              <div className="field" style={{ height: 34, padding: '0 10px', maxWidth: 220, flex: 1 }}>
                <input value={name} onChange={e => setName(e.target.value)}
                  placeholder="Ismingiz (ixtiyoriy)"
                  maxLength={150}
                  style={{ border: 0, outline: 0, background: 'transparent', fontFamily: 'var(--sans)', fontSize: 12.5, color: 'var(--ink)', flex: 1, minWidth: 0 }} />
              </div>
              {!name.trim() && (
                <span style={{ fontSize: 11.5, color: 'var(--ink-4)' }}>
                  → "Anonim o'quvchi" sifatida
                </span>
              )}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 11, color: 'var(--ink-4)', fontFamily: 'var(--mono)' }}>{charCount} / 1200</span>
              <button onClick={submit} disabled={sending || !text.trim()}
                className="btn primary" style={{ height: 36, opacity: (sending || !text.trim()) ? 0.5 : 1, cursor: (sending || !text.trim()) ? 'default' : 'pointer' }}>
                <SendIcon size={13} /> {sending ? 'Yuborilmoqda…' : 'Yuborish'}
              </button>
            </div>
          </div>

          {error && (
            <div style={{ marginTop: 12, padding: '8px 12px', background: 'rgba(220,38,38,0.06)', border: '1px solid rgba(220,38,38,0.2)', borderRadius: 6, fontSize: 12.5, color: '#DC2626' }}>
              {error}
            </div>
          )}
        </div>
      </div>

      {/* ── Comments list ── */}
      {loading ? (
        <div style={{ padding: '48px 0', textAlign: 'center', color: 'var(--ink-3)', fontSize: 13 }}>Yuklanmoqda…</div>
      ) : comments.length === 0 ? (
        <div style={{ padding: '48px 0', textAlign: 'center', color: 'var(--ink-3)', fontSize: 14 }}>
          Hali sharh yo'q.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {comments.map(c => (
            <CommentItem key={c.id} c={c} isAdmin={isAdmin}
              onReply={startReply} onDelete={handleDelete} />
          ))}
        </div>
      )}
    </section>
  );
}
