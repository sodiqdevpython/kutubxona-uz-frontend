import { useCallback, useEffect, useRef, useState } from 'react';
import AuthorAvatar from '../ui/AuthorAvatar';
import { adminApi, type AdminIssue, type AuthorMatch, type ParsedArticle, type ParsedSavePayload } from '../../lib/admin-api';
import { refreshDashboard } from '../../lib/admin-dashboard';

/**
 * «PDF'dan maqolalarni ajratish» — Figma modal:
 * progress kartasi + har bir nomzod qatori (SAQLANDI / KUTILMOQDA / TEKSHIRISH),
 * «To'ldirish» bosilganda qator ostida tahrirlash + muallif profilini moslashtirish.
 */

function needsCheck(it: ParsedArticle): boolean {
  return it.status !== 'saved' && (!it.title.trim() || !it.author_name.trim());
}

// ── Qator ostidagi muharrir ──────────────────────────────────────────────────

function Editor({ item, onSaved, onRemoved, registerSave, unregisterSave }: {
  item: ParsedArticle; onSaved: (s: ParsedArticle) => void; onRemoved: (id: string) => void;
  registerSave: (id: string, fn: () => Promise<boolean>) => void; unregisterSave: (id: string) => void;
}) {
  const [title, setTitle]   = useState(item.title);
  const [author, setAuthor] = useState(item.author_name);
  const [extra, setExtra]   = useState(item.extra_info);
  const hasMatches = item.matches.length > 0;
  const [mode, setMode] = useState<'existing' | 'new' | 'none'>(hasMatches ? 'existing' : 'new');
  const [selected, setSelected] = useState(item.matches[0]?.id ?? '');
  const [npRole, setNpRole] = useState(''); const [npOrg, setNpOrg] = useState('');
  const [busy, setBusy] = useState(false); const [err, setErr] = useState('');

  async function save(): Promise<boolean> {
    if (!title.trim()) { setErr('Sarlavha majburiy'); return false; }
    setBusy(true); setErr('');
    const payload: ParsedSavePayload = { author_mode: mode, title, author_name: author, extra_info: extra };
    if (mode === 'existing') { if (!selected) { setErr('Profil tanlang'); setBusy(false); return false; } payload.author_id = selected; }
    else if (mode === 'new') payload.author = { name: author, role: npRole, org: npOrg, bio: extra };
    try { const r = await adminApi.parsed.save(item.id, payload); onSaved(r); return true; }
    catch (e) { setErr((e as Error).message); return false; }
    finally { setBusy(false); }
  }
  const saveRef = useRef(save);
  useEffect(() => { saveRef.current = save; });
  useEffect(() => { registerSave(item.id, () => saveRef.current()); return () => unregisterSave(item.id); }, [item.id, registerSave, unregisterSave]);

  return (
    <div className="pm-editor">
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div><label className="f-label"><span>Sarlavha</span></label><textarea className="f-textarea" rows={2} style={{ minHeight: 64 }} value={title} onChange={e => setTitle(e.target.value)} /></div>
          <div><label className="f-label"><span>Muallif (parser)</span></label><input className="f-input" value={author} onChange={e => setAuthor(e.target.value)} /></div>
          <div><label className="f-label"><span>Qo‘shimcha ma’lumot</span></label><textarea className="f-textarea" rows={2} style={{ minHeight: 64 }} value={extra} onChange={e => setExtra(e.target.value)} /></div>
          {item.photo_url && <img src={item.photo_url} alt="" style={{ width: 64, height: 80, objectFit: 'cover', borderRadius: 6, border: '1px solid var(--line)' }} />}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <label className="f-label"><span>Muallif profili</span></label>
          {hasMatches ? item.matches.map((m: AuthorMatch) => (
            <button key={m.id} type="button" className={`pm-match${mode === 'existing' && selected === m.id ? ' on' : ''}`} onClick={() => { setMode('existing'); setSelected(m.id); }}>
              <AuthorAvatar name={m.initials} idx={m.avatar_idx} src={m.avatar_url} size={34} />
              <span><span className="nm">{m.name}</span><br /><span className="sb">{m.role || m.org || '—'} · {m.article_count} maqola</span></span>
            </button>
          )) : <div className="meta" style={{ fontSize: 12.5, color: 'var(--ink-3)' }}>Mos profil topilmadi — yangi profil yaratiladi.</div>}
          <button type="button" className={`pm-match${mode === 'new' ? ' on' : ''}`} onClick={() => setMode('new')}><span className="nm">Yangi profil yaratish</span></button>
          {mode === 'new' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <input className="f-input" placeholder="Lavozim" value={npRole} onChange={e => setNpRole(e.target.value)} />
              <input className="f-input" placeholder="Tashkilot" value={npOrg} onChange={e => setNpOrg(e.target.value)} />
            </div>
          )}
          <label style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 12.5, color: 'var(--ink-3)', cursor: 'pointer' }}>
            <input type="checkbox" checked={mode === 'none'} onChange={e => setMode(e.target.checked ? 'none' : (hasMatches ? 'existing' : 'new'))} /> Profilsiz (faqat matn nomi)
          </label>
        </div>
      </div>
      {err && <div className="f-err" style={{ marginTop: 12 }}>{err}</div>}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 14 }}>
        <button className="ab sm text" style={{ color: 'var(--ink-3)' }} onClick={async () => { if (confirm('Bu nomzod o‘tkazib yuborilsinmi?')) { try { await adminApi.parsed.remove(item.id); onRemoved(item.id); } catch { /* */ } } }}>O‘tkazib yuborish</button>
        <button className="ab sm primary" onClick={save} disabled={busy}>{busy ? 'Saqlanmoqda…' : 'Saqlash'}</button>
      </div>
    </div>
  );
}

// ── Modal ─────────────────────────────────────────────────────────────────────

export default function ParsePanel({ issue, onClose, onSaved }: { issue: AdminIssue; onClose: () => void; onSaved: () => void }) {
  const [items, setItems]     = useState<ParsedArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [parsing, setParsing] = useState(false);
  const [savingAll, setSavingAll] = useState(false);
  const [open, setOpen]       = useState<string | null>(null);
  const [err, setErr]         = useState('');
  const saveFns = useRef<Map<string, () => Promise<boolean>>>(new Map());
  const registerSave   = useCallback((id: string, fn: () => Promise<boolean>) => { saveFns.current.set(id, fn); }, []);
  const unregisterSave = useCallback((id: string) => { saveFns.current.delete(id); }, []);

  useEffect(() => {
    adminApi.issues.parsed(issue.id).then(d => { setItems(d.results); setLoading(false); }).catch(() => setLoading(false));
  }, [issue.id]);

  async function runParse() {
    setParsing(true); setErr('');
    try { const d = await adminApi.issues.parsePdf(issue.id); setItems(d.results); setOpen(null); }
    catch (e) { setErr((e as Error).message); }
    finally { setParsing(false); }
  }
  const handleSaved = useCallback((s: ParsedArticle) => { setItems(p => p.map(i => (i.id === s.id ? s : i))); setOpen(null); onSaved(); refreshDashboard(); }, [onSaved]);
  const handleRemoved = useCallback((id: string) => { setItems(p => p.filter(i => i.id !== id)); setOpen(null); }, []);

  async function saveAll() {
    setSavingAll(true);
    for (const it of items.filter(i => i.status !== 'saved' && !needsCheck(i))) {
      const fn = saveFns.current.get(it.id);
      if (fn) { try { await fn(); } catch { /* keyingisi */ } }
      else {
        try { const r = await adminApi.parsed.save(it.id, { author_mode: it.matches[0] ? 'existing' : 'new', author_id: it.matches[0]?.id, author: it.matches[0] ? undefined : { name: it.author_name }, title: it.title, author_name: it.author_name, extra_info: it.extra_info }); setItems(p => p.map(i => (i.id === r.id ? r : i))); }
        catch { /* keyingisi */ }
      }
    }
    setSavingAll(false); onSaved(); refreshDashboard();
  }

  const saved = items.filter(i => i.status === 'saved').length;
  const check = items.filter(needsCheck).length;
  const pending = items.length - saved;

  return (
    <div className="adm-modal-bg" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="adm-modal" style={{ width: 800 }}>
        <div className="adm-modal-head">
          <div>
            <h2>PDF’dan maqolalarni ajratish</h2>
            <p>{issue.year} № {issue.number} ({issue.volume}) · {items.length ? `${items.length} maqola aniqlandi, ${saved} tasi saqlandi.` : 'hali ajratilmagan.'}</p>
          </div>
          <button className="adm-modal-x" onClick={onClose}>✕</button>
        </div>
        <div className="adm-modal-body">
          <div className="pm-progress">
            <div style={{ flex: 1 }}>
              <b>{items.length ? `${items.length} maqoladan ${saved} tasi ajratildi` : (issue.pdf_file_url ? 'PDF yuklangan — ajratishni boshlang' : 'Avval sonning PDF faylini yuklang')}</b>
              <div className="pm-bar"><i style={{ width: `${items.length ? Math.round(saved / items.length * 100) : 0}%` }} /></div>
            </div>
            <button className="ab" onClick={runParse} disabled={parsing || savingAll || !issue.pdf_file_url}>{parsing ? 'Ajratilmoqda…' : items.length ? 'Qayta ajratish' : 'Ajratish'}</button>
          </div>
          {err && <div className="f-err">{err} <span style={{ color: 'var(--ink-3)' }}>— parser ajrata olmasa, maqolalarni «+ Maqola qo‘shish» orqali kiriting.</span></div>}
          {loading && <div className="sub-empty">Yuklanmoqda…</div>}
          {!loading && items.length === 0 && !parsing && <div className="sub-empty">Nomzodlar yo‘q. «Ajratish» tugmasini bosing.</div>}
          {items.map(it => {
            const warn = needsCheck(it);
            const isSaved = it.status === 'saved';
            return (
              <div key={it.id}>
                <div className={`pm-row ${isSaved ? '' : warn ? 'warn' : 'pending'}`}>
                  <span className="n">{String(it.order).padStart(2, '0')}</span>
                  <div style={{ minWidth: 0 }}>
                    <div className="t">{it.title.trim() || (warn ? 'Muallif aniqlanmadi — sarlavha bo‘sh' : 'Sarlavhasiz')}</div>
                    <div className="s">{warn ? 'tekshirish kerak' : it.author_name || 'muallif ko‘rsatilmagan'}{it.start_page ? ` · ${it.start_page}–${it.end_page ?? ''}-bet` : ''}</div>
                  </div>
                  <span className={`st ${isSaved ? 'saved' : warn ? 'check' : 'pend'}`}>{isSaved ? 'Saqlandi' : warn ? 'Tekshirish' : 'Kutilmoqda'}</span>
                  {isSaved
                    ? (it.article_slug ? <a className="ab sm" href={`/articles/${it.article_slug}`} target="_blank" rel="noreferrer">Ko‘rish</a> : <span className="ab sm soft">Saqlandi</span>)
                    : <button className="ab sm" onClick={() => setOpen(open === it.id ? null : it.id)}>{open === it.id ? 'Yopish' : warn ? 'To‘ldirish' : 'Ko‘rish'}</button>}
                </div>
                {open === it.id && !isSaved && (
                  <Editor item={it} onSaved={handleSaved} onRemoved={handleRemoved} registerSave={registerSave} unregisterSave={unregisterSave} />
                )}
              </div>
            );
          })}
        </div>
        <div className="adm-modal-foot">
          <span className="hint">{check ? `${check} nomzod tekshirishni talab qiladi` : pending ? `${pending} nomzod saqlashga tayyor` : 'Hammasi saqlangan'}</span>
          <button className="ab" onClick={onClose}>Bekor qilish</button>
          <button className="ab primary" onClick={saveAll} disabled={savingAll || parsing || pending - check <= 0}>{savingAll ? 'Saqlanmoqda…' : 'Barchasini saqlash'}</button>
        </div>
      </div>
    </div>
  );
}
