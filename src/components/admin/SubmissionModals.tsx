import { useRef, useState, type ReactNode } from 'react';
import { adminApi, type AdminCategory, type AdminIssue, type AdminSubmission } from '../../lib/admin-api';
import { refreshDashboard } from '../../lib/admin-dashboard';
import { useI18n, type MsgKey } from '../../lib/i18n';
import AuthorListEditor, { entriesToPayload, validateEntries, type AuthorEntry } from './AuthorPicker';

/**
 * Kelgan maqolalar modallari — Figma: «Maqolani tasdiqlash», «Maqolani rad etish»,
 * «Qo'lda maqola qo'shish» (+ tasdiqdan qaytarish uchun sabab modali).
 */

// ── Umumiy qobiq ─────────────────────────────────────────────────────────────

export function Modal({ title, sub, onClose, children, foot, small }: {
  title: string; sub?: string; onClose: () => void; children: ReactNode; foot: ReactNode; small?: boolean;
}) {
  const { t } = useI18n();
  return (
    <div className="adm-modal-bg" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className={`adm-modal${small ? ' sm' : ''}`} role="dialog" aria-modal="true">
        <div className="adm-modal-head">
          <div><h2>{title}</h2>{sub && <p>{sub}</p>}</div>
          <button className="adm-modal-x" onClick={onClose} aria-label={t('adm.sub.mod.close')}>✕</button>
        </div>
        <div className="adm-modal-body">{children}</div>
        <div className="adm-modal-foot">{foot}</div>
      </div>
    </div>
  );
}

/** «12–19» / «12-19» / «12» → [12, 19] */
export function parsePages(s: string): { page_start?: number; page_end?: number } {
  const m = s.replace(/\s/g, '').match(/^(\d+)(?:[-–—](\d+))?$/);
  if (!m) return {};
  const a = parseInt(m[1], 10), b = m[2] ? parseInt(m[2], 10) : undefined;
  return { page_start: a || undefined, page_end: b || undefined };
}

export function CategoryField({ value, onChange, categories, onAdd }: {
  value: string; onChange: (id: string) => void; categories: AdminCategory[]; onAdd: (name: string) => Promise<AdminCategory>;
}) {
  const { t } = useI18n();
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  async function add() {
    if (!name.trim()) return;
    setBusy(true);
    try { const c = await onAdd(name.trim()); onChange(c.id); setAdding(false); setName(''); }
    finally { setBusy(false); }
  }
  return (
    <div>
      <label className="f-label"><span>{t('adm.sub.m.category')}<span className="req">*</span></span>
        <button type="button" onClick={() => setAdding(a => !a)} style={{ border: 0, background: 'none', color: 'var(--accent)', font: 'inherit', cursor: 'pointer', letterSpacing: 0, textTransform: 'none' }}>
          {adding ? t('adm.sub.mod.cancel_add') : t('adm.sub.mod.new_cat')}
        </button>
      </label>
      {adding ? (
        <div style={{ display: 'flex', gap: 8 }}>
          <input className="f-input" value={name} onChange={e => setName(e.target.value)} placeholder={t('adm.sub.mod.new_cat_ph')} autoFocus
            onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), add())} />
          <button type="button" className="ab" onClick={add} disabled={busy}>{busy ? '…' : t('adm.sub.mod.add')}</button>
        </div>
      ) : (
        <select className="f-select" value={value} onChange={e => onChange(e.target.value)}>
          <option value="">{t('adm.sub.mod.choose')}</option>
          {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      )}
    </div>
  );
}

export function IssueField({ value, onChange, issues, required = true, emptyLabel }: {
  value: string; onChange: (id: string) => void; issues: AdminIssue[]; required?: boolean; emptyLabel?: string;
}) {
  const { t } = useI18n();
  return (
    <div>
      <label className="f-label"><span>{t('adm.sub.mod.issue')}{required && <span className="req">*</span>}</span></label>
      <select className="f-select" value={value} onChange={e => onChange(e.target.value)}>
        <option value="">{emptyLabel ?? t('adm.sub.mod.choose')}</option>
        {issues.map(i => (
          <option key={i.id} value={i.id}>{i.year} № {i.number}{i.is_upcoming ? t('adm.sub.mod.upcoming') : ''}</option>
        ))}
      </select>
    </div>
  );
}

// ── Tasdiqlash ────────────────────────────────────────────────────────────────

export function ApproveModal({ sub, categories, issues, onAddCategory, onDone, onClose }: {
  sub: AdminSubmission; categories: AdminCategory[]; issues: AdminIssue[];
  onAddCategory: (name: string) => Promise<AdminCategory>;
  onDone: (updated: AdminSubmission) => void; onClose: () => void;
}) {
  const { t } = useI18n();
  const [catId, setCatId]   = useState(sub.article_category?.id ?? '');
  const [issueId, setIssue] = useState('');
  const [pages, setPages]   = useState(sub.article_pages ? `${sub.article_pages.start ?? ''}–${sub.article_pages.end ?? ''}` : '');
  const [notify, setNotify] = useState(true);
  const [busy, setBusy]     = useState(false);
  const [err, setErr]       = useState('');
  const authorLine = [sub.author?.name ?? sub.author_name, sub.author?.role || sub.author?.org || sub.org].filter(Boolean).join(' · ');

  async function submit() {
    if (!catId)   { setErr(t('adm.sub.mod.cat_required')); return; }
    if (!issueId) { setErr(t('adm.sub.mod.issue_required')); return; }
    setBusy(true); setErr('');
    try {
      const u = await adminApi.submissions.approve(sub.id, { category_id: catId, issue_id: issueId, ...parsePages(pages), notify });
      refreshDashboard(); onDone(u);
    } catch (e) { setErr((e as Error).message); }
    finally { setBusy(false); }
  }

  return (
    <Modal title={t('adm.sub.mod.approve_title')} sub={t('adm.sub.mod.approve_sub')} onClose={onClose} small
      foot={<>
        <button className="ab" onClick={onClose}>{t('common.cancel')}</button>
        <button className="ab primary" onClick={submit} disabled={busy}>{busy ? t('adm.iss.saving') : t('adm.sub.mod.approve_btn')}</button>
      </>}>
      <div className="f-box">
        <div className="k">{t('adm.sub.mod.article')}</div>
        <div className="t">{sub.title || t('adm.sub.mod.untitled')}</div>
        {authorLine && <div className="s">{authorLine}</div>}
      </div>
      <div className="f-grid2">
        <CategoryField value={catId} onChange={setCatId} categories={categories} onAdd={onAddCategory} />
        <IssueField value={issueId} onChange={setIssue} issues={issues} />
      </div>
      <div>
        <label className="f-label"><span>{t('adm.sub.mod.pages')}</span></label>
        <input className="f-input" value={pages} onChange={e => setPages(e.target.value)} placeholder="12–19" />
      </div>
      <label className="f-check">
        <input type="checkbox" checked={notify} onChange={e => setNotify(e.target.checked)} />
        <span><b>{t('adm.sub.mod.notify')}</b><span>{t('adm.sub.mod.notify_s')}</span></span>
      </label>
      {err && <div className="f-err">{err}</div>}
    </Modal>
  );
}

// ── Rad etish ─────────────────────────────────────────────────────────────────

/** Sabab shablonlari — tugma yorlig'i va muallifga ketadigan matn (interfeys tilida) */
const REJECT_TEMPLATES: { label: MsgKey; text: MsgKey }[] = [
  { label: 'adm.sub.mod.rt.scope',      text: 'adm.sub.mod.rt.scope_t' },
  { label: 'adm.sub.mod.rt.method',     text: 'adm.sub.mod.rt.method_t' },
  { label: 'adm.sub.mod.rt.format',     text: 'adm.sub.mod.rt.format_t' },
  { label: 'adm.sub.mod.rt.plagiarism', text: 'adm.sub.mod.rt.plagiarism_t' },
];

export function RejectModal({ sub, onDone, onClose }: {
  sub: AdminSubmission; onDone: (updated: AdminSubmission) => void; onClose: () => void;
}) {
  const { t } = useI18n();
  const [tpl, setTpl]   = useState<number | null>(null);
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr]   = useState('');

  async function submit() {
    if (!text.trim()) { setErr(t('adm.sub.mod.reason_required')); return; }
    setBusy(true); setErr('');
    try { const u = await adminApi.submissions.reject(sub.id, text.trim()); refreshDashboard(); onDone(u); }
    catch (e) { setErr((e as Error).message); }
    finally { setBusy(false); }
  }

  return (
    <Modal title={t('adm.sub.mod.reject_title')} sub={t('adm.sub.mod.reject_sub')} onClose={onClose} small
      foot={<>
        <span className="hint">{t('adm.sub.mod.via_tg')}</span>
        <button className="ab" onClick={onClose}>{t('common.cancel')}</button>
        <button className="ab danger" onClick={submit} disabled={busy}>{busy ? t('adm.sub.mod.sending') : t('adm.sub.mod.reject_btn')}</button>
      </>}>
      <div>
        <label className="f-label"><span>{t('adm.sub.mod.reason_tpl')}</span></label>
        <div className="tpl-chips">
          {REJECT_TEMPLATES.map((tp, i) => (
            <button key={i} type="button" className={`tpl-chip${tpl === i ? ' on' : ''}`}
              onClick={() => { setTpl(i); setText(t(tp.text)); }}>{t(tp.label)}</button>
          ))}
        </div>
        <label className="f-label"><span>{t('adm.sub.mod.msg_author')}<span className="req">*</span></span></label>
        <textarea className="f-textarea" rows={4} value={text} onChange={e => { setText(e.target.value); setTpl(null); }} />
      </div>
      <div className="f-warn"><i>⚠</i><span>{t('adm.sub.mod.reject_warn')}</span></div>
      {err && <div className="f-err">{err}</div>}
    </Modal>
  );
}

// ── Tasdiqdan qaytarish (sabab bilan) ─────────────────────────────────────────

export function RevertModal({ sub, onDone, onClose }: {
  sub: AdminSubmission; onDone: (updated: AdminSubmission) => void; onClose: () => void;
}) {
  const { t } = useI18n();
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr]   = useState('');
  async function submit() {
    setBusy(true); setErr('');
    try { const u = await adminApi.submissions.revert(sub.id, text.trim()); refreshDashboard(); onDone(u); }
    catch (e) { setErr((e as Error).message); }
    finally { setBusy(false); }
  }
  return (
    <Modal title={t('adm.sub.mod.revert_title')} sub={t('adm.sub.mod.revert_sub')} onClose={onClose} small
      foot={<>
        <span className="hint">{t('adm.sub.mod.via_tg')}</span>
        <button className="ab" onClick={onClose}>{t('common.cancel')}</button>
        <button className="ab danger" onClick={submit} disabled={busy}>{busy ? '…' : t('adm.sub.mod.revert_btn')}</button>
      </>}>
      <div>
        <label className="f-label"><span>{t('adm.sub.mod.msg_author')}</span></label>
        <textarea className="f-textarea" rows={4} value={text} onChange={e => setText(e.target.value)} placeholder={t('adm.sub.mod.reason_ph')} />
      </div>
      {err && <div className="f-err">{err}</div>}
    </Modal>
  );
}

// ── Qo'lda maqola qo'shish ────────────────────────────────────────────────────

export function ManualAddModal({ categories, issues, defaultIssueId, onAddCategory, onDone, onClose }: {
  categories: AdminCategory[]; issues: AdminIssue[]; defaultIssueId?: string;
  onAddCategory: (name: string) => Promise<AdminCategory>;
  onDone: (created: { id: string; title: string; slug: string }) => void; onClose: () => void;
}) {
  const { t } = useI18n();
  const [title, setTitle]     = useState('');
  const [authors, setAuthors] = useState<AuthorEntry[]>([]);
  const [catId, setCatId]     = useState('');
  const [issueId, setIssue]   = useState(defaultIssueId ?? '');
  const [pages, setPages]     = useState('');
  const [udk, setUdk]         = useState('');
  const [file, setFile]       = useState<File | null>(null);
  const [over, setOver]       = useState(false);
  const [busy, setBusy]       = useState(false);
  const [err, setErr]         = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  function pick(f: File | undefined) {
    if (!f) return;
    if (!/\.(pdf|docx?)$/i.test(f.name)) { setErr(t('adm.sub.mod.only_doc')); return; }
    if (f.size > 20 * 1024 * 1024) { setErr(t('adm.sub.mod.too_big')); return; }
    setErr(''); setFile(f);
  }

  async function submit() {
    if (!title.trim())   { setErr(t('adm.sub.mod.title_required')); return; }
    if (!authors.length) { setErr(t('adm.sub.mod.authors_required')); return; }
    const authorsErr = validateEntries(authors, t);
    if (authorsErr) { setErr(authorsErr); return; }
    if (!catId)          { setErr(t('adm.sub.mod.cat_required')); return; }
    if (!issueId)        { setErr(t('adm.sub.mod.issue_required')); return; }
    setBusy(true); setErr('');
    try {
      const created = await adminApi.articles.create({
        title: title.trim(), authors: entriesToPayload(authors), category_id: catId, issue_id: issueId,
        ...parsePages(pages), udk: udk.trim() || undefined, source_file: file,
      });
      refreshDashboard(); onDone(created);
    } catch (e) { setErr((e as Error).message); }
    finally { setBusy(false); }
  }

  return (
    <Modal title={t('adm.sub.mod.manual_title')} sub={t('adm.sub.mod.manual_sub')} onClose={onClose}
      foot={<>
        <span className="hint">{t('adm.sub.mod.file_later')}</span>
        <button className="ab" onClick={onClose}>{t('common.cancel')}</button>
        <button className="ab primary" onClick={submit} disabled={busy}>{busy ? t('adm.iss.saving') : t('adm.sub.mod.save_article')}</button>
      </>}>
      <div>
        <label className="f-label"><span>{t('adm.sub.d.f.title')}<span className="req">*</span></span></label>
        <input className="f-input" value={title} onChange={e => setTitle(e.target.value)} placeholder={t('adm.sub.mod.title_ph')} autoFocus />
      </div>
      <div>
        <label className="f-label"><span>{t('adm.sub.mod.authors')}<span className="req">*</span></span></label>
        <AuthorListEditor value={authors} onChange={setAuthors} />
      </div>
      <div className="f-grid2">
        <CategoryField value={catId} onChange={setCatId} categories={categories} onAdd={onAddCategory} />
        <IssueField value={issueId} onChange={setIssue} issues={issues} />
      </div>
      <div className="f-grid2">
        <div>
          <label className="f-label"><span>{t('adm.sub.mod.pages')}</span></label>
          <input className="f-input" value={pages} onChange={e => setPages(e.target.value)} placeholder="12–19" />
        </div>
        <div>
          <label className="f-label"><span>{t('adm.sub.d.f.udk')}</span></label>
          <input className="f-input" value={udk} onChange={e => setUdk(e.target.value)} placeholder="02(575.1)" />
        </div>
      </div>
      <div className={`dropzone${over ? ' over' : ''}`}
        onClick={() => fileRef.current?.click()}
        onDragOver={e => { e.preventDefault(); setOver(true); }}
        onDragLeave={() => setOver(false)}
        onDrop={e => { e.preventDefault(); setOver(false); pick(e.dataTransfer.files[0]); }}>
        <div className="ico"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 16V5"/><path d="M7 10l5-5 5 5"/><path d="M5 19h14"/></svg></div>
        {file ? <b>{file.name}</b> : <b>{t('adm.sub.mod.drop')}</b>}
        <span>{file ? t('adm.sub.mod.drop_replace', { kb: (file.size / 1024).toFixed(0) }) : t('adm.sub.mod.drop_hint')}</span>
        <input ref={fileRef} type="file" accept=".pdf,.docx,.doc" hidden onChange={e => pick(e.target.files?.[0])} />
      </div>
      {err && <div className="f-err">{err}</div>}
    </Modal>
  );
}
