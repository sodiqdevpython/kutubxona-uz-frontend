import { useCallback, useEffect, useRef, useState } from 'react';
import AuthorListEditor, {
  entriesToPayload, entryForName, matchToProfile, validateEntries, type AuthorEntry,
} from './AuthorPicker';
import { adminApi, type AdminIssue, type ParsedArticle, type ParsedSavePayload } from '../../lib/admin-api';
import { refreshDashboard } from '../../lib/admin-dashboard';
import { useI18n } from '../../lib/i18n';

/**
 * «PDF'dan maqolalarni ajratish» — Figma modal:
 * progress kartasi + har bir nomzod qatori (SAQLANDI / KUTILMOQDA / TEKSHIRISH),
 * «To'ldirish» bosilganda qator ostida tahrirlash.
 * Mundarijadagi «A, B» mualliflar alohida qatorlarga bo'linadi: har biri mavjud
 * profilga biriktiriladi yoki o'z lavozimi va rasmi bilan yangi profil oladi.
 */

function needsCheck(it: ParsedArticle): boolean {
  return it.status !== 'saved' && (!it.title.trim() || !it.author_name.trim());
}

/** Parser mualliflari → boshlang'ich qatorlar (to'liq mos profil bo'lsa — o'sha, aks holda yangi profil). */
function initialEntries(it: ParsedArticle): AuthorEntry[] {
  return it.authors.map(a => entryForName(a.name, a.matches.map(matchToProfile), {
    parsed_index: a.index, photo_url: a.photo_url, bio: a.info,
  }));
}

function savePayload(title: string, entries: AuthorEntry[]): ParsedSavePayload {
  return {
    title,
    author_name: entries.map(e => e.profile?.name ?? e.name).filter(Boolean).join(', '),
    authors: entriesToPayload(entries),
  };
}

// ── Qator ostidagi muharrir ──────────────────────────────────────────────────

function Editor({ item, onSaved, onRemoved, registerSave, unregisterSave }: {
  item: ParsedArticle; onSaved: (s: ParsedArticle) => void; onRemoved: (id: string) => void;
  registerSave: (id: string, fn: () => Promise<boolean>) => void; unregisterSave: (id: string) => void;
}) {
  const { t } = useI18n();
  const [title, setTitle]     = useState(item.title);
  const [authors, setAuthors] = useState<AuthorEntry[]>(() => initialEntries(item));
  const [busy, setBusy] = useState(false); const [err, setErr] = useState('');

  async function save(): Promise<boolean> {
    if (!title.trim()) { setErr(t('adm.parse.title_required')); return false; }
    const authorsErr = validateEntries(authors, t);
    if (authorsErr) { setErr(authorsErr); return false; }
    setBusy(true); setErr('');
    try { const r = await adminApi.parsed.save(item.id, savePayload(title, authors)); onSaved(r); return true; }
    catch (e) { setErr((e as Error).message); return false; }
    finally { setBusy(false); }
  }
  const saveRef = useRef(save);
  useEffect(() => { saveRef.current = save; });
  useEffect(() => { registerSave(item.id, () => saveRef.current()); return () => unregisterSave(item.id); }, [item.id, registerSave, unregisterSave]);

  return (
    <div className="pm-editor">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div><label className="f-label"><span>{t('adm.parse.f.title')}</span></label><textarea className="f-textarea" rows={2} style={{ minHeight: 64 }} value={title} onChange={e => setTitle(e.target.value)} /></div>
        <div>
          <label className="f-label"><span>{t('adm.parse.f.profile')}</span><span style={{ textTransform: 'none', letterSpacing: 0 }}>{item.author_name}</span></label>
          <AuthorListEditor value={authors} onChange={setAuthors} noTelegram />
        </div>
      </div>
      {err && <div className="f-err" style={{ marginTop: 12 }}>{err}</div>}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 14 }}>
        <button className="ab sm text" style={{ color: 'var(--ink-3)' }} onClick={async () => { if (confirm(t('adm.parse.skip_confirm'))) { try { await adminApi.parsed.remove(item.id); onRemoved(item.id); } catch { /* */ } } }}>{t('adm.parse.skip')}</button>
        <button className="ab sm primary" onClick={save} disabled={busy}>{busy ? t('adm.parse.saving') : t('common.save')}</button>
      </div>
    </div>
  );
}

// ── Modal ─────────────────────────────────────────────────────────────────────

export default function ParsePanel({ issue, onClose, onSaved }: { issue: AdminIssue; onClose: () => void; onSaved: () => void }) {
  const { t, tn } = useI18n();
  const [items, setItems]     = useState<ParsedArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [parsing, setParsing] = useState(false);
  const [savingAll, setSavingAll] = useState(false);
  // Saqlanmagan nomzodlar sukut bo'yicha OCHIQ turadi; «Yopish» bosilganlari shu to'plamda
  const [closed, setClosed]   = useState<Set<string>>(() => new Set());
  const toggle = (id: string) => setClosed(p => { const n = new Set(p); if (n.has(id)) n.delete(id); else n.add(id); return n; });
  const [err, setErr]         = useState('');
  const saveFns = useRef<Map<string, () => Promise<boolean>>>(new Map());
  const registerSave   = useCallback((id: string, fn: () => Promise<boolean>) => { saveFns.current.set(id, fn); }, []);
  const unregisterSave = useCallback((id: string) => { saveFns.current.delete(id); }, []);

  useEffect(() => {
    adminApi.issues.parsed(issue.id).then(d => { setItems(d.results); setLoading(false); }).catch(() => setLoading(false));
  }, [issue.id]);

  async function runParse() {
    setParsing(true); setErr('');
    try { const d = await adminApi.issues.parsePdf(issue.id); setItems(d.results); setClosed(new Set()); }
    catch (e) { setErr((e as Error).message); }
    finally { setParsing(false); }
  }
  const handleSaved = useCallback((s: ParsedArticle) => { setItems(p => p.map(i => (i.id === s.id ? s : i))); onSaved(); refreshDashboard(); }, [onSaved]);
  const handleRemoved = useCallback((id: string) => { setItems(p => p.filter(i => i.id !== id)); }, []);

  async function saveAll() {
    setSavingAll(true);
    for (const it of items.filter(i => i.status !== 'saved' && !needsCheck(i))) {
      const fn = saveFns.current.get(it.id);
      if (fn) { try { await fn(); } catch { /* keyingisi */ } }
      else {
        try { const r = await adminApi.parsed.save(it.id, savePayload(it.title, initialEntries(it))); setItems(p => p.map(i => (i.id === r.id ? r : i))); }
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
            <h2>{t('adm.parse.title')}</h2>
            <p>{issue.year} № {issue.number} · {items.length ? t('adm.parse.summary', { n: items.length, saved }) : t('adm.parse.not_yet')}</p>
          </div>
          <button className="adm-modal-x" onClick={onClose} aria-label={t('common.close')}>✕</button>
        </div>
        <div className="adm-modal-body">
          <div className="pm-progress">
            <div style={{ flex: 1 }}>
              <b>{items.length ? t('adm.parse.progress', { n: items.length, saved }) : (issue.pdf_file_url ? t('adm.parse.pdf_ready') : t('adm.parse.upload_first'))}</b>
              <div className="pm-bar"><i style={{ width: `${items.length ? Math.round(saved / items.length * 100) : 0}%` }} /></div>
            </div>
            <button className="ab" onClick={runParse} disabled={parsing || savingAll || !issue.pdf_file_url}>{parsing ? t('adm.parse.running') : items.length ? t('adm.parse.rerun') : t('adm.parse.run')}</button>
          </div>
          {err && <div className="f-err">{err} <span style={{ color: 'var(--ink-3)' }}>{t('adm.parse.err_hint')}</span></div>}
          {loading && <div className="sub-empty">{t('common.loading')}</div>}
          {!loading && items.length === 0 && !parsing && <div className="sub-empty">{t('adm.parse.empty')}</div>}
          {items.map(it => {
            const warn = needsCheck(it);
            const isSaved = it.status === 'saved';
            const isOpen = !isSaved && !closed.has(it.id);
            return (
              <div key={it.id}>
                <div className={`pm-row ${isSaved ? '' : warn ? 'warn' : 'pending'}`}>
                  <span className="n">{String(it.order).padStart(2, '0')}</span>
                  <div style={{ minWidth: 0 }}>
                    <div className="t">{it.title.trim() || (warn ? t('adm.parse.no_author_title') : t('adm.parse.untitled'))}</div>
                    <div className="s">{warn ? t('adm.parse.needs_check') : it.author_name || t('adm.parse.no_author')}{it.start_page ? t('adm.parse.pages', { range: `${it.start_page}–${it.end_page ?? ''}` }) : ''}</div>
                  </div>
                  <span className={`st ${isSaved ? 'saved' : warn ? 'check' : 'pend'}`}>{isSaved ? t('adm.parse.st.saved') : warn ? t('adm.parse.st.check') : t('adm.parse.st.pending')}</span>
                  {isSaved
                    ? (it.article_slug ? <a className="ab sm" href={`/articles/${it.article_slug}`} target="_blank" rel="noreferrer">{t('adm.parse.view')}</a> : <span className="ab sm soft">{t('adm.parse.st.saved')}</span>)
                    : <button className="ab sm" onClick={() => toggle(it.id)}>{isOpen ? t('adm.parse.close') : warn ? t('adm.parse.fill') : t('adm.parse.open')}</button>}
                </div>
                {isOpen && (
                  <Editor item={it} onSaved={handleSaved} onRemoved={handleRemoved} registerSave={registerSave} unregisterSave={unregisterSave} />
                )}
              </div>
            );
          })}
        </div>
        <div className="adm-modal-foot">
          <span className="hint">{check ? tn('adm.parse.hint_check', check) : pending ? tn('adm.parse.hint_ready', pending) : t('adm.parse.hint_done')}</span>
          <button className="ab" onClick={onClose}>{t('common.cancel')}</button>
          <button className="ab primary" onClick={saveAll} disabled={savingAll || parsing || pending - check <= 0}>{savingAll ? t('adm.parse.saving') : t('adm.parse.save_all')}</button>
        </div>
      </div>
    </div>
  );
}
