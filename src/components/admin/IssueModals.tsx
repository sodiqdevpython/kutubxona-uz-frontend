import { useRef, useState } from 'react';
import { adminApi, type AdminIssue } from '../../lib/admin-api';
import { refreshDashboard } from '../../lib/admin-dashboard';
import { useI18n } from '../../lib/i18n';
import { Modal } from './SubmissionModals';

/**
 * Figma «Yangi jurnal soni» — umumiy №, yil, yildagi son + muqova + PDF; qoralama sifatida saqlanadi.
 * Bazada `number` — umumiy tartib raqami (№ 71), `volume` — yil ichidagi tartib (2026-yil 3-son).
 */

export function NewIssueModal({ issues, onDone, onClose }: {
  issues: AdminIssue[]; onDone: (issue: AdminIssue) => void; onClose: () => void;
}) {
  const { t } = useI18n();
  const year = new Date().getFullYear();
  const sameYear = issues.filter(i => i.year === year);
  const [number, setNumber] = useState(String(Math.max(0, ...issues.map(i => i.number)) + 1));
  const [yr, setYr]         = useState(String(year));
  const [volume, setVolume] = useState(String(sameYear.length + 1));
  const [cover, setCover]   = useState<File | null>(null);
  const [pdf, setPdf]       = useState<File | null>(null);
  const [over, setOver]     = useState(false);
  const [busy, setBusy]     = useState(false);
  const [err, setErr]       = useState('');
  const coverRef = useRef<HTMLInputElement>(null);
  const pdfRef   = useRef<HTMLInputElement>(null);

  function pickPdf(f?: File) {
    if (!f) return;
    if (!/\.pdf$/i.test(f.name)) { setErr(t('adm.iss.new.only_pdf')); return; }
    if (f.size > 60 * 1024 * 1024) { setErr(t('adm.iss.new.too_big')); return; }
    setErr(''); setPdf(f);
  }

  async function submit() {
    const v = parseInt(volume, 10), n = parseInt(number, 10), y = parseInt(yr, 10);
    if (!v || !n || !y) { setErr(t('adm.iss.new.required')); return; }
    setBusy(true); setErr('');
    try {
      const issue = await adminApi.issues.create({ volume: v, number: n, year: y, is_upcoming: true }, { cover, pdf });
      refreshDashboard(); onDone(issue);
    } catch (e) { setErr((e as Error).message); }
    finally { setBusy(false); }
  }

  return (
    <Modal title={t('adm.iss.new.title')} sub={t('adm.iss.new.sub')} onClose={onClose}
      foot={<>
        <span className="hint">{t('adm.iss.new.hint')}</span>
        <button className="ab" onClick={onClose}>{t('common.cancel')}</button>
        <button className="ab primary" onClick={submit} disabled={busy}>{busy ? t('adm.iss.new.creating') : t('adm.iss.new.create')}</button>
      </>}>
      <div className="f-grid3">
        <div><label className="f-label"><span>{t('adm.iss.f.number')}<span className="req">*</span></span></label><input className="f-input" value={number} onChange={e => setNumber(e.target.value.replace(/\D/g, ''))} /></div>
        <div><label className="f-label"><span>{t('adm.iss.f.year')}<span className="req">*</span></span></label><input className="f-input" value={yr} onChange={e => setYr(e.target.value.replace(/\D/g, ''))} /></div>
        <div><label className="f-label"><span>{t('adm.iss.f.volume')}<span className="req">*</span></span></label><input className="f-input" value={volume} onChange={e => setVolume(e.target.value.replace(/\D/g, ''))} /></div>
      </div>
      <div className="f-grid2">
        <div>
          <label className="f-label"><span>{t('adm.iss.new.cover')}</span></label>
          <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
            <div className="jr-cover ph" style={{ cursor: 'pointer' }} onClick={() => coverRef.current?.click()}>
              {cover ? <img src={URL.createObjectURL(cover)} alt="" /> : <span>{t('adm.iss.cover')}</span>}
            </div>
            <div style={{ flex: 1 }}>
              <button type="button" className="ab block" onClick={() => coverRef.current?.click()}>{t('adm.iss.new.pick_image')}</button>
              <div className="meta" style={{ fontSize: 12.5, color: 'var(--ink-3)', marginTop: 8 }}>{t('adm.iss.new.cover_hint')}</div>
              <input ref={coverRef} type="file" accept="image/*" hidden onChange={e => setCover(e.target.files?.[0] ?? null)} />
            </div>
          </div>
        </div>
        <div>
          <label className="f-label"><span>{t('adm.iss.pdf_file')}</span></label>
          <div className={`dropzone${over ? ' over' : ''}`} style={{ padding: 18 }}
            onClick={() => pdfRef.current?.click()}
            onDragOver={e => { e.preventDefault(); setOver(true); }} onDragLeave={() => setOver(false)}
            onDrop={e => { e.preventDefault(); setOver(false); pickPdf(e.dataTransfer.files[0]); }}>
            <div className="ico"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 16V5"/><path d="M7 10l5-5 5 5"/><path d="M5 19h14"/></svg></div>
            <b>{pdf ? pdf.name : t('adm.iss.new.drop')}</b>
            <span>{pdf ? `${(pdf.size / 1024 / 1024).toFixed(1)} MB` : t('adm.iss.new.drop_hint')}</span>
            <input ref={pdfRef} type="file" accept=".pdf" hidden onChange={e => pickPdf(e.target.files?.[0])} />
          </div>
        </div>
      </div>
      {err && <div className="f-err">{err}</div>}
    </Modal>
  );
}
