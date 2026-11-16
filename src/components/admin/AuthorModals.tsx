import { useRef, useState } from 'react';
import { adminApi, type AdminAuthor } from '../../lib/admin-api';
import { refreshDashboard } from '../../lib/admin-dashboard';
import { useI18n } from '../../lib/i18n';
import { Modal } from './SubmissionModals';

/** Figma «Muallif profili» — barcha maydonlar + foto; Telegram ID o'zgartirilmaydi. */

type Form = { name: string; org: string; role: string; degree: string; orcid: string; email: string; scopus_id: string; bio: string };
const empty: Form = { name: '', org: '', role: '', degree: '', orcid: '', email: '', scopus_id: '', bio: '' };

export function AuthorEditModal({ author, onDone, onClose }: {
  author: AdminAuthor | null; onDone: (a: AdminAuthor) => void; onClose: () => void;
}) {
  const { t } = useI18n();
  const [form, setForm] = useState<Form>(author ? {
    name: author.name, org: author.org, role: author.role, degree: author.degree,
    orcid: author.orcid, email: author.email, scopus_id: author.scopus_id, bio: author.bio,
  } : empty);
  const [photo, setPhoto] = useState<File | null>(null);
  const [busy, setBusy]   = useState(false);
  const [err, setErr]     = useState('');
  const fileRef = useRef<HTMLInputElement>(null);
  const set = (k: keyof Form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setForm({ ...form, [k]: e.target.value });

  async function submit() {
    if (!form.name.trim()) { setErr(t('adm.au.m.name_required')); return; }
    if (form.orcid && !/^\d{4}-\d{4}-\d{4}-\d{3}[\dX]$/.test(form.orcid.trim())) { setErr(t('adm.au.m.orcid_format')); return; }
    setBusy(true); setErr('');
    try {
      const data = { ...form, name: form.name.trim(), orcid: form.orcid.trim() };
      const saved = author ? await adminApi.authors.update(author.id, data, photo) : await adminApi.authors.create(data, photo);
      refreshDashboard(); onDone(saved);
    } catch (e) { setErr((e as Error).message); }
    finally { setBusy(false); }
  }

  const preview = photo ? URL.createObjectURL(photo) : author?.avatar_url ?? null;
  const initials = (form.name || '?').split(/\s+/).map(p => p[0]).join('').slice(0, 2).toUpperCase();

  return (
    <Modal title={author ? t('adm.au.profile') : t('adm.au.m.new_title')} sub={t('adm.au.m.sub')} onClose={onClose}
      foot={<>
        <span className="hint">{author?.telegram_chat_id ? t('adm.au.m.tg_locked') : t('adm.au.m.manual')}</span>
        <button className="ab" onClick={onClose}>{t('common.cancel')}</button>
        <button className="ab primary" onClick={submit} disabled={busy}>{busy ? t('adm.iss.saving') : t('common.save')}</button>
      </>}>
      <div className="photo-row">
        <span className="pv">{preview ? <img src={preview} alt="" /> : initials}</span>
        <div>
          <p>{preview ? (photo ? photo.name : t('adm.au.m.photo_set')) : t('adm.au.m.photo_none')}</p>
          <button type="button" className="ab sm" onClick={() => fileRef.current?.click()}>{preview ? t('adm.au.m.photo_replace') : t('adm.au.m.photo_upload')}</button>
          <input ref={fileRef} type="file" accept="image/*" hidden onChange={e => setPhoto(e.target.files?.[0] ?? null)} />
        </div>
      </div>
      <div className="f-grid2">
        <div><label className="f-label"><span>{t('adm.au.m.full_name')}<span className="req">*</span></span></label><input className="f-input" value={form.name} onChange={set('name')} autoFocus /></div>
        <div><label className="f-label"><span>Telegram</span></label><input className="f-input mono" value={author?.telegram_username ? `@${author.telegram_username}` : ''} readOnly placeholder={t('adm.au.m.tg_ph')} /></div>
      </div>
      <div className="f-grid2">
        <div><label className="f-label"><span>{t('adm.au.th.org')}</span></label><input className="f-input" value={form.org} onChange={set('org')} placeholder={t('adm.au.m.org_ph')} /></div>
        <div><label className="f-label"><span>{t('adm.au.m.role')}</span></label><input className="f-input" value={form.role} onChange={set('role')} placeholder={t('adm.au.m.role_ph')} /></div>
      </div>
      <div className="f-grid2">
        <div><label className="f-label"><span>{t('adm.au.degree')}</span></label><input className="f-input" value={form.degree} onChange={set('degree')} placeholder="PhD" /></div>
        <div><label className="f-label"><span>ORCID</span></label><input className="f-input mono" value={form.orcid} onChange={set('orcid')} placeholder="0000-0000-0000-0000" /></div>
      </div>
      <div className="f-grid2">
        <div><label className="f-label"><span>{t('adm.au.email')}</span></label><input className="f-input" value={form.email} onChange={set('email')} placeholder={t('adm.au.m.email_ph')} /></div>
        <div><label className="f-label"><span>Scopus Author ID</span></label><input className="f-input mono" value={form.scopus_id} onChange={set('scopus_id')} /></div>
      </div>
      <div><label className="f-label"><span>{t('adm.au.bio')}</span></label><textarea className="f-textarea" rows={3} value={form.bio} onChange={set('bio')} /></div>
      {err && <div className="f-err">{err}</div>}
    </Modal>
  );
}

export function AuthorDeleteModal({ author, onDone, onClose }: { author: AdminAuthor; onDone: () => void; onClose: () => void }) {
  const { t, tn } = useI18n();
  const [mode, setMode] = useState<'soft' | 'full'>('soft');
  const [busy, setBusy] = useState(false);
  const [err, setErr]   = useState('');
  async function submit() {
    setBusy(true); setErr('');
    try { await adminApi.authors.remove(author.id, mode); refreshDashboard(); onDone(); }
    catch (e) { setErr((e as Error).message); }
    finally { setBusy(false); }
  }
  return (
    <Modal title={t('adm.au.delete')} sub={t('adm.au.m.del_sub', { name: author.name, articles: tn('unit.articles', author.article_count) })} onClose={onClose} small
      foot={<>
        <button className="ab" onClick={onClose}>{t('common.cancel')}</button>
        <button className="ab danger" onClick={submit} disabled={busy}>{busy ? '…' : t('common.delete')}</button>
      </>}>
      <label className="f-check" style={{ background: mode === 'soft' ? '#FDF3E7' : 'var(--adm-field)', borderColor: mode === 'soft' ? '#F5C99A' : 'var(--line)' }}>
        <input type="radio" checked={mode === 'soft'} onChange={() => setMode('soft')} />
        <span><b>{t('adm.au.m.soft')}</b><span>{t('adm.au.m.soft_s')}</span></span>
      </label>
      <label className="f-check" style={{ background: mode === 'full' ? 'var(--adm-red-08)' : 'var(--adm-field)', borderColor: mode === 'full' ? 'var(--adm-red)' : 'var(--line)' }}>
        <input type="radio" checked={mode === 'full'} onChange={() => setMode('full')} />
        <span><b>{t('adm.au.m.full')}</b><span>{t('adm.au.m.full_s')}</span></span>
      </label>
      {err && <div className="f-err">{err}</div>}
    </Modal>
  );
}
