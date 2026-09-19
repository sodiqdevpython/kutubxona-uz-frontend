import { useRef, useState } from 'react';
import { adminApi, type AdminAuthor } from '../../lib/admin-api';
import { refreshDashboard } from '../../lib/admin-dashboard';
import { Modal } from './SubmissionModals';

/** Figma «Muallif profili» — barcha maydonlar + foto; Telegram ID o'zgartirilmaydi. */

type Form = { name: string; org: string; role: string; degree: string; orcid: string; email: string; scopus_id: string; bio: string };
const empty: Form = { name: '', org: '', role: '', degree: '', orcid: '', email: '', scopus_id: '', bio: '' };

export function AuthorEditModal({ author, onDone, onClose }: {
  author: AdminAuthor | null; onDone: (a: AdminAuthor) => void; onClose: () => void;
}) {
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
    if (!form.name.trim()) { setErr('Ism majburiy.'); return; }
    if (form.orcid && !/^\d{4}-\d{4}-\d{4}-\d{3}[\dX]$/.test(form.orcid.trim())) { setErr('ORCID formati: 0000-0000-0000-0000'); return; }
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
    <Modal title={author ? 'Muallif profili' : 'Yangi muallif'} sub="Ism majburiy. Tashkilot va ORCID keyin to‘ldirilsa ham bo‘ladi." onClose={onClose}
      foot={<>
        <span className="hint">{author?.telegram_chat_id ? 'Telegram ID o‘zgartirilmaydi' : 'Qo‘lda yaratilgan profil'}</span>
        <button className="ab" onClick={onClose}>Bekor qilish</button>
        <button className="ab primary" onClick={submit} disabled={busy}>{busy ? 'Saqlanmoqda…' : 'Saqlash'}</button>
      </>}>
      <div className="photo-row">
        <span className="pv">{preview ? <img src={preview} alt="" /> : initials}</span>
        <div>
          <p>{preview ? (photo ? photo.name : 'Foto yuklangan') : 'Foto yuklanmagan — monogramma ko‘rsatiladi'}</p>
          <button type="button" className="ab sm" onClick={() => fileRef.current?.click()}>{preview ? 'Fotoni almashtirish' : 'Foto yuklash'}</button>
          <input ref={fileRef} type="file" accept="image/*" hidden onChange={e => setPhoto(e.target.files?.[0] ?? null)} />
        </div>
      </div>
      <div className="f-grid2">
        <div><label className="f-label"><span>To‘liq ism<span className="req">*</span></span></label><input className="f-input" value={form.name} onChange={set('name')} autoFocus /></div>
        <div><label className="f-label"><span>Telegram</span></label><input className="f-input mono" value={author?.telegram_username ? `@${author.telegram_username}` : ''} readOnly placeholder="bot orqali o‘rnatiladi" /></div>
      </div>
      <div className="f-grid2">
        <div><label className="f-label"><span>Tashkilot</span></label><input className="f-input" value={form.org} onChange={set('org')} placeholder="O‘zbekiston Milliy kutubxonasi" /></div>
        <div><label className="f-label"><span>Lavozim</span></label><input className="f-input" value={form.role} onChange={set('role')} placeholder="katta ilmiy xodim" /></div>
      </div>
      <div className="f-grid2">
        <div><label className="f-label"><span>Ilmiy daraja</span></label><input className="f-input" value={form.degree} onChange={set('degree')} placeholder="PhD" /></div>
        <div><label className="f-label"><span>ORCID</span></label><input className="f-input mono" value={form.orcid} onChange={set('orcid')} placeholder="0000-0000-0000-0000" /></div>
      </div>
      <div className="f-grid2">
        <div><label className="f-label"><span>E-pochta</span></label><input className="f-input" value={form.email} onChange={set('email')} placeholder="muallif@example.uz" /></div>
        <div><label className="f-label"><span>Scopus Author ID</span></label><input className="f-input mono" value={form.scopus_id} onChange={set('scopus_id')} /></div>
      </div>
      <div><label className="f-label"><span>Tarjimai hol</span></label><textarea className="f-textarea" rows={3} value={form.bio} onChange={set('bio')} /></div>
      {err && <div className="f-err">{err}</div>}
    </Modal>
  );
}

export function AuthorDeleteModal({ author, onDone, onClose }: { author: AdminAuthor; onDone: () => void; onClose: () => void }) {
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
    <Modal title="Profilni o‘chirish" sub={`«${author.name}» — ${author.article_count} maqola bog‘langan.`} onClose={onClose} small
      foot={<>
        <button className="ab" onClick={onClose}>Bekor qilish</button>
        <button className="ab danger" onClick={submit} disabled={busy}>{busy ? '…' : 'O‘chirish'}</button>
      </>}>
      <label className="f-check" style={{ background: mode === 'soft' ? '#FDF3E7' : 'var(--adm-field)', borderColor: mode === 'soft' ? '#F5C99A' : 'var(--line)' }}>
        <input type="radio" checked={mode === 'soft'} onChange={() => setMode('soft')} />
        <span><b>Faqat profil</b><span>Maqolalar saqlanadi, muallif nomi matn sifatida qoladi.</span></span>
      </label>
      <label className="f-check" style={{ background: mode === 'full' ? 'var(--adm-red-08)' : 'var(--adm-field)', borderColor: mode === 'full' ? 'var(--adm-red)' : 'var(--line)' }}>
        <input type="radio" checked={mode === 'full'} onChange={() => setMode('full')} />
        <span><b>Profil va barcha maqolalari</b><span>Qaytarib bo‘lmaydi.</span></span>
      </label>
      {err && <div className="f-err">{err}</div>}
    </Modal>
  );
}
