import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Topbar from '../../components/layout/Topbar';
import PageLoadBar from '../../components/ui/PageLoadBar';
import AuthorAvatar from '../../components/ui/AuthorAvatar';
import { SearchIcon, SendIcon, DocIcon } from '../../components/ui/Icons';
import { adminApi, type AdminChat, type ChatMessage } from '../../lib/admin-api';

const POLL_MS  = 5000;   // har 5s chat ro'yxati va aktiv messages yangilanadi
const PAGE_LIMIT = 20;   // bir sahifada nechta chat

// ── Helpers ───────────────────────────────────────────────────────────────────

function relTime(iso: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  const diff = Math.floor((Date.now() - d.getTime()) / 1000);
  if (diff < 60)    return 'hozir';
  if (diff < 3600)  return `${Math.floor(diff / 60)} daq.`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} soat`;
  if (diff < 604800) return `${Math.floor(diff / 86400)} kun`;
  return d.toLocaleDateString('uz-UZ', { day: 'numeric', month: 'short' });
}

function fullTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' });
}

function lastPreview(c: AdminChat): string {
  const lm = c.last_message;
  if (!lm) return 'Suhbat boshlanmagan';
  const prefix = lm.sender === 'admin' ? 'Siz: ' : '';
  if (lm.kind === 'photo')    return `${prefix}🖼 Rasm${lm.text ? ` · ${lm.text}` : ''}`;
  if (lm.kind === 'document') return `${prefix}📎 Fayl${lm.text ? ` · ${lm.text}` : ''}`;
  return prefix + lm.text;
}

// ── Asosiy sahifa ─────────────────────────────────────────────────────────────

export default function AdminChatPage() {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const initialChatId = params.get('chat') ?? null;

  const [chats, setChats]       = useState<AdminChat[]>([]);
  const [chatsLoading, setChatsLoading] = useState(true);
  const [loadingMore, setLoadingMore]   = useState(false);
  const [hasMore, setHasMore]           = useState(false);
  const [nextOffset, setNextOffset]     = useState(0);
  const [search, setSearch]     = useState('');

  const [activeId, setActiveId] = useState<string | null>(initialChatId);
  const activeChat = chats.find(c => c.id === activeId) ?? null;

  const [msgs, setMsgs]         = useState<ChatMessage[]>([]);
  const [msgsLoading, setMsgsLoading] = useState(false);

  const listRef     = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);

  // ── Chat ro'yxati: birinchi sahifa (yoki polling — birinchi sahifani yangilash) ──
  // `refresh = true` bo'lsa: birinchi sahifani qaytadan oladi va mavjudlarga merge qiladi
  //   (scroll qilingan keyingi sahifalar saqlanadi, lekin yangi xabarlar ko'rinadi).
  // `refresh = false` bo'lsa: tozadan boshlab birinchi sahifani yuklaydi.
  const loadFirstPage = useCallback(async (refresh: boolean) => {
    try {
      const data = await adminApi.chat.list({ offset: 0, limit: PAGE_LIMIT });
      if (refresh) {
        // Polling: birinchi sahifa elementlarini yangilaymiz, qolganlarini saqlaymiz
        setChats(prev => {
          const firstIds = new Set(data.results.map(c => c.id));
          const tail = prev.filter(c => !firstIds.has(c.id));
          return [...data.results, ...tail];
        });
      } else {
        setChats(data.results);
        setNextOffset(data.next_offset);
        setHasMore(data.has_more);
      }
    } catch { /* ignore */ }
    setChatsLoading(false);
  }, []);

  // ── Keyingi sahifa ──
  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    try {
      const data = await adminApi.chat.list({ offset: nextOffset, limit: PAGE_LIMIT });
      setChats(prev => {
        const seen = new Set(prev.map(c => c.id));
        const fresh = data.results.filter(c => !seen.has(c.id));
        return [...prev, ...fresh];
      });
      setNextOffset(data.next_offset);
      setHasMore(data.has_more);
    } catch { /* ignore */ }
    setLoadingMore(false);
  }, [loadingMore, hasMore, nextOffset]);

  useEffect(() => {
    loadFirstPage(false);
    const t = setInterval(() => loadFirstPage(true), POLL_MS);
    return () => clearInterval(t);
  }, [loadFirstPage]);

  // ── Infinite scroll: sentinel ko'ringanda loadMore ──
  useEffect(() => {
    const root = listRef.current;
    const sentinel = sentinelRef.current;
    if (!root || !sentinel) return;
    const io = new IntersectionObserver(
      entries => { if (entries[0].isIntersecting) loadMore(); },
      { root, rootMargin: '120px', threshold: 0 }
    );
    io.observe(sentinel);
    return () => io.disconnect();
  }, [loadMore]);

  // ── Faol chat xabarlari ────────────────────────────────────────────────
  const loadMessages = useCallback(async (cid: string) => {
    setMsgsLoading(true);
    try {
      const data = await adminApi.chat.messages(cid);
      setMsgs(data);
      // Faol chatga kirgan zahoti — markRead
      await adminApi.chat.markRead(cid);
      setChats(prev => prev.map(c => c.id === cid ? { ...c, unread_count: 0 } : c));
    } catch { /* ignore */ }
    setMsgsLoading(false);
  }, []);

  useEffect(() => {
    if (!activeId) { setMsgs([]); return; }
    loadMessages(activeId);
    const t = setInterval(() => loadMessages(activeId), POLL_MS);
    return () => clearInterval(t);
  }, [activeId, loadMessages]);

  // ── Chat select ────────────────────────────────────────────────────────
  function selectChat(c: AdminChat) {
    setActiveId(c.id);
    setParams(prev => { prev.set('chat', c.id); return prev; }, { replace: true });
  }

  // ── Yangi chat ochish (mualliflar sahifadan ?author=slug bilan kelinsa) ──
  const authorParam = params.get('author');
  useEffect(() => {
    if (!authorParam) return;
    (async () => {
      try {
        const ch = await adminApi.chat.byAuthor(authorParam);
        // List'da bormi?
        setChats(prev => {
          if (prev.some(c => c.id === ch.id)) return prev;
          return [ch, ...prev];
        });
        setActiveId(ch.id);
        setParams(prev => { prev.delete('author'); prev.set('chat', ch.id); return prev; }, { replace: true });
      } catch (e) {
        alert(`Chat ochib bo'lmadi: ${(e as Error).message}`);
      }
    })();
  }, [authorParam, setParams]);

  // ── Filtered list ─────────────────────────────────────────────────────
  const filteredChats = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return chats;
    return chats.filter(c =>
      c.author_name.toLowerCase().includes(q) ||
      c.telegram_username.toLowerCase().includes(q) ||
      (c.last_message?.text ?? '').toLowerCase().includes(q)
    );
  }, [chats, search]);

  // ── Block toggle ──────────────────────────────────────────────────────
  async function toggleBlock() {
    if (!activeChat) return;
    try {
      const res = await adminApi.chat.toggleBlock(activeChat.id);
      setChats(prev => prev.map(c => c.id === activeChat.id ? { ...c, is_blocked: res.is_blocked } : c));
    } catch (e) { alert(`Xatolik: ${(e as Error).message}`); }
  }

  // ── Delete ────────────────────────────────────────────────────────────
  async function deleteChat() {
    if (!activeChat) return;
    const ok = window.confirm(
      `«${activeChat.author_name}» bilan butun suhbat va xabarlar o'chiriladi. Davom etilsinmi?`
    );
    if (!ok) return;
    try {
      await adminApi.chat.remove(activeChat.id);
      setChats(prev => prev.filter(c => c.id !== activeChat.id));
      setActiveId(null);
      setMsgs([]);
      setParams(prev => { prev.delete('chat'); return prev; }, { replace: true });
    } catch (e) { alert(`O'chirib bo'lmadi: ${(e as Error).message}`); }
  }

  return (
    <div className="bg-articles" style={{ minHeight: '100vh' }}>
      <PageLoadBar />
      <Topbar active="admin-chat" />

      {/* Header */}
      <div style={{ padding: '32px var(--px) 20px', maxWidth: 1400, margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10, fontSize: 12.5, color: 'var(--ink-3)' }}>
          <a onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>Bosh sahifa</a>
          <span style={{ color: 'var(--ink-4)' }}>/</span>
          <span style={{ color: 'var(--ink-2)', fontWeight: 500 }}>Xabarlar</span>
        </div>
        <h1 className="h-display h1-rsp" style={{ fontSize: 36, marginBottom: 4 }}>Xabarlar</h1>
        <p style={{ fontSize: 13.5, color: 'var(--ink-3)' }}>
          Mualliflar bilan Telegram orqali suhbatlashish. Birinchi xabarni siz yuborasiz —
          shundagina foydalanuvchi javob bera oladi.
        </p>
      </div>

      {/* Telegram-style layout */}
      <div style={{
        padding: '0 var(--px) 32px', maxWidth: 1400, margin: '0 auto',
        display: 'grid', gridTemplateColumns: '340px 1fr', gap: 16,
        minHeight: 'calc(100vh - 280px)',
      }}>

        {/* ── LEFT: Chats list ── */}
        <div style={{
          background: 'var(--paper)', border: '1px solid var(--line)',
          borderRadius: 12, overflow: 'hidden',
          display: 'flex', flexDirection: 'column',
          minHeight: 0,
        }}>
          {/* Search */}
          <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--line)' }}>
            <div className="searchbar" style={{ height: 38, width: '100%', minWidth: 'auto' }}>
              <SearchIcon size={14} style={{ color: 'var(--ink-4)', flexShrink: 0 }} />
              <input value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Qidirish…" style={{ fontSize: 13 }} />
              {search && <button onClick={() => setSearch('')}
                style={{ background: 'none', border: 0, cursor: 'pointer', color: 'var(--ink-3)', fontSize: 14, lineHeight: 1 }}>×</button>}
            </div>
          </div>

          {/* Chats */}
          <div ref={listRef} style={{ flex: 1, overflowY: 'auto' }}>
            {chatsLoading ? (
              <div style={{ padding: '32px 16px', textAlign: 'center', color: 'var(--ink-3)', fontSize: 13 }}>Yuklanmoqda…</div>
            ) : filteredChats.length === 0 ? (
              <div style={{ padding: '32px 16px', textAlign: 'center', color: 'var(--ink-3)', fontSize: 13 }}>
                {search ? 'Topilmadi' : (
                  <>
                    Hali suhbat yo'q.<br/>
                    <span style={{ fontSize: 12, color: 'var(--ink-4)' }}>
                      Foydalanuvchidan Telegram orqali xabar kelganda bu yerda ko'rinadi.
                    </span>
                  </>
                )}
              </div>
            ) : (
              filteredChats.map(c => {
                const active = c.id === activeId;
                return (
                  <button
                    key={c.id}
                    onClick={() => selectChat(c)}
                    style={{
                      display: 'grid', gridTemplateColumns: '44px 1fr auto', gap: 10,
                      width: '100%', padding: '12px 16px', border: 0,
                      background: active ? 'rgba(10,25,47,0.06)' : 'transparent',
                      cursor: 'pointer', borderBottom: '1px solid var(--line)',
                      textAlign: 'left', alignItems: 'center',
                      fontFamily: 'var(--sans)',
                    }}
                    className="pill-hover"
                  >
                    <AuthorAvatar name={c.author_initials} idx={c.author_avatar_idx} size={44} />
                    <div style={{ minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                        <span style={{
                          fontSize: 14, fontWeight: 600, color: 'var(--ink)',
                          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                          flex: 1, minWidth: 0,
                        }}>
                          {c.author_name}
                        </span>
                        {c.is_blocked && (
                          <span style={{ fontSize: 9.5, color: '#DC2626', fontWeight: 700, letterSpacing: 0.18, textTransform: 'uppercase', flexShrink: 0 }}>
                            BLOK
                          </span>
                        )}
                      </div>
                      <div style={{
                        fontSize: 12, color: c.unread_count > 0 ? 'var(--ink-2)' : 'var(--ink-3)',
                        marginTop: 2,
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                        fontWeight: c.unread_count > 0 ? 500 : 400,
                      }}>
                        {lastPreview(c)}
                      </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, flexShrink: 0 }}>
                      <span style={{ fontSize: 10.5, color: 'var(--ink-4)', fontFamily: 'var(--mono)' }}>
                        {relTime(c.last_message_at)}
                      </span>
                      {c.unread_count > 0 && (
                        <span style={{
                          minWidth: 18, height: 18, padding: '0 5px',
                          borderRadius: 9, background: 'var(--navy)', color: 'white',
                          fontSize: 10.5, fontWeight: 700,
                          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                          {c.unread_count > 99 ? '99+' : c.unread_count}
                        </span>
                      )}
                    </div>
                  </button>
                );
              })
            )}

            {/* Infinite-scroll sentinel + loader */}
            {!chatsLoading && !search && hasMore && (
              <div ref={sentinelRef} style={{
                padding: '14px 16px', textAlign: 'center',
                color: 'var(--ink-3)', fontSize: 12,
              }}>
                {loadingMore ? 'Yuklanmoqda…' : ''}
              </div>
            )}
          </div>
        </div>

        {/* ── RIGHT: Active chat ── */}
        <div style={{
          background: 'var(--paper)', border: '1px solid var(--line)',
          borderRadius: 12, overflow: 'hidden',
          display: 'flex', flexDirection: 'column',
          minHeight: 0,
        }}>
          {activeChat ? (
            <ChatPane chat={activeChat} messages={msgs} loading={msgsLoading}
              onSent={(m: ChatMessage) => {
                setMsgs(prev => [...prev, m]);
                // List'da last_message yangilash
                setChats(prev => prev.map(c => c.id === activeChat.id
                  ? { ...c, last_message_at: m.created_at, last_message: { text: m.text, kind: m.kind, sender: 'admin', created_at: m.created_at } }
                  : c
                ));
              }}
              onToggleBlock={toggleBlock}
              onDelete={deleteChat}
            />
          ) : (
            <div style={{
              flex: 1, display: 'grid', placeItems: 'center',
              color: 'var(--ink-3)', fontSize: 14,
              background: 'var(--grey-1)',
            }}>
              <div style={{ textAlign: 'center', padding: 40 }}>
                <div style={{ fontSize: 40, opacity: 0.3, marginBottom: 12 }}>💬</div>
                Suhbat tanlang yoki yangi suhbat boshlang
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Chat pane (suhbat oynasi) ───────────────────────────────────────────────

function ChatPane({ chat, messages, loading, onSent, onToggleBlock, onDelete }: {
  chat: AdminChat;
  messages: ChatMessage[];
  loading: boolean;
  onSent: (m: ChatMessage) => void;
  onToggleBlock: () => void;
  onDelete: () => void;
}) {
  const navigate = useNavigate();
  const [text, setText]     = useState('');
  const [sending, setSending] = useState(false);
  const [image, setImage]   = useState<File | null>(null);
  const [doc, setDoc]       = useState<File | null>(null);
  const fileImgRef = useRef<HTMLInputElement>(null);
  const fileDocRef = useRef<HTMLInputElement>(null);
  const scrollRef  = useRef<HTMLDivElement>(null);

  // Auto-scroll pastga
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages.length]);

  function pickImage(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!f.type.startsWith('image/')) { alert('Rasm fayl tanlang'); return; }
    setImage(f); setDoc(null);
  }
  function pickDoc(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setDoc(f); setImage(null);
  }

  async function send() {
    const t = text.trim();
    if (!t && !image && !doc) return;
    setSending(true);
    try {
      const m = await adminApi.chat.send(chat.id, { text: t, image, document: doc });
      onSent(m);
      setText(''); setImage(null); setDoc(null);
      if (fileImgRef.current) fileImgRef.current.value = '';
      if (fileDocRef.current) fileDocRef.current.value = '';
    } catch (e) {
      alert(`Yuborib bo'lmadi: ${(e as Error).message}`);
    }
    setSending(false);
  }

  return (
    <>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '12px 18px', borderBottom: '1px solid var(--line)',
        background: 'var(--paper)',
      }}>
        <AuthorAvatar name={chat.author_initials} idx={chat.author_avatar_idx} size={40} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14.5, fontWeight: 600, color: 'var(--ink)' }}>{chat.author_name}</div>
          <div style={{ fontSize: 11.5, color: 'var(--ink-3)', marginTop: 1 }}>
            {chat.telegram_username ? `@${chat.telegram_username}` : 'Telegram'}
            {chat.is_blocked && <span style={{ color: '#DC2626', fontWeight: 600, marginLeft: 8 }}>· BLOKLANGAN</span>}
          </div>
        </div>
        <button onClick={() => navigate(`/authors/${chat.author_slug}`)}
          className="btn ghost" style={{ height: 32, fontSize: 12 }}>
          Profil
        </button>
        <button onClick={onToggleBlock}
          style={{
            height: 32, padding: '0 12px', borderRadius: 6,
            border: `1px solid ${chat.is_blocked ? 'var(--line)' : 'rgba(220,38,38,0.25)'}`,
            background: chat.is_blocked ? 'var(--paper)' : 'rgba(220,38,38,0.06)',
            color: chat.is_blocked ? 'var(--ink-2)' : '#DC2626',
            cursor: 'pointer', fontSize: 12, fontWeight: 600, fontFamily: 'var(--sans)',
          }}>
          {chat.is_blocked ? '🔓 Bloklikni olib tashlash' : '🚫 Bloklash'}
        </button>
        <button onClick={onDelete}
          title="Suhbatni o'chirish"
          style={{
            height: 32, padding: '0 12px', borderRadius: 6,
            border: '1px solid rgba(220,38,38,0.35)',
            background: '#DC2626',
            color: 'white',
            cursor: 'pointer', fontSize: 12, fontWeight: 600, fontFamily: 'var(--sans)',
          }}>
          🗑 O'chirish
        </button>
      </div>

      {/* Messages */}
      <div ref={scrollRef} style={{
        flex: 1, overflowY: 'auto', padding: '20px 22px',
        background: 'linear-gradient(180deg, var(--grey-1), var(--paper))',
        display: 'flex', flexDirection: 'column', gap: 8,
      }}>
        {loading && messages.length === 0 ? (
          <div style={{ textAlign: 'center', color: 'var(--ink-3)', fontSize: 13, padding: 30 }}>
            Yuklanmoqda…
          </div>
        ) : messages.length === 0 ? (
          <div style={{ textAlign: 'center', color: 'var(--ink-3)', fontSize: 13, padding: 30, fontStyle: 'italic' }}>
            Hozircha xabar yo'q. Birinchi xabarni yozing — foydalanuvchi shundan keyin javob bera oladi.
          </div>
        ) : (
          messages.map((m, i) => {
            const prev = messages[i - 1];
            const sameAuthor = prev && prev.sender === m.sender;
            const isAdmin = m.sender === 'admin';
            return (
              <div key={m.id} style={{
                display: 'flex',
                justifyContent: isAdmin ? 'flex-end' : 'flex-start',
                marginTop: sameAuthor ? 0 : 6,
              }}>
                <div style={{
                  maxWidth: '70%',
                  padding: m.kind === 'photo' && !m.text ? 4 : '8px 12px 6px',
                  borderRadius: isAdmin ? '12px 12px 4px 12px' : '12px 12px 12px 4px',
                  background: isAdmin ? 'var(--navy)' : 'var(--paper)',
                  color: isAdmin ? 'white' : 'var(--ink)',
                  border: isAdmin ? 'none' : '1px solid var(--line)',
                  boxShadow: '0 1px 2px rgba(10,25,47,0.04)',
                  fontSize: 14, lineHeight: 1.5,
                  wordBreak: 'break-word',
                }}>
                  {m.kind === 'photo' && m.image_url && (
                    <img src={m.image_url} alt="" style={{
                      width: '100%', maxWidth: 320, maxHeight: 280,
                      objectFit: 'cover', borderRadius: 8, display: 'block',
                      marginBottom: m.text ? 8 : 0,
                    }} />
                  )}
                  {m.kind === 'document' && m.document_url && (
                    <a href={m.document_url} target="_blank" rel="noreferrer"
                      style={{
                        display: 'flex', alignItems: 'center', gap: 10,
                        padding: '8px 10px', borderRadius: 6,
                        background: isAdmin ? 'rgba(255,255,255,0.1)' : 'var(--grey-2)',
                        color: isAdmin ? 'white' : 'var(--ink-2)',
                        textDecoration: 'none', fontSize: 13, fontWeight: 500,
                        marginBottom: m.text ? 8 : 0,
                      }}>
                      <DocIcon size={16} />
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {m.document_name || 'Fayl'}
                      </span>
                    </a>
                  )}
                  {m.text && (
                    <div style={{ whiteSpace: 'pre-wrap' }}>{m.text}</div>
                  )}
                  <div style={{
                    fontSize: 10.5, color: isAdmin ? 'rgba(255,255,255,0.55)' : 'var(--ink-4)',
                    marginTop: 4, textAlign: 'right', fontFamily: 'var(--mono)',
                  }}>
                    {fullTime(m.created_at)}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Composer */}
      <div style={{ borderTop: '1px solid var(--line)', padding: '12px 16px', background: 'var(--paper)' }}>
        {(image || doc) && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '8px 12px', marginBottom: 10,
            background: 'var(--grey-2)', borderRadius: 8,
            fontSize: 12.5, color: 'var(--ink-2)',
          }}>
            {image && (
              <>
                <img src={URL.createObjectURL(image)} alt="" style={{ width: 36, height: 36, objectFit: 'cover', borderRadius: 4 }} />
                <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{image.name}</span>
              </>
            )}
            {doc && (
              <>
                <DocIcon size={16} style={{ color: 'var(--ink-3)' }} />
                <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{doc.name}</span>
              </>
            )}
            <button onClick={() => { setImage(null); setDoc(null); }}
              style={{ background: 'none', border: 0, cursor: 'pointer', color: 'var(--ink-3)', fontSize: 16, lineHeight: 1 }}>✕</button>
          </div>
        )}

        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8 }}>
          {/* Attach buttons */}
          <input ref={fileImgRef} type="file" accept="image/*" onChange={pickImage} style={{ display: 'none' }} />
          <input ref={fileDocRef} type="file" onChange={pickDoc} style={{ display: 'none' }} />
          <button onClick={() => fileImgRef.current?.click()}
            title="Rasm yuborish" disabled={chat.is_blocked || sending}
            className="icon-btn"
            style={{ width: 38, height: 38 }}>
            🖼
          </button>
          <button onClick={() => fileDocRef.current?.click()}
            title="Fayl yuborish" disabled={chat.is_blocked || sending}
            className="icon-btn"
            style={{ width: 38, height: 38 }}>
            📎
          </button>

          {/* Textarea */}
          <textarea
            value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
            }}
            placeholder={chat.is_blocked ? 'Bu suhbat bloklangan' : 'Xabar yozing… (Enter — yuborish)'}
            disabled={chat.is_blocked || sending}
            rows={1}
            style={{
              flex: 1, resize: 'none', maxHeight: 120,
              border: '1px solid var(--line-2)', borderRadius: 8,
              padding: '10px 12px',
              fontFamily: 'var(--sans)', fontSize: 14, color: 'var(--ink)',
              background: 'var(--grey-2)', outline: 'none',
              lineHeight: 1.4, minHeight: 38,
            }}
          />

          <button onClick={send} disabled={(!text.trim() && !image && !doc) || sending || chat.is_blocked}
            style={{
              width: 40, height: 40, borderRadius: 8, border: 0,
              background: ((!text.trim() && !image && !doc) || sending || chat.is_blocked)
                ? 'var(--navy-30)' : 'var(--navy)',
              color: 'white', cursor: 'pointer',
              display: 'grid', placeItems: 'center', flexShrink: 0,
            }}>
            <SendIcon size={16} />
          </button>
        </div>
      </div>
    </>
  );
}
