import { useState, useEffect, useCallback, useRef } from 'react';
import AuthorAvatar from '../ui/AuthorAvatar';
import { adminApi, type AdminIssue, type ParsedArticle, type AuthorMatch, type ParsedSavePayload } from '../../lib/admin-api';

// ── Stillar ────────────────────────────────────────────────────────────────────
const lbl: React.CSSProperties = { display: 'block', fontSize: 10.5, fontWeight: 600, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: 0.18, marginBottom: 4 };
const fld: React.CSSProperties = { width: '100%', border: '1px solid var(--line-2)', borderRadius: 7, padding: '8px 10px', fontSize: 13.5, fontFamily: 'var(--sans)', background: 'var(--grey-2)', color: 'var(--ink)', outline: 'none', resize: 'vertical', boxSizing: 'border-box' };

// ── Mavjud profil kartasi ──────────────────────────────────────────────────────
function MatchCard({ m, selected, onSelect }: { m: AuthorMatch; selected: boolean; onSelect: () => void }) {
  return (
    <button type="button" onClick={onSelect} style={{
      display: 'flex', alignItems: 'center', gap: 10, width: '100%', textAlign: 'left',
      padding: '8px 10px', borderRadius: 8, cursor: 'pointer',
      border: `1.5px solid ${selected ? 'var(--navy)' : 'var(--line)'}`,
      background: selected ? 'rgba(10,25,47,0.05)' : 'var(--paper)',
    }}>
      {m.avatar_url
        ? <img src={m.avatar_url} alt="" style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
        : <AuthorAvatar name={m.initials} idx={m.avatar_idx} size={40} />}
      <div style={{ minWidth: 0, flex: 1 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.name}</div>
        <div style={{ fontSize: 11, color: 'var(--ink-3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {m.role || m.org || '—'} · {m.article_count} maqola
        </div>
      </div>
      {selected && <span style={{ color: 'var(--navy)', fontSize: 16, flexShrink: 0 }}>✓</span>}
    </button>
  );
}

// ── Bitta nomzod kartasi ────────────────────────────────────────────────────────
function ParsedItemCard({ item, onSaved, onRemoved, registerSave, unregisterSave }: {
  item: ParsedArticle;
  onSaved: (saved: ParsedArticle) => void;
  onRemoved: (id: string) => void;
  registerSave: (id: string, fn: () => Promise<boolean>) => void;
  unregisterSave: (id: string) => void;
}) {
  const [title, setTitle]   = useState(item.title);
  const [authorName, setAuthorName] = useState(item.author_name);
  const [extra, setExtra]   = useState(item.extra_info);

  // Muallif moslashtirish rejimi
  const hasMatches = item.matches.length > 0;
  const [mode, setMode] = useState<'existing' | 'new' | 'none'>(hasMatches ? 'existing' : 'new');
  const [selectedId, setSelectedId] = useState<string>(item.matches[0]?.id ?? '');

  // Yangi profil maydonlari (prefilled)
  const [npRole, setNpRole]   = useState('');
  const [npOrg, setNpOrg]     = useState('');
  const [npBio, setNpBio]     = useState(item.extra_info);

  const [saving, setSaving] = useState(false);
  const [err, setErr]       = useState('');

  const saved = item.status === 'saved';

  async function save(): Promise<boolean> {
    setSaving(true); setErr('');
    const payload: ParsedSavePayload = {
      author_mode: mode,
      title, author_name: authorName, extra_info: extra,
    };
    if (mode === 'existing') {
      if (!selectedId) { setErr('Profil tanlang'); setSaving(false); return false; }
      payload.author_id = selectedId;
    } else if (mode === 'new') {
      payload.author = { name: authorName, role: npRole, org: npOrg, bio: npBio };
    }
    try {
      const res = await adminApi.parsed.save(item.id, payload);
      onSaved(res);
      return true;
    } catch (e) { setErr((e as Error).message); return false; }
    finally { setSaving(false); }
  }

  // "Hammasini saqlash" uchun panelга joriy holatdagi save funksiyasini ro'yxatdan o'tkazamiz
  const saveRef = useRef(save);
  saveRef.current = save;
  useEffect(() => {
    if (saved) { unregisterSave(item.id); return; }
    registerSave(item.id, () => saveRef.current());
    return () => unregisterSave(item.id);
  }, [item.id, saved, registerSave, unregisterSave]);

  async function remove() {
    if (!confirm('Bu nomzodni o\'tkazib yuborasizmi?')) return;
    try { await adminApi.parsed.remove(item.id); onRemoved(item.id); } catch { /* ignore */ }
  }

  // ── Saqlangan holat ──
  if (saved) {
    return (
      <div style={{ border: '1px solid rgba(6,95,70,0.3)', background: 'rgba(6,95,70,0.05)', borderRadius: 10, padding: '14px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 11, color: '#065F46', fontWeight: 700, letterSpacing: 0.2 }}>✓ SAQLANDI · {item.order}-maqola</div>
          <div style={{ fontSize: 13.5, color: 'var(--ink)', marginTop: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{title}</div>
        </div>
        {item.article_slug && (
          <a href={`/articles/${item.article_slug}`} target="_blank" rel="noreferrer"
            style={{ flexShrink: 0, fontSize: 12.5, color: 'var(--navy)', fontWeight: 600 }}>
            Maqolani ko'rish →
          </a>
        )}
      </div>
    );
  }

  // ── Tahrirlash holati ──
  return (
    <div style={{ border: '1px solid var(--line)', background: 'var(--paper)', borderRadius: 12, padding: '18px 20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--ink-3)', letterSpacing: 0.2 }}>
          {item.order}-MAQOLA {item.start_page ? `· ${item.start_page}–${item.end_page ?? ''}-bet` : ''} {item.section ? `· ${item.section}` : ''}
        </span>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {item.article_pdf_url && (
            <a href={item.article_pdf_url} target="_blank" rel="noreferrer" style={{ fontSize: 12, color: 'var(--navy)', fontWeight: 600 }}>📄 PDF</a>
          )}
          <button onClick={remove} style={{ background: 'none', border: 0, cursor: 'pointer', color: 'var(--ink-4)', fontSize: 12.5 }}>🗑 O'tkazib yuborish</button>
        </div>
      </div>

      <div className="parse-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        {/* CHAP: maqola ma'lumotlari */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div>
            <label style={lbl}>Sarlavha</label>
            <textarea value={title} onChange={e => setTitle(e.target.value)} rows={2} style={fld} />
          </div>
          <div>
            <label style={lbl}>Ism familiya (parser)</label>
            <input value={authorName} onChange={e => setAuthorName(e.target.value)} style={{ ...fld, height: 36 }} />
          </div>
          <div>
            <label style={lbl}>Qo'shimcha ma'lumot</label>
            <textarea value={extra} onChange={e => setExtra(e.target.value)} rows={3} style={fld} />
          </div>
          {item.photo_url && (
            <div>
              <label style={lbl}>Ajratilgan rasm</label>
              <img src={item.photo_url} alt="muallif" style={{ width: 72, height: 90, objectFit: 'cover', borderRadius: 8, border: '1px solid var(--line)' }} />
            </div>
          )}
        </div>

        {/* O'NG: muallif moslashtirish */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, borderLeft: '1px solid var(--line)', paddingLeft: 20 }}>
          <span style={lbl}>Muallif profili</span>

          {hasMatches ? (
            <>
              <div style={{ fontSize: 12, color: 'var(--ink-3)', lineHeight: 1.5 }}>
                Tizimda shu ismga {item.matches.length > 1 ? `mos ${item.matches.length} ta profil` : 'mos profil'} topildi.
                Bir xil odam bo'lsa tanlang, aks holda yangi profil yarating.
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {item.matches.map(m => (
                  <MatchCard key={m.id} m={m}
                    selected={mode === 'existing' && selectedId === m.id}
                    onSelect={() => { setMode('existing'); setSelectedId(m.id); }} />
                ))}
              </div>
              <button type="button" onClick={() => setMode('new')} style={{
                textAlign: 'left', padding: '8px 10px', borderRadius: 8, cursor: 'pointer',
                border: `1.5px solid ${mode === 'new' ? 'var(--navy)' : 'var(--line)'}`,
                background: mode === 'new' ? 'rgba(10,25,47,0.05)' : 'var(--paper)',
                fontSize: 13, fontWeight: 600, color: 'var(--ink)',
              }}>
                🆕 Boshqa odam — yangi profil
              </button>
            </>
          ) : (
            <div style={{ fontSize: 12, color: 'var(--ink-3)', lineHeight: 1.5 }}>
              Tizimda mos profil topilmadi — yangi profil yaratiladi (faqat saqlaganda).
            </div>
          )}

          {mode === 'new' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 4, padding: '12px', background: 'var(--grey-2)', borderRadius: 8 }}>
              <div>
                <label style={lbl}>F.I.Sh. (profil nomi)</label>
                <input value={authorName} onChange={e => setAuthorName(e.target.value)} style={{ ...fld, height: 34, background: 'var(--paper)' }} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <div>
                  <label style={lbl}>Lavozim</label>
                  <input value={npRole} onChange={e => setNpRole(e.target.value)} style={{ ...fld, height: 34, background: 'var(--paper)' }} />
                </div>
                <div>
                  <label style={lbl}>Tashkilot</label>
                  <input value={npOrg} onChange={e => setNpOrg(e.target.value)} style={{ ...fld, height: 34, background: 'var(--paper)' }} />
                </div>
              </div>
              <div>
                <label style={lbl}>Bio</label>
                <textarea value={npBio} onChange={e => setNpBio(e.target.value)} rows={2} style={{ ...fld, background: 'var(--paper)' }} />
              </div>
            </div>
          )}

          <label style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 12, color: 'var(--ink-3)', cursor: 'pointer', marginTop: 2 }}>
            <input type="checkbox" checked={mode === 'none'} onChange={e => setMode(e.target.checked ? 'none' : (hasMatches ? 'existing' : 'new'))} style={{ accentColor: 'var(--navy)' }} />
            Profilsiz (faqat matn nomi)
          </label>
        </div>
      </div>

      {err && <div style={{ marginTop: 12, padding: '8px 12px', background: '#FEF2F2', border: '1px solid #FCA5A5', borderRadius: 7, fontSize: 12.5, color: '#DC2626' }}>{err}</div>}

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 14 }}>
        <button onClick={save} disabled={saving}
          style={{ height: 36, padding: '0 22px', borderRadius: 6, border: 0, background: saving ? 'var(--navy-30)' : 'var(--navy)', color: 'white', cursor: saving ? 'default' : 'pointer', fontSize: 13, fontWeight: 600, fontFamily: 'var(--sans)' }}>
          {saving ? 'Saqlanmoqda…' : '💾 Saqlash'}
        </button>
      </div>
    </div>
  );
}

// ── Asosiy panel ────────────────────────────────────────────────────────────────
export default function ParsePanel({ issue, onClose, onSaved }: {
  issue:   AdminIssue;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [items, setItems]     = useState<ParsedArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [parsing, setParsing] = useState(false);
  const [savingAll, setSavingAll] = useState(false);
  const [err, setErr]         = useState('');

  // Har bir karta o'z joriy save funksiyasini shu yerga ro'yxatdan o'tkazadi
  const saveFns = useRef<Map<string, () => Promise<boolean>>>(new Map());
  const registerSave   = useCallback((id: string, fn: () => Promise<boolean>) => { saveFns.current.set(id, fn); }, []);
  const unregisterSave = useCallback((id: string) => { saveFns.current.delete(id); }, []);

  // Mavjud nomzodlarni yuklash
  useEffect(() => {
    adminApi.issues.parsed(issue.id)
      .then(d => { setItems(d.results); setLoading(false); })
      .catch(() => setLoading(false));
  }, [issue.id]);

  const runParse = useCallback(async () => {
    setParsing(true); setErr('');
    try {
      const d = await adminApi.issues.parsePdf(issue.id);
      setItems(d.results);
    } catch (e) { setErr((e as Error).message); }
    finally { setParsing(false); }
  }, [issue.id]);

  const handleSaved = useCallback((saved: ParsedArticle) => {
    setItems(prev => prev.map(it => it.id === saved.id ? saved : it));
    onSaved();
  }, [onSaved]);

  const handleRemoved = useCallback((id: string) => {
    setItems(prev => prev.filter(it => it.id !== id));
  }, []);

  // Barcha saqlanmagan nomzodlarni ketma-ket (har birining joriy tanlovi bilan) saqlaydi
  async function saveAll() {
    setSavingAll(true);
    for (const it of items.filter(i => i.status !== 'saved')) {
      const fn = saveFns.current.get(it.id);
      if (fn) { try { await fn(); } catch { /* keyingisiga o'tamiz */ } }
    }
    setSavingAll(false);
  }

  const pending = items.filter(i => i.status !== 'saved').length;

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(10,25,47,0.6)', zIndex: 300, display: 'grid', placeItems: 'start center', overflowY: 'auto', padding: '24px 16px' }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background: 'var(--paper)', border: '1px solid var(--line)', borderRadius: 14, width: '100%', maxWidth: 1000, boxShadow: '0 28px 64px -24px rgba(10,25,47,0.45)' }}>
        {/* Header */}
        <div style={{ position: 'sticky', top: 0, zIndex: 2, background: 'var(--paper)', borderBottom: '1px solid var(--line)', borderRadius: '14px 14px 0 0', padding: '20px 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h3 className="h-display" style={{ fontSize: 21, margin: 0 }}>PDF dan maqolalarni ajratish</h3>
            <div style={{ fontSize: 12.5, color: 'var(--ink-3)', marginTop: 3 }}>
              Vol.{issue.volume} №{issue.number} ({issue.year}) · {items.length} nomzod, {pending} kutmoqda
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            {pending > 0 && (
              <button onClick={saveAll} disabled={savingAll || parsing}
                style={{ height: 36, padding: '0 16px', borderRadius: 6, border: 0, background: savingAll ? 'var(--navy-30)' : 'var(--navy)', color: 'white', cursor: savingAll ? 'default' : 'pointer', fontSize: 12.5, fontWeight: 600, fontFamily: 'var(--sans)' }}>
                {savingAll ? 'Saqlanmoqda…' : `💾 Hammasini saqlash (${pending})`}
              </button>
            )}
            <button onClick={runParse} disabled={parsing || savingAll} className="btn ghost" style={{ height: 36, fontSize: 12.5 }}>
              {parsing ? 'Ajratilmoqda…' : (items.length ? '🔄 Qayta ajratish' : '▶ Ajratish')}
            </button>
            <button onClick={onClose} style={{ background: 'none', border: 0, cursor: 'pointer', fontSize: 22, color: 'var(--ink-3)' }}>✕</button>
          </div>
        </div>

        {/* Body */}
        <div style={{ padding: '20px 28px 28px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          {err && (
            <div style={{ padding: '12px 16px', background: '#FEF2F2', border: '1px solid #FCA5A5', borderRadius: 8, fontSize: 13, color: '#DC2626', lineHeight: 1.5 }}>
              {err}
              <div style={{ marginTop: 6, color: 'var(--ink-3)' }}>
                Parser ajrata olmasa, panelni yopib «Qo'lda maqola qo'shish» orqali kiritishingiz mumkin.
              </div>
            </div>
          )}

          {loading ? (
            <div style={{ padding: '48px 0', textAlign: 'center', color: 'var(--ink-3)', fontSize: 13 }}>Yuklanmoqda…</div>
          ) : items.length === 0 ? (
            <div style={{ padding: '48px 0', textAlign: 'center', color: 'var(--ink-3)', fontSize: 13.5 }}>
              {parsing ? 'Ajratilmoqda…' : (
                <>
                  Hali ajratilmagan. PDF'dan maqolalarni ajratish uchun
                  <button onClick={runParse} style={{ margin: '0 4px', background: 'none', border: 0, color: 'var(--navy)', fontWeight: 600, cursor: 'pointer', fontSize: 13.5 }}>▶ Ajratish</button>
                  tugmasini bosing.
                </>
              )}
            </div>
          ) : (
            items.map(it => (
              <ParsedItemCard key={it.id} item={it} onSaved={handleSaved} onRemoved={handleRemoved}
                registerSave={registerSave} unregisterSave={unregisterSave} />
            ))
          )}
        </div>
      </div>
    </div>
  );
}
