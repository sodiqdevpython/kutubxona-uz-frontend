import { useRef, useState } from 'react';
import { adminApi, type AdminIssue } from '../../lib/admin-api';
import { refreshDashboard } from '../../lib/admin-dashboard';
import { Modal } from './SubmissionModals';
import { SEASONS } from '../../lib/seasons';

/** Figma «Yangi jurnal soni» — jild/son/yil/mavsum + muqova + PDF; qoralama sifatida saqlanadi. */

export function NewIssueModal({ issues, onDone, onClose }: {
  issues: AdminIssue[]; onDone: (issue: AdminIssue) => void; onClose: () => void;
}) {
  const year = new Date().getFullYear();
  const sameYear = issues.filter(i => i.year === year);
  const [volume, setVolume] = useState(String(Math.max(0, ...issues.map(i => i.volume)) + 1 || 1));
  const [number, setNumber] = useState(String(sameYear.length + 1));
  const [yr, setYr]         = useState(String(year));
  const [season, setSeason] = useState(SEASONS[Math.min(3, Math.floor(new Date().getMonth() / 3))]);
  const [cover, setCover]   = useState<File | null>(null);
  const [pdf, setPdf]       = useState<File | null>(null);
  const [over, setOver]     = useState(false);
  const [busy, setBusy]     = useState(false);
  const [err, setErr]       = useState('');
  const coverRef = useRef<HTMLInputElement>(null);
  const pdfRef   = useRef<HTMLInputElement>(null);

  function pickPdf(f?: File) {
    if (!f) return;
    if (!/\.pdf$/i.test(f.name)) { setErr('Faqat PDF'); return; }
    if (f.size > 60 * 1024 * 1024) { setErr('PDF 60 MB dan katta'); return; }
    setErr(''); setPdf(f);
  }

  async function submit() {
    const v = parseInt(volume, 10), n = parseInt(number, 10), y = parseInt(yr, 10);
    if (!v || !n || !y) { setErr('Jild, son va yil majburiy.'); return; }
    setBusy(true); setErr('');
    try {
      const issue = await adminApi.issues.create({ volume: v, number: n, year: y, season, is_upcoming: true }, { cover, pdf });
      refreshDashboard(); onDone(issue);
    } catch (e) { setErr((e as Error).message); }
    finally { setBusy(false); }
  }

  return (
    <Modal title="Yangi jurnal soni" sub="Jild, son va yil majburiy. Muqova va PDF keyin ham yuklanadi." onClose={onClose}
      foot={<>
        <span className="hint">Qoralama sifatida saqlanadi</span>
        <button className="ab" onClick={onClose}>Bekor qilish</button>
        <button className="ab primary" onClick={submit} disabled={busy}>{busy ? 'Yaratilmoqda…' : 'Sonni yaratish'}</button>
      </>}>
      <div className="f-grid4">
        <div><label className="f-label"><span>Jild<span className="req">*</span></span></label><input className="f-input" value={volume} onChange={e => setVolume(e.target.value.replace(/\D/g, ''))} /></div>
        <div><label className="f-label"><span>Son<span className="req">*</span></span></label><input className="f-input" value={number} onChange={e => setNumber(e.target.value.replace(/\D/g, ''))} /></div>
        <div><label className="f-label"><span>Yil<span className="req">*</span></span></label><input className="f-input" value={yr} onChange={e => setYr(e.target.value.replace(/\D/g, ''))} /></div>
        <div><label className="f-label"><span>Mavsum</span></label>
          <select className="f-select" value={season} onChange={e => setSeason(e.target.value)}>{SEASONS.map(s => <option key={s}>{s}</option>)}</select></div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div>
          <label className="f-label"><span>Muqova rasmi</span></label>
          <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
            <div className="jr-cover ph" style={{ cursor: 'pointer' }} onClick={() => coverRef.current?.click()}>
              {cover ? <img src={URL.createObjectURL(cover)} alt="" /> : <span>Muqova</span>}
            </div>
            <div style={{ flex: 1 }}>
              <button type="button" className="ab block" onClick={() => coverRef.current?.click()}>Rasm tanlash</button>
              <div className="meta" style={{ fontSize: 12.5, color: 'var(--ink-3)', marginTop: 8 }}>PNG yoki JPG, 3:4, kamida 900px.</div>
              <input ref={coverRef} type="file" accept="image/*" hidden onChange={e => setCover(e.target.files?.[0] ?? null)} />
            </div>
          </div>
        </div>
        <div>
          <label className="f-label"><span>Sonning PDF fayli</span></label>
          <div className={`dropzone${over ? ' over' : ''}`} style={{ padding: 18 }}
            onClick={() => pdfRef.current?.click()}
            onDragOver={e => { e.preventDefault(); setOver(true); }} onDragLeave={() => setOver(false)}
            onDrop={e => { e.preventDefault(); setOver(false); pickPdf(e.dataTransfer.files[0]); }}>
            <div className="ico"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 16V5"/><path d="M7 10l5-5 5 5"/><path d="M5 19h14"/></svg></div>
            <b>{pdf ? pdf.name : 'Faylni shu yerga tashlang'}</b>
            <span>{pdf ? `${(pdf.size / 1024 / 1024).toFixed(1)} MB` : 'PDF · maks. 60 MB · mundarija avtomatik ajratiladi'}</span>
            <input ref={pdfRef} type="file" accept=".pdf" hidden onChange={e => pickPdf(e.target.files?.[0])} />
          </div>
        </div>
      </div>
      {err && <div className="f-err">{err}</div>}
    </Modal>
  );
}
