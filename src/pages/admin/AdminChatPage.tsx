import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import AdminShell from '../../components/admin/AdminShell';
import AuthorAvatar from '../../components/ui/AuthorAvatar';
import { adminApi, type AdminAuthorDetail, type AdminChat, type ChatMessage } from '../../lib/admin-api';
import { connectAdminChat, type ChatEvent, type ChatSocketStatus } from '../../lib/chat-socket';
import { mediaUrl } from '../../lib/config';

/**
 * Xabarlar — Figma «Xabarlar»: chapda suhbatlar (filtr, qidiruv), o'rtada suhbat
 * (banner, sana ajratgichlari, tez javoblar), o'ngda muallif kartasi + ko'rib
 * chiqilayotgan maqola + statistika.
 *
 * Tuzatishlar: yuborilgan xabar ikki marta ko'rinmaydi (REST javobi + WS hodisasi
 * id bo'yicha birlashtiriladi); WS ulanmasa sahifa hech qayerga o'tmaydi —
 * har 8 soniyada HTTP orqali yangilanadi.
 */

const PAGE_LIMIT = 20;
const POLL_MS = 8000;
type Filter = 'all' | 'waiting' | 'closed';
const QUICK: { label: string; text: string }[] = [
  { label: 'Taqrizga yuborildi', text: "Assalomu alaykum! Maqolangiz taqrizga yuborildi. Xulosa 21 kun ichida bo'ladi." },
  { label: 'Tuzatish kerak',     text: "Maqolangizda tuzatish talab qilinadi: adabiyotlar ro'yxati va annotatsiyani jurnal talablariga moslab qayta yuboring." },
  { label: 'Shablonni yuborish', text: "Maqolani jurnal shabloniga muvofiq rasmiylashtiring — qo'llanma: journalkutubxona.uz/about/guide" },
];

const MONTHS = ['yanvar', 'fevral', 'mart', 'aprel', 'may', 'iyun', 'iyul', 'avgust', 'sentabr', 'oktabr', 'noyabr', 'dekabr'];
const hhmm = (iso: string) => { const x = new Date(iso); return `${String(x.getHours()).padStart(2, '0')}:${String(x.getMinutes()).padStart(2, '0')}`; };
function listTime(iso: string | null): string {
  if (!iso) return '';
  const x = new Date(iso), now = new Date();
  if (x.toDateString() === now.toDateString()) return hhmm(iso);
  const y = new Date(now); y.setDate(now.getDate() - 1);
  if (x.toDateString() === y.toDateString()) return 'kecha';
  return `${x.getDate()}-${MONTHS[x.getMonth()].slice(0, 3)}`;
}
const dayLabel = (iso: string) => { const x = new Date(iso); return `${x.getDate()}-${MONTHS[x.getMonth()]}${x.getFullYear() !== new Date().getFullYear() ? ` ${x.getFullYear()}` : ''}`; };
function waitingHours(c: AdminChat): number | null {
  if (!c.last_message || c.last_message.sender !== 'user' || !c.last_message_at) return null;
  return Math.max(0, Math.floor((Date.now() - new Date(c.last_message_at).getTime()) / 3600000));
}
function preview(c: AdminChat): string {
  const lm = c.last_message; if (!lm) return 'Suhbat boshlanmagan';
  const p = lm.sender === 'admin' ? 'Siz: ' : '';
  return p + (lm.kind === 'photo' ? `Rasm${lm.text ? ` · ${lm.text}` : ''}` : lm.kind === 'document' ? `Fayl${lm.text ? ` · ${lm.text}` : ''}` : lm.text);
}
const sortChats = (l: AdminChat[]) => [...l].sort((a, b) => new Date(b.last_message_at ?? b.created_at).getTime() - new Date(a.last_message_at ?? a.created_at).getTime());

export default function AdminChatPage() {
  const [params, setParams] = useSearchParams();
  const [chats, setChats]   = useState<AdminChat[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(false);
  const [nextOffset, setNextOffset] = useState(0);
  const [filter, setFilter] = useState<Filter>('all');
  const [search, setSearch] = useState('');
  const [activeId, setActiveId] = useState<string | null>(params.get('chat'));
  const [msgs, setMsgs]     = useState<ChatMessage[]>([]);
  const [wsStatus, setWsStatus] = useState<ChatSocketStatus>('connecting');
  const [author, setAuthor] = useState<AdminAuthorDetail | null>(null);
  const [menu, setMenu]     = useState(false);
  const [toast, setToast]   = useState('');
  const activeIdRef = useRef<string | null>(activeId);
  useEffect(() => { activeIdRef.current = activeId; }, [activeId]);
  const activeChat = chats.find(c => c.id === activeId) ?? null;
  function flash(t: string) { setToast(t); setTimeout(() => setToast(''), 3500); }

  // ── Ro'yxat ──
  const loadFirst = useCallback((merge: boolean) =>
    adminApi.chat.list({ offset: 0, limit: PAGE_LIMIT }).then(d => {
      if (!merge) { setNextOffset(d.next_offset); setHasMore(d.has_more); setChats(d.results); }
      else {
        const ids = new Set(d.results.map(c => c.id));
        setChats(prev => sortChats([...d.results, ...prev.filter(c => !ids.has(c.id))]));
      }
    }).catch(() => {}).finally(() => setLoading(false)),
  []);
  async function loadMore() {
    if (!hasMore) return;
    try { const d = await adminApi.chat.list({ offset: nextOffset, limit: PAGE_LIMIT }); setChats(p => { const s = new Set(p.map(c => c.id)); return [...p, ...d.results.filter(c => !s.has(c.id))]; }); setNextOffset(d.next_offset); setHasMore(d.has_more); } catch { /* */ }
  }
  useEffect(() => { loadFirst(false); }, [loadFirst]);

  // ── Faol suhbat ──
  const loadMessages = useCallback((cid: string, silent = false) =>
    adminApi.chat.messages(cid).then(data => {
      setMsgs(prev => (silent && prev.length === data.length && prev[prev.length - 1]?.id === data[data.length - 1]?.id ? prev : data));
      if (!silent) return adminApi.chat.markRead(cid).then(() => setChats(p => p.map(c => (c.id === cid ? { ...c, unread_count: 0 } : c))));
    }).catch(() => {}),
  []);
  // Suhbat almashganda eski xabarlar/muallif render vaqtida darhol tozalanadi
  const [msgsFor, setMsgsFor] = useState<string | null>(activeId);
  if (msgsFor !== activeId) { setMsgsFor(activeId); setMsgs([]); setAuthor(null); }
  useEffect(() => { if (activeId) loadMessages(activeId); }, [activeId, loadMessages]);
  const activeAuthorId = activeChat?.author_id;
  useEffect(() => {
    if (!activeAuthorId) return;
    adminApi.authors.get(activeAuthorId).then(setAuthor).catch(() => setAuthor(null));
  }, [activeAuthorId]);

  // ── WebSocket ──
  const upsert = useCallback((c: AdminChat) => setChats(p => sortChats(p.some(x => x.id === c.id) ? p.map(x => (x.id === c.id ? { ...x, ...c } : x)) : [c, ...p])), []);
  const onEvent = useCallback((e: ChatEvent) => {
    switch (e.event) {
      case 'message.created':
        if (activeIdRef.current === e.chat_id) {
          setMsgs(p => (p.some(m => m.id === e.message.id) ? p : [...p, e.message]));
          if (e.message.sender === 'user') { adminApi.chat.markRead(e.chat_id).catch(() => {}); upsert({ ...e.chat, unread_count: 0 }); return; }
        }
        upsert(e.chat); break;
      case 'chat.updated': upsert(e.chat); break;
      case 'chat.deleted': setChats(p => p.filter(c => c.id !== e.chat_id)); if (activeIdRef.current === e.chat_id) setActiveId(null); break;
      case 'chat.read': setChats(p => p.map(c => (c.id === e.chat_id ? { ...c, unread_count: 0 } : c))); break;
      default: break;
    }
  }, [upsert]);
  useEffect(() => connectAdminChat({
    onEvent, onStatus: setWsStatus,
    onResync: () => { loadFirst(true); if (activeIdRef.current) loadMessages(activeIdRef.current, true); },
    // Token bilan ulanib bo'lmasa — sahifadan chiqib ketmaymiz, HTTP yangilash ishlayveradi
    onAuthError: () => setWsStatus('offline'),
  }), [onEvent, loadFirst, loadMessages]);

  // ── WS yo'q bo'lsa — HTTP orqali yangilab turamiz ──
  useEffect(() => {
    if (wsStatus === 'open') return;
    const t = setInterval(() => { loadFirst(true); if (activeIdRef.current) loadMessages(activeIdRef.current, true); }, POLL_MS);
    return () => clearInterval(t);
  }, [wsStatus, loadFirst, loadMessages]);

  // ── ?author=slug bilan kelinsa ──
  const authorParam = params.get('author');
  useEffect(() => {
    if (!authorParam) return;
    adminApi.chat.byAuthor(authorParam).then(ch => {
      setChats(p => (p.some(c => c.id === ch.id) ? p : [ch, ...p]));
      setActiveId(ch.id);
      setParams(prev => { prev.delete('author'); prev.set('chat', ch.id); return prev; }, { replace: true });
    }).catch(e => flash(`Chat ochib bo‘lmadi: ${(e as Error).message}`));
  }, [authorParam, setParams]);

  function select(c: AdminChat) { setActiveId(c.id); setMenu(false); setParams(prev => { prev.set('chat', c.id); return prev; }, { replace: true }); }

  const counts = useMemo(() => ({ all: chats.length, waiting: chats.filter(c => c.unread_count > 0).length, closed: chats.filter(c => c.unread_count === 0).length }), [chats]);
  const list = useMemo(() => {
    const q = search.trim().toLowerCase();
    return chats.filter(c => (filter === 'all' || (filter === 'waiting' ? c.unread_count > 0 : c.unread_count === 0))
      && (!q || c.author_name.toLowerCase().includes(q) || c.telegram_username.toLowerCase().includes(q)));
  }, [chats, filter, search]);

  async function toggleBlock() { if (!activeChat) return; try { const r = await adminApi.chat.toggleBlock(activeChat.id); setChats(p => p.map(c => (c.id === activeChat.id ? { ...c, is_blocked: r.is_blocked } : c))); } catch (e) { flash(`Xatolik: ${(e as Error).message}`); } setMenu(false); }
  async function removeChat() {
    if (!activeChat || !confirm(`«${activeChat.author_name}» bilan suhbat va xabarlar o‘chirilsinmi?`)) return;
    try { await adminApi.chat.remove(activeChat.id); setChats(p => p.filter(c => c.id !== activeChat.id)); setActiveId(null); setParams(prev => { prev.delete('chat'); return prev; }, { replace: true }); } catch (e) { flash(`Xatolik: ${(e as Error).message}`); }
    setMenu(false);
  }
  async function markClosed() { if (!activeChat) return; try { await adminApi.chat.markRead(activeChat.id); setChats(p => p.map(c => (c.id === activeChat.id ? { ...c, unread_count: 0, last_message: c.last_message ? { ...c.last_message, sender: 'admin' } : c.last_message } : c))); } catch { /* */ } }

  return (
    <AdminShell active="chat" crumb="Xabarlar">
      <div className="ch-wrap">
        {/* ── Chap: suhbatlar ── */}
        <div className="ch-list">
          <div className="ch-filters">
            {([['all', 'Barchasi'], ['waiting', 'Javob kutmoqda'], ['closed', 'Yopilgan']] as [Filter, string][]).map(([k, l]) => (
              <button key={k} className={filter === k ? 'on' : ''} onClick={() => setFilter(k)}>{l}<span>{counts[k]}</span></button>
            ))}
          </div>
          <div className="ch-search">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/></svg>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Ism yoki @username" />
          </div>
          <div className="ch-items" onScroll={e => { const el = e.currentTarget; if (el.scrollTop + el.clientHeight >= el.scrollHeight - 80) loadMore(); }}>
            {loading && <div className="sub-empty" style={{ padding: 30 }}>Yuklanmoqda…</div>}
            {!loading && list.length === 0 && <div className="sub-empty" style={{ padding: 30 }}>{search ? 'Topilmadi' : 'Hali suhbat yo‘q'}</div>}
            {list.map(c => (
              <button key={c.id} className={`ch-item${c.id === activeId ? ' on' : ''}`} onClick={() => select(c)}>
                <span className="ava"><AuthorAvatar name={c.author_initials} idx={c.author_avatar_idx} size={40} />{c.unread_count > 0 && <span className="un" />}</span>
                <span style={{ minWidth: 0 }}>
                  <span className="top"><span className="nm">{c.author_name}</span><span className="tm">{listTime(c.last_message_at)}</span></span>
                  <span className="pv">{preview(c)}</span>
                  {c.unread_count > 0 && <span className="chip-m accent">Javob kutmoqda</span>}
                  {c.is_blocked && <span className="chip-m red" style={{ marginTop: 6 }}>Bloklangan</span>}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* ── O'rta: suhbat ── */}
        <div className="ch-main">
          {!activeChat ? <div className="ch-empty">Suhbat tanlang</div> : (
            <Conversation chat={activeChat} msgs={msgs} wsStatus={wsStatus} menu={menu} setMenu={setMenu}
              onSent={m => { setMsgs(p => (p.some(x => x.id === m.id) ? p : [...p, m])); setChats(p => p.map(c => (c.id === activeChat.id ? { ...c, last_message_at: m.created_at, last_message: { text: m.text, kind: m.kind, sender: 'admin', created_at: m.created_at } } : c))); }}
              onBlock={toggleBlock} onDelete={removeChat} onClose={markClosed} author={author} />
          )}
        </div>

        {/* ── O'ng: muallif ── */}
        <aside className="ch-side">
          {activeChat && (
            <>
              <div className="ch-side-card">
                <div className="ava-lg">{author?.avatar_url ? <img src={mediaUrl(author.avatar_url) ?? undefined} alt="" /> : activeChat.author_initials}</div>
                <div className="nm">{activeChat.author_name}</div>
                <div className="org">{author ? ([author.org, author.role].filter(Boolean).join(' · ') || (activeChat.telegram_username ? `@${activeChat.telegram_username}` : 'Telegram')) : '…'}</div>
                <Link to={`/admin/authors/${activeChat.author_id}`} className="ab sm block">Profilni ochish</Link>
              </div>
              <div className="ch-side-card">
                <div className="lbl">Ko‘rib chiqilayotgan maqola</div>
                {author?.pending_submission ? (
                  <div className="ch-art">
                    <span className="chip-m blue">Taqrizda</span>
                    <div className="t">{author.pending_submission.title || 'Sarlavhasiz'}</div>
                    <div className="m">{dayLabel(author.pending_submission.submitted_at)}</div>
                    <Link to={`/admin/submissions/${author.pending_submission.id}`} className="ab sm block">Maqolaga o‘tish</Link>
                  </div>
                ) : <div className="meta" style={{ fontSize: 13, color: 'var(--ink-3)' }}>Hozir ko‘rib chiqilayotgan maqola yo‘q.</div>}
              </div>
              <div className="ch-side-card" style={{ borderBottom: 0 }}>
                <div className="lbl">Muallif statistikasi</div>
                <div className="ch-stat"><span>Nashr etilgan</span><b>{author?.stats.published ?? '—'}</b></div>
                <div className="ch-stat"><span>Ko‘rib chiqilmoqda</span><b className={author?.stats.pending ? 'accent' : ''}>{author?.stats.pending || '—'}</b></div>
                <div className="ch-stat"><span>Rad etilgan</span><b>{author?.stats.rejected || '—'}</b></div>
              </div>
            </>
          )}
        </aside>
      </div>
      {toast && <div className="adm-toast">{toast}</div>}
    </AdminShell>
  );
}

// ── Suhbat oynasi ─────────────────────────────────────────────────────────────

function Conversation({ chat, msgs, wsStatus, menu, setMenu, onSent, onBlock, onDelete, onClose, author }: {
  chat: AdminChat; msgs: ChatMessage[]; wsStatus: ChatSocketStatus; menu: boolean; setMenu: (v: boolean) => void;
  onSent: (m: ChatMessage) => void; onBlock: () => void; onDelete: () => void; onClose: () => void; author: AdminAuthorDetail | null;
}) {
  const [text, setText] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [sending, setSending] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  useEffect(() => { if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight; }, [msgs.length, chat.id]);

  const waiting = waitingHours(chat);

  async function send() {
    const t = text.trim(); if (!t && !file) return;
    setSending(true);
    try {
      const isImg = !!file && file.type.startsWith('image/');
      const m = await adminApi.chat.send(chat.id, { text: t, image: isImg ? file : null, document: !isImg ? file : null });
      onSent(m); setText(''); setFile(null); if (fileRef.current) fileRef.current.value = '';
    } catch (e) { alert(`Yuborib bo‘lmadi: ${(e as Error).message}`); }
    setSending(false);
  }

  return (
    <>
      <div className="ch-head">
        <AuthorAvatar name={chat.author_initials} idx={chat.author_avatar_idx} src={mediaUrl(author?.avatar_url)} size={40} />
        <div style={{ minWidth: 0 }}>
          <div className="nm">{chat.author_name}</div>
          <div className="sb"><span className={chat.is_blocked ? 'off' : 'on'} />{chat.telegram_username ? `@${chat.telegram_username}` : 'Telegram'}{chat.last_message_at && ` · oxirgi xabar ${listTime(chat.last_message_at)}`}{chat.is_blocked && ' · bloklangan'}</div>
        </div>
        <div className="ch-menu">
          <button onClick={() => setMenu(!menu)} aria-label="Menyu">⋯</button>
          {menu && (
            <div className="ch-menu-dd" onMouseLeave={() => setMenu(false)}>
              <a className="ab text" style={{ display: 'block', textAlign: 'left', height: 36, padding: '0 12px', fontWeight: 400, fontSize: 13.5 }} href={`/authors/${chat.author_slug}`} target="_blank" rel="noreferrer">Saytdagi profil ↗</a>
              <button onClick={onBlock}>{chat.is_blocked ? 'Blokdan chiqarish' : 'Bloklash'}</button>
              <button className="red" onClick={onDelete}>Suhbatni o‘chirish</button>
            </div>
          )}
        </div>
      </div>
      {waiting !== null && chat.unread_count > 0 && (
        <div className="ch-banner"><span className="dot" />Muallif javobingizni <b style={{ margin: '0 4px' }}>{waiting ? `${waiting} soatdan beri` : 'hozirgina'}</b> kutmoqda<button onClick={onClose}>Yopilgan deb belgilash</button></div>
      )}
      {wsStatus !== 'open' && <div className={`ch-status${wsStatus === 'offline' ? ' bad' : ''}`}>{wsStatus === 'connecting' ? 'Real vaqt ulanishi o‘rnatilmoqda…' : 'Real vaqt ulanishi yo‘q — xabarlar har 8 soniyada yangilanadi'}</div>}

      <div ref={scrollRef} className="ch-msgs">
        {msgs.length === 0 && <div className="sub-empty" style={{ padding: 30 }}>Hozircha xabar yo‘q — birinchi xabarni yozing.</div>}
        {msgs.map((m, i) => {
          const day = new Date(m.created_at).toDateString();
          const sep = i === 0 || day !== new Date(msgs[i - 1].created_at).toDateString();
          const out = m.sender === 'admin';
          return (
            <div key={m.id} style={{ display: 'contents' }}>
              {sep && <div className="ch-date">{dayLabel(m.created_at)}</div>}
              <div className={`bub ${out ? 'out' : 'in'}`}>
                {m.kind === 'photo' && m.image_url && <img src={mediaUrl(m.image_url) ?? undefined} alt="" />}
                {m.kind === 'document' && m.document_url && <a className="doc" href={mediaUrl(m.document_url) ?? undefined} target="_blank" rel="noreferrer">📎 {m.document_name || 'Fayl'}</a>}
                {m.text && <div style={{ whiteSpace: 'pre-wrap' }}>{m.text}</div>}
                <span className="tm">{hhmm(m.created_at)}{out ? (m.is_read ? ' ✓✓' : ' ✓') : ''}</span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="ch-quick">
        <span className="lbl">Tez javob</span>
        {QUICK.map(q => <button key={q.label} type="button" onClick={() => setText(q.text)}>{q.label}</button>)}
      </div>
      {file && <div className="ch-attach">📎 {file.name}<button onClick={() => { setFile(null); if (fileRef.current) fileRef.current.value = ''; }}>✕</button></div>}
      <div className="ch-composer">
        <button className="att" title="Fayl yoki rasm" disabled={chat.is_blocked || sending} onClick={() => fileRef.current?.click()}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.5l-8.5 8.5a5.5 5.5 0 0 1-7.8-7.8l9-9a3.5 3.5 0 0 1 5 5l-9 9a1.5 1.5 0 0 1-2.1-2.1l8-8"/></svg>
        </button>
        <input ref={fileRef} type="file" hidden onChange={e => setFile(e.target.files?.[0] ?? null)} />
        <textarea value={text} onChange={e => setText(e.target.value)} placeholder={chat.is_blocked ? 'Bu suhbat bloklangan' : 'Xabar yozing…'} disabled={chat.is_blocked || sending}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }} />
        <button className="ab primary" onClick={send} disabled={(!text.trim() && !file) || sending || chat.is_blocked}>{sending ? '…' : 'Yuborish'}</button>
      </div>
    </>
  );
}
