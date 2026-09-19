import { useRef, useState, type ReactNode } from 'react';
import { adminApi, type AdminCategory, type AdminIssue, type AdminSubmission } from '../../lib/admin-api';
import { refreshDashboard } from '../../lib/admin-dashboard';

/**
 * Kelgan maqolalar modallari — Figma: «Maqolani tasdiqlash», «Maqolani rad etish»,
 * «Qo'lda maqola qo'shish» (+ tasdiqdan qaytarish uchun sabab modali).
 */

// ── Umumiy qobiq ─────────────────────────────────────────────────────────────

export function Modal({ title, sub, onClose, children, foot, small }: {
  title: string; sub?: string; onClose: () => void; children: ReactNode; foot: ReactNode; small?: boolean;
}) {
  return (
    <div className="adm-modal-bg" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className={`adm-modal${small ? ' sm' : ''}`} role="dialog" aria-modal="true">
        <div className="adm-modal-head">
          <div><h2>{title}</h2>{sub && <p>{sub}</p>}</div>
          <button className="adm-modal-x" onClick={onClose} aria-label="Yopish">✕</button>
        </div>
        <div className="adm-modal-body">{children}</div>
        <div className="adm-modal-foot">{foot}</div>
      </div>
    </div>
  );
}

/** «12–19» / «12-19» / «12» → [12, 19] */
function parsePages(s: string): { page_start?: number; page_end?: number } {
  const m = s.replace(/\s/g, '').match(/^(\d+)(?:[-–—](\d+))?$/);
  if (!m) return {};
  const a = parseInt(m[1], 10), b = m[2] ? parseInt(m[2], 10) : undefined;
  return { page_start: a || undefined, page_end: b || undefined };
}

function doiPreview(issue: AdminIssue | undefined): string {
  if (!issue) return '—';
  return `kutubxona.${issue.year}.${issue.number}.${String(issue.article_count + 1).padStart(2, '0')}`;
}

function CategoryField({ value, onChange, categories, onAdd }: {
  value: string; onChange: (id: string) => void; categories: AdminCategory[]; onAdd: (name: string) => Promise<AdminCategory>;
}) {
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
      <label className="f-label"><span>Yo‘nalish<span className="req">*</span></span>
        <button type="button" onClick={() => setAdding(a => !a)} style={{ border: 0, background: 'none', color: 'var(--accent)', font: 'inherit', cursor: 'pointer', letterSpacing: 0, textTransform: 'none' }}>
          {adding ? 'bekor' : '+ yangi'}
        </button>
      </label>
      {adding ? (
        <div style={{ display: 'flex', gap: 8 }}>
          <input className="f-input" value={name} onChange={e => setName(e.target.value)} placeholder="Yangi yo‘nalish nomi" autoFocus
            onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), add())} />
          <button type="button" className="ab" onClick={add} disabled={busy}>{busy ? '…' : 'Qo‘shish'}</button>
        </div>
      ) : (
        <select className="f-select" value={value} onChange={e => onChange(e.target.value)}>
          <option value="">— tanlang —</option>
          {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      )}
    </div>
  );
}

function IssueField({ value, onChange, issues, required = true }: {
  value: string; onChange: (id: string) => void; issues: AdminIssue[]; required?: boolean;
}) {
  return (
    <div>
      <label className="f-label"><span>Jurnal soni{required && <span className="req">*</span>}</span></label>
      <select className="f-select" value={value} onChange={e => onChange(e.target.value)}>
        <option value="">— tanlang —</option>
        {issues.map(i => (
          <option key={i.id} value={i.id}>{i.year} № {i.number}{i.is_upcoming ? ' (tayyorlanmoqda)' : ''}</option>
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
  const [catId, setCatId]   = useState(sub.article_category?.id ?? '');
  const [issueId, setIssue] = useState('');
  const [pages, setPages]   = useState(sub.article_pages ? `${sub.article_pages.start ?? ''}–${sub.article_pages.end ?? ''}` : '');
  const [notify, setNotify] = useState(true);
  const [busy, setBusy]     = useState(false);
  const [err, setErr]       = useState('');
  const issue = issues.find(i => i.id === issueId);
  const authorLine = [sub.author?.name ?? sub.author_name, sub.author?.role || sub.author?.org || sub.org].filter(Boolean).join(' · ');

  async function submit() {
    if (!catId)   { setErr('Yo‘nalishni tanlang.'); return; }
    if (!issueId) { setErr('Jurnal sonini tanlang.'); return; }
    setBusy(true); setErr('');
    try {
      const u = await adminApi.submissions.approve(sub.id, { category_id: catId, issue_id: issueId, ...parsePages(pages), notify });
      refreshDashboard(); onDone(u);
    } catch (e) { setErr((e as Error).message); }
    finally { setBusy(false); }
  }

  return (
    <Modal title="Maqolani tasdiqlash" sub="Yo‘nalish va son majburiy — shundan keyin maqola saytda ko‘rinadi." onClose={onClose} small
      foot={<>
        <span className="hint">DOI avtomatik yaratiladi</span>
        <button className="ab" onClick={onClose}>Bekor qilish</button>
        <button className="ab primary" onClick={submit} disabled={busy}>{busy ? 'Saqlanmoqda…' : 'Tasdiqlash va joylash'}</button>
      </>}>
      <div className="f-box">
        <div className="k">Maqola</div>
        <div className="t">{sub.title || 'Sarlavhasiz maqola'}</div>
        {authorLine && <div className="s">{authorLine}</div>}
      </div>
      <div className="f-grid2">
        <CategoryField value={catId} onChange={setCatId} categories={categories} onAdd={onAddCategory} />
        <IssueField value={issueId} onChange={setIssue} issues={issues} />
      </div>
      <div className="f-grid2">
        <div>
          <label className="f-label"><span>Sahifalar</span></label>
          <input className="f-input" value={pages} onChange={e => setPages(e.target.value)} placeholder="12–19" />
        </div>
        <div>
          <label className="f-label"><span>DOI suffiksi</span></label>
          <input className="f-input mono" value={doiPreview(issue)} readOnly />
        </div>
      </div>
      <label className="f-check">
        <input type="checkbox" checked={notify} onChange={e => setNotify(e.target.checked)} />
        <span><b>Muallifga Telegram orqali xabar berish</b><span>Bot tasdiqlash haqida avtomatik yozadi.</span></span>
      </label>
      {err && <div className="f-err">{err}</div>}
    </Modal>
  );
}

// ── Rad etish ─────────────────────────────────────────────────────────────────

const REJECT_TEMPLATES: { label: string; text: string }[] = [
  { label: 'Qamrovga mos emas',          text: "Maqola mavzusi jurnalning ilmiy qamroviga (kutubxonashunoslik, axborot-kutubxona texnologiyalari) mos kelmaydi." },
  { label: 'Metodika yetarli emas',      text: "Tadqiqot metodikasi va natijalarning asoslanishi yetarli emas. Tahlil qismini kengaytirib, manbalar bilan mustahkamlab qayta yuboring." },
  { label: 'Rasmiylashtirish talablari', text: "Maqola jurnalning rasmiylashtirish talablariga (annotatsiya, kalit so'zlar, adabiyotlar ro'yxati, UDK) javob bermaydi. Qo'llanmaga muvofiq tuzatib qayta yuboring." },
  { label: 'Plagiat aniqlandi',          text: "Tekshiruv natijasida boshqa manbalar bilan sezilarli o'xshashlik aniqlandi. Matnni qayta ishlab, iqtiboslarni to'g'ri rasmiylashtirib qayta yuboring." },
];

export function RejectModal({ sub, onDone, onClose }: {
  sub: AdminSubmission; onDone: (updated: AdminSubmission) => void; onClose: () => void;
}) {
  const [tpl, setTpl]   = useState<number | null>(null);
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr]   = useState('');

  async function submit() {
    if (!text.trim()) { setErr('Sabab majburiy.'); return; }
    setBusy(true); setErr('');
    try { const u = await adminApi.submissions.reject(sub.id, text.trim()); refreshDashboard(); onDone(u); }
    catch (e) { setErr((e as Error).message); }
    finally { setBusy(false); }
  }

  return (
    <Modal title="Maqolani rad etish" sub="Sabab majburiy — muallif tuzatib qayta yuborishi uchun." onClose={onClose} small
      foot={<>
        <span className="hint">Telegram orqali yuboriladi</span>
        <button className="ab" onClick={onClose}>Bekor qilish</button>
        <button className="ab danger" onClick={submit} disabled={busy}>{busy ? 'Yuborilmoqda…' : 'Rad etish va xabar berish'}</button>
      </>}>
      <div>
        <label className="f-label"><span>Sabab shabloni</span></label>
        <div className="tpl-chips">
          {REJECT_TEMPLATES.map((t, i) => (
            <button key={i} type="button" className={`tpl-chip${tpl === i ? ' on' : ''}`}
              onClick={() => { setTpl(i); setText(t.text); }}>{t.label}</button>
          ))}
        </div>
        <label className="f-label"><span>Muallifga xabar<span className="req">*</span></span></label>
        <textarea className="f-textarea" rows={4} value={text} onChange={e => { setText(e.target.value); setTpl(null); }} />
      </div>
      <div className="f-warn"><i>⚠</i><span>Bu matn muallifga o‘zgarishsiz yuboriladi. Maqola «Rad etilgan» ro‘yxatiga o‘tadi, o‘chirilmaydi.</span></div>
      {err && <div className="f-err">{err}</div>}
    </Modal>
  );
}

// ── Tasdiqdan qaytarish (sabab bilan) ─────────────────────────────────────────

export function RevertModal({ sub, onDone, onClose }: {
  sub: AdminSubmission; onDone: (updated: AdminSubmission) => void; onClose: () => void;
}) {
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
    <Modal title="Tasdiqdan qaytarish" sub="Maqola saytdan olinadi va o‘chiriladi; muallifga sabab boradi." onClose={onClose} small
      foot={<>
        <span className="hint">Telegram orqali yuboriladi</span>
        <button className="ab" onClick={onClose}>Bekor qilish</button>
        <button className="ab danger" onClick={submit} disabled={busy}>{busy ? '…' : 'Qaytarish'}</button>
      </>}>
      <div>
        <label className="f-label"><span>Muallifga xabar</span></label>
        <textarea className="f-textarea" rows={4} value={text} onChange={e => setText(e.target.value)} placeholder="Sabab…" />
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
  const [title, setTitle]     = useState('');
  const [authors, setAuthors] = useState('');
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
    if (!/\.(pdf|docx?)$/i.test(f.name)) { setErr('Faqat .pdf yoki .docx'); return; }
    if (f.size > 20 * 1024 * 1024) { setErr('Fayl 20 MB dan katta'); return; }
    setErr(''); setFile(f);
  }

  async function submit() {
    if (!title.trim())   { setErr('Sarlavha majburiy.'); return; }
    if (!authors.trim()) { setErr('Mualliflar majburiy.'); return; }
    if (!catId)          { setErr('Yo‘nalishni tanlang.'); return; }
    if (!issueId)        { setErr('Jurnal sonini tanlang.'); return; }
    setBusy(true); setErr('');
    try {
      const created = await adminApi.articles.create({
        title: title.trim(), author_names: authors.trim(), category_id: catId, issue_id: issueId,
        ...parsePages(pages), udk: udk.trim() || undefined, source_file: file,
      });
      refreshDashboard(); onDone(created);
    } catch (e) { setErr((e as Error).message); }
    finally { setBusy(false); }
  }

  return (
    <Modal title="Qo‘lda maqola qo‘shish" sub="Bot orqali kelmagan maqolani to‘g‘ridan-to‘g‘ri kiritish." onClose={onClose}
      foot={<>
        <span className="hint">Fayl keyin ham yuklanadi</span>
        <button className="ab" onClick={onClose}>Bekor qilish</button>
        <button className="ab primary" onClick={submit} disabled={busy}>{busy ? 'Saqlanmoqda…' : 'Maqolani saqlash'}</button>
      </>}>
      <div>
        <label className="f-label"><span>Sarlavha<span className="req">*</span></span></label>
        <input className="f-input" value={title} onChange={e => setTitle(e.target.value)} placeholder="Maqola sarlavhasi" autoFocus />
      </div>
      <div>
        <label className="f-label"><span>Mualliflar<span className="req">*</span></span></label>
        <input className="f-input" value={authors} onChange={e => setAuthors(e.target.value)} placeholder="A. Umarov, D. Hamroyeva" />
      </div>
      <div className="f-grid2">
        <CategoryField value={catId} onChange={setCatId} categories={categories} onAdd={onAddCategory} />
        <IssueField value={issueId} onChange={setIssue} issues={issues} />
      </div>
      <div className="f-grid2">
        <div>
          <label className="f-label"><span>Sahifalar</span></label>
          <input className="f-input" value={pages} onChange={e => setPages(e.target.value)} placeholder="12–19" />
        </div>
        <div>
          <label className="f-label"><span>UDK</span></label>
          <input className="f-input" value={udk} onChange={e => setUdk(e.target.value)} placeholder="02(575.1)" />
        </div>
      </div>
      <div className={`dropzone${over ? ' over' : ''}`}
        onClick={() => fileRef.current?.click()}
        onDragOver={e => { e.preventDefault(); setOver(true); }}
        onDragLeave={() => setOver(false)}
        onDrop={e => { e.preventDefault(); setOver(false); pick(e.dataTransfer.files[0]); }}>
        <div className="ico"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 16V5"/><path d="M7 10l5-5 5 5"/><path d="M5 19h14"/></svg></div>
        {file ? <b>{file.name}</b> : <b>Maqola faylini tashlang</b>}
        <span>{file ? `${(file.size / 1024).toFixed(0)} KB · almashtirish uchun bosing` : '.docx yoki .pdf · maks. 20 MB'}</span>
        <input ref={fileRef} type="file" accept=".pdf,.docx,.doc" hidden onChange={e => pick(e.target.files?.[0])} />
      </div>
      {err && <div className="f-err">{err}</div>}
    </Modal>
  );
}
