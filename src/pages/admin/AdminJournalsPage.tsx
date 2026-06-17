import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Topbar from '../../components/layout/Topbar';
import PageLoadBar from '../../components/ui/PageLoadBar';
import Footer from '../../components/layout/Footer';
import JournalCover from '../../components/ui/JournalCover';
import { DocIcon } from '../../components/ui/Icons';
import { adminApi, type AdminIssue, type AdminIssueDetail, type AdminJournal, type AdminCategory, type IssueFiles, type NewArticle } from '../../lib/admin-api';

const SEASONS = ['Bahor', 'Yoz', 'Kuz', 'Qish'];

// ── Jurnal soni yaratish/tahrirlash modali ────────────────────────────────────

const EMPTY = {
  volume: '', number: '', year: String(new Date().getFullYear()),
  season: 'Bahor', date_label: '', palette: 0,
  is_current: false, is_upcoming: false, journal_id: '',
};

function IssueFormModal({
  init, initCoverUrl, initPdfUrl, journals, title, onSave, onClose,
}: {
  init:         typeof EMPTY;
  initCoverUrl: string | null;
  initPdfUrl:   string | null;
  journals:     AdminJournal[];
  title:        string;
  onSave:       (d: Record<string, unknown>, files: IssueFiles) => Promise<void>;
  onClose:      () => void;
}) {
  const [f, setF]     = useState(init);
  const [saving, setSav] = useState(false);
  const [err, setErr]    = useState('');
  const [cover, setCover] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(initCoverUrl);
  const [pdf, setPdf] = useState<File | null>(null);
  const [pdfName, setPdfName] = useState<string | null>(initPdfUrl ? decodeURIComponent(initPdfUrl.split('/').pop() || 'PDF') : null);

  const str = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setF(p => ({ ...p, [k]: e.target.value }));

  function onPickCover(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { setErr('Rasm fayl tanlang'); return; }
    setCover(file);
    setCoverPreview(URL.createObjectURL(file));
    setErr('');
  }

  function clearCover() {
    setCover(null);
    setCoverPreview(null);
  }

  function onPickPdf(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.name.toLowerCase().endsWith('.pdf')) { setErr('PDF fayl tanlang'); return; }
    setPdf(file);
    setPdfName(file.name);
    setErr('');
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault(); setSav(true); setErr('');
    try {
      await onSave({
        volume:     Number(f.volume),
        number:     Number(f.number),
        year:       Number(f.year),
        season:     f.season,
        date_label: f.date_label,
        palette:    Number(f.palette),
        is_current: f.is_current,
        is_upcoming: f.is_upcoming,
        journal_id: f.journal_id || undefined,
      }, { cover, pdf });
    } catch (e) { setErr((e as Error).message); }
    finally { setSav(false); }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(10,25,47,0.55)', zIndex: 200, display: 'grid', placeItems: 'center' }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background: 'var(--paper)', border: '1px solid var(--line)', borderRadius: 14, padding: '32px 36px', maxWidth: 540, width: '100%', maxHeight: '95vh', overflowY: 'auto', boxShadow: '0 28px 64px -24px rgba(10,25,47,0.35)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <h3 className="h-display" style={{ fontSize: 22, margin: 0 }}>{title}</h3>
          <button onClick={onClose} style={{ background: 'none', border: 0, cursor: 'pointer', fontSize: 22, color: 'var(--ink-3)' }}>✕</button>
        </div>
        <form onSubmit={submit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
            {([['Jild (Volume)', 'volume'], ['Son (Number)', 'number'], ['Yil', 'year']] as [string, keyof typeof f][]).map(([lbl, k]) => (
              <div key={k}>
                <label style={{ display: 'block', fontSize: 11.5, fontWeight: 600, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: 0.18, marginBottom: 5 }}>{lbl}</label>
                <input type="number" min="1" value={String(f[k])} onChange={str(k)} required
                  style={{ width: '100%', height: 40, border: '1px solid var(--line-2)', borderRadius: 8, padding: '0 12px', fontSize: 14, fontFamily: 'var(--sans)', background: 'var(--grey-2)', outline: 'none', boxSizing: 'border-box' }} />
              </div>
            ))}
            <div>
              <label style={{ display: 'block', fontSize: 11.5, fontWeight: 600, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: 0.18, marginBottom: 5 }}>Mavsum</label>
              <select value={f.season} onChange={str('season')}
                style={{ width: '100%', height: 40, border: '1px solid var(--line-2)', borderRadius: 8, padding: '0 10px', fontSize: 14, fontFamily: 'var(--sans)', background: 'var(--grey-2)', outline: 'none', boxSizing: 'border-box' }}>
                {SEASONS.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
          </div>

          <div style={{ marginBottom: 14 }}>
            <label style={{ display: 'block', fontSize: 11.5, fontWeight: 600, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: 0.18, marginBottom: 5 }}>Sana ko'rinishi</label>
            <input value={f.date_label} onChange={str('date_label')} placeholder="Mart 2026"
              style={{ width: '100%', height: 40, border: '1px solid var(--line-2)', borderRadius: 8, padding: '0 12px', fontSize: 14, fontFamily: 'var(--sans)', background: 'var(--grey-2)', outline: 'none', boxSizing: 'border-box' }} />
          </div>

          {journals.length > 1 && (
            <div style={{ marginBottom: 14 }}>
              <label style={{ display: 'block', fontSize: 11.5, fontWeight: 600, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: 0.18, marginBottom: 5 }}>Jurnal</label>
              <select value={f.journal_id} onChange={str('journal_id')}
                style={{ width: '100%', height: 40, border: '1px solid var(--line-2)', borderRadius: 8, padding: '0 10px', fontSize: 14, fontFamily: 'var(--sans)', background: 'var(--grey-2)', outline: 'none', boxSizing: 'border-box' }}>
                <option value="">Standart jurnal</option>
                {journals.map(j => <option key={j.id} value={j.id}>{j.title}</option>)}
              </select>
            </div>
          )}

          {/* Muqova rasmi (ixtiyoriy) — yo'q bo'lsa default palette ishlatiladi */}
          <div style={{ marginBottom: 18 }}>
            <label style={{ display: 'block', fontSize: 11.5, fontWeight: 600, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: 0.18, marginBottom: 8 }}>
              Muqova rasmi (ixtiyoriy)
            </label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              {coverPreview ? (
                <div style={{ position: 'relative', flexShrink: 0 }}>
                  <img src={coverPreview} alt="cover"
                    style={{ width: 80, height: 108, objectFit: 'cover', borderRadius: 6, border: '1px solid var(--line)' }} />
                  <button type="button" onClick={clearCover}
                    title="O'chirish"
                    style={{ position: 'absolute', top: -8, right: -8, width: 22, height: 22, borderRadius: '50%', background: '#DC2626', color: 'white', border: 0, cursor: 'pointer', fontSize: 12, lineHeight: 1 }}>✕</button>
                </div>
              ) : (
                <div style={{ width: 80, height: 108, borderRadius: 6, background: 'var(--grey-2)', border: '1px dashed var(--line-2)', display: 'grid', placeItems: 'center', flexShrink: 0, fontSize: 11, color: 'var(--ink-4)' }}>
                  Yo'q
                </div>
              )}
              <label style={{ flex: 1, cursor: 'pointer' }}>
                <input type="file" accept="image/*" onChange={onPickCover} style={{ display: 'none' }} />
                <div className="btn ghost" style={{ height: 38, justifyContent: 'center' }}>
                  📁 Rasm tanlash
                </div>
                <div style={{ fontSize: 11.5, color: 'var(--ink-4)', marginTop: 6, lineHeight: 1.5 }}>
                  PNG / JPG. Yuklanmasa, pastdagi palette ranglari ishlatiladi.
                </div>
              </label>
            </div>
          </div>

          {/* PDF fayl (ixtiyoriy) — to'liq son PDF nusxasi */}
          <div style={{ marginBottom: 18 }}>
            <label style={{ display: 'block', fontSize: 11.5, fontWeight: 600, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: 0.18, marginBottom: 8 }}>
              PDF fayl (ixtiyoriy)
            </label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ width: 48, height: 48, borderRadius: 8, background: pdfName ? 'var(--navy-08)' : 'var(--grey-2)', border: `1px ${pdfName ? 'solid var(--navy-30)' : 'dashed var(--line-2)'}`, display: 'grid', placeItems: 'center', flexShrink: 0, fontSize: 18 }}>
                {pdfName ? '📄' : <DocIcon size={18} />}
              </div>
              <label style={{ flex: 1, cursor: 'pointer', minWidth: 0 }}>
                <input type="file" accept="application/pdf,.pdf" onChange={onPickPdf} style={{ display: 'none' }} />
                <div className="btn ghost" style={{ height: 38, justifyContent: 'center' }}>
                  📁 PDF tanlash
                </div>
                {pdfName ? (
                  <div style={{ fontSize: 11.5, color: 'var(--ink-2)', marginTop: 6, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
                    {pdf ? '✓ Yangi: ' : 'Joriy: '}{pdfName}
                  </div>
                ) : (
                  <div style={{ fontSize: 11.5, color: 'var(--ink-4)', marginTop: 6, lineHeight: 1.5 }}>
                    Yuklansa, son sahifasida (arxivda ustiga bosilganda) PDF ochiladi.
                  </div>
                )}
              </label>
            </div>
          </div>

          {/* Default rang palitasi (rasm yuklanmagan paytda) */}
          <div style={{ marginBottom: 18 }}>
            <label style={{ display: 'block', fontSize: 11.5, fontWeight: 600, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: 0.18, marginBottom: 8 }}>Default rang (rasm yo'q bo'lsa)</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {[0,1,2,3,4,5].map(p => (
                  <button key={p} type="button" onClick={() => setF(prev => ({ ...prev, palette: p }))}
                    style={{ width: 36, height: 36, borderRadius: 8, border: `2px solid ${f.palette === p ? 'var(--navy)' : 'var(--line)'}`, background: f.palette === p ? 'var(--navy)' : 'var(--grey-2)', color: f.palette === p ? 'white' : 'var(--ink-2)', cursor: 'pointer', fontSize: 12.5, fontWeight: 600 }}>
                    {p}
                  </button>
                ))}
              </div>
              <JournalCover title="Kutubxona" vol={`Vol.${f.volume || 42}`} year={Number(f.year) || 2026} n={Number(f.number) || 1} palette={f.palette} w={56} h={74} />
            </div>
          </div>

          <div style={{ display: 'flex', gap: 20, marginBottom: 20 }}>
            {([['is_current', 'Joriy son'], ['is_upcoming', 'Tayyorlanmoqda']] as [keyof typeof f, string][]).map(([k, lbl]) => (
              <label key={k} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13.5, cursor: 'pointer' }}>
                <input type="checkbox" checked={Boolean(f[k])} onChange={e => setF(p => ({ ...p, [k]: e.target.checked }))} style={{ accentColor: 'var(--navy)' }} />
                {lbl}
              </label>
            ))}
          </div>

          {err && <div style={{ marginBottom: 14, padding: '10px 14px', background: '#FEF2F2', border: '1px solid #FCA5A5', borderRadius: 8, fontSize: 13, color: '#DC2626' }}>{err}</div>}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <button type="button" onClick={onClose} className="btn ghost" style={{ height: 38 }}>Bekor qilish</button>
            <button type="submit" disabled={saving}
              style={{ height: 38, padding: '0 22px', borderRadius: 6, border: 0, background: saving ? 'var(--navy-30)' : 'var(--navy)', color: 'white', cursor: saving ? 'default' : 'pointer', fontSize: 13, fontWeight: 600, fontFamily: 'var(--sans)' }}>
              {saving ? 'Saqlanmoqda…' : 'Saqlash'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Qo'lda maqola qo'shish modali ─────────────────────────────────────────────

function ArticleFormModal({
  issues, categories, onSave, onClose,
}: {
  issues:     AdminIssue[];
  categories: AdminCategory[];
  onSave:     (a: NewArticle) => Promise<void>;
  onClose:    () => void;
}) {
  const [title,    setTitle]    = useState('');
  const [authors,  setAuthors]  = useState('');
  const [keywords, setKeywords] = useState('');
  const [excerpt,  setExcerpt]  = useState('');
  const [catId,    setCatId]    = useState('');
  const [issueId,  setIssueId]  = useState('');
  const [file,     setFile]     = useState<File | null>(null);
  const [saving,   setSaving]   = useState(false);
  const [err,      setErr]      = useState('');

  const available = issues.filter(i => !i.is_upcoming);

  const lbl: React.CSSProperties = { display: 'block', fontSize: 11.5, fontWeight: 600, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: 0.18, marginBottom: 5 };
  const fld: React.CSSProperties = { width: '100%', border: '1px solid var(--line-2)', borderRadius: 8, padding: '10px 12px', fontSize: 14, fontFamily: 'var(--sans)', background: 'var(--grey-2)', color: 'var(--ink)', outline: 'none', resize: 'vertical', boxSizing: 'border-box' };

  function onPickFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    const ok = f.name.toLowerCase().endsWith('.pdf') || f.name.toLowerCase().endsWith('.docx');
    if (!ok) { setErr('PDF yoki DOCX fayl tanlang'); return; }
    setFile(f); setErr('');
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) { setErr('Sarlavha talab qilinadi'); return; }
    setSaving(true); setErr('');
    try {
      await onSave({
        title:        title.trim(),
        author_names: authors.trim() || undefined,
        keywords:     keywords.trim() || undefined,
        excerpt:      excerpt.trim() || undefined,
        category_id:  catId || undefined,
        issue_id:     issueId || undefined,
        source_file:  file,
      });
    } catch (e) { setErr((e as Error).message); }
    finally { setSaving(false); }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(10,25,47,0.55)', zIndex: 200, display: 'grid', placeItems: 'center', padding: 20 }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background: 'var(--paper)', border: '1px solid var(--line)', borderRadius: 14, padding: '32px 36px', maxWidth: 560, width: '100%', maxHeight: '95vh', overflowY: 'auto', boxShadow: '0 28px 64px -24px rgba(10,25,47,0.35)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <h3 className="h-display" style={{ fontSize: 22, margin: 0 }}>Qo'lda maqola qo'shish</h3>
          <button onClick={onClose} style={{ background: 'none', border: 0, cursor: 'pointer', fontSize: 22, color: 'var(--ink-3)' }}>✕</button>
        </div>
        <p style={{ fontSize: 12.5, color: 'var(--ink-3)', marginBottom: 20 }}>
          Muallif noma'lum bo'lsa, «Mualliflar» maydonini bo'sh qoldiring.
        </p>

        <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={lbl}>Sarlavha *</label>
            <input value={title} onChange={e => setTitle(e.target.value)} required style={{ ...fld, height: 40 }} />
          </div>
          <div>
            <label style={lbl}>Mualliflar (vergul bilan — ixtiyoriy)</label>
            <input value={authors} onChange={e => setAuthors(e.target.value)}
              placeholder="Ism Familiya, Ism Familiya — yoki bo'sh (noma'lum)" style={{ ...fld, height: 40 }} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div>
              <label style={lbl}>Yo'nalish</label>
              <select value={catId} onChange={e => setCatId(e.target.value)} style={{ ...fld, height: 40 }}>
                <option value="">— Yo'nalishsiz —</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label style={lbl}>Jurnal soni</label>
              <select value={issueId} onChange={e => setIssueId(e.target.value)} style={{ ...fld, height: 40 }}>
                <option value="">— Biriktirilmagan —</option>
                {available.map(i => <option key={i.id} value={i.id}>Vol.{i.volume} №{i.number} ({i.year})</option>)}
              </select>
            </div>
          </div>
          <div>
            <label style={lbl}>Kalit so'zlar (vergul bilan — ixtiyoriy)</label>
            <input value={keywords} onChange={e => setKeywords(e.target.value)} style={{ ...fld, height: 40 }} />
          </div>
          <div>
            <label style={lbl}>Annotatsiya (ixtiyoriy)</label>
            <textarea value={excerpt} onChange={e => setExcerpt(e.target.value)} rows={3} style={fld} />
          </div>
          <div>
            <label style={lbl}>Fayl (PDF / DOCX — ixtiyoriy)</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <label style={{ cursor: 'pointer' }}>
                <input type="file" accept="application/pdf,.pdf,.docx" onChange={onPickFile} style={{ display: 'none' }} />
                <div className="btn ghost" style={{ height: 38, justifyContent: 'center' }}>📁 Fayl tanlash</div>
              </label>
              <span style={{ fontSize: 12, color: file ? 'var(--ink-2)' : 'var(--ink-4)', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis', minWidth: 0 }}>
                {file ? `✓ ${file.name}` : 'Tanlanmagan'}
              </span>
            </div>
          </div>

          {err && <div style={{ padding: '10px 14px', background: '#FEF2F2', border: '1px solid #FCA5A5', borderRadius: 8, fontSize: 13, color: '#DC2626' }}>{err}</div>}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 6 }}>
            <button type="button" onClick={onClose} className="btn ghost" style={{ height: 38 }}>Bekor qilish</button>
            <button type="submit" disabled={saving}
              style={{ height: 38, padding: '0 22px', borderRadius: 6, border: 0, background: saving ? 'var(--navy-30)' : 'var(--navy)', color: 'white', cursor: saving ? 'default' : 'pointer', fontSize: 13, fontWeight: 600, fontFamily: 'var(--sans)' }}>
              {saving ? 'Saqlanmoqda…' : 'Qo\'shish'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Bitta jurnal soni kartochkasi ─────────────────────────────────────────────

function IssueCard({
  iss, year, det, onEdit, onDelete, onLoadDetail, onRemoveArticle,
}: {
  iss:    AdminIssue;
  year:   number;
  det:    AdminIssueDetail | undefined;
  onEdit: (i: AdminIssue) => void;
  onDelete: (id: string) => void;
  onLoadDetail: (id: string) => void;
  onRemoveArticle: (issueId: string, articleId: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const arts = det?.articles ?? [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* Cover */}
      <div style={{ position: 'relative' }}>
        <div style={{
          height: 280, display: 'grid', placeItems: 'center', borderRadius: 8,
          background: iss.is_upcoming
            ? 'repeating-linear-gradient(135deg,var(--grey-2),var(--grey-2) 8px,var(--grey-3) 8px,var(--grey-3) 16px)'
            : 'var(--grey-2)',
          position: 'relative', overflow: 'hidden',
        }}>
          {!iss.is_upcoming && (
            iss.cover_image_url ? (
              <img src={iss.cover_image_url} alt="Jurnal muqovasi"
                style={{ width: 160, height: 216, objectFit: 'cover', borderRadius: 6, border: '1px solid var(--line)', display: 'block' }} />
            ) : (
              <JournalCover title="Kutubxona Arxivi" vol={`Vol. ${iss.volume}`} year={year} n={iss.number} palette={iss.palette} w={160} h={216} />
            )
          )}
          {iss.is_upcoming && (
            <div style={{ background: 'var(--paper)', border: '1px dashed var(--line-2)', borderRadius: 6, padding: '8px 12px', fontSize: 11.5, color: 'var(--ink-3)', fontWeight: 600 }}>Tayyorlanmoqda</div>
          )}
          {iss.is_current && (
            <span style={{ position: 'absolute', top: 10, right: 10, fontSize: 9.5, padding: '3px 7px', borderRadius: 3, background: 'var(--navy)', color: 'white', fontWeight: 600, letterSpacing: 0.15, textTransform: 'uppercase' }}>Joriy</span>
          )}
        </div>

        <div style={{ display: 'flex', gap: 4, marginTop: 8 }}>
          <button onClick={() => onEdit(iss)} className="btn ghost"
            style={{ flex: 1, height: 30, fontSize: 11.5, justifyContent: 'center' }}>
            ✏️ Tahrirlash
          </button>
          <button onClick={() => onDelete(iss.id)}
            style={{ flex: 1, height: 30, borderRadius: 6, border: '1px solid #FCA5A5', background: '#FEF2F2', color: '#DC2626', cursor: 'pointer', fontSize: 11.5, fontFamily: 'var(--sans)' }}>
            🗑 O'chirish
          </button>
        </div>
      </div>

      {/* Info */}
      <div>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 4 }}>
          <div className="h-display" style={{ fontSize: 16, fontWeight: 600 }}>{iss.date_label || `${iss.season} ${iss.year}`}</div>
          <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--ink-3)' }}>№{iss.number}</span>
        </div>
        <div style={{ fontSize: 12, color: 'var(--ink-3)', display: 'flex', alignItems: 'center', gap: 8 }}>
          <span>{iss.season}</span>
          {!iss.is_upcoming && (
            <>
              <span style={{ color: 'var(--ink-4)' }}>·</span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                <DocIcon size={11} /> {iss.article_count} maqola
              </span>
              <button
                onClick={() => { onLoadDetail(iss.id); setOpen(p => !p); }}
                style={{ marginLeft: 'auto', background: 'none', border: 0, cursor: 'pointer', fontSize: 12, color: 'var(--navy)', fontWeight: 500 }}>
                {open ? '▲ Yopish' : '▼ Ko\'rsatish'}
              </button>
            </>
          )}
        </div>

        {open && (
          <div style={{ marginTop: 8, paddingTop: 8, borderTop: '1px solid var(--line)', display: 'flex', flexDirection: 'column', gap: 4 }}>
            {!det ? (
              <div style={{ fontSize: 12, color: 'var(--ink-4)' }}>Yuklanmoqda…</div>
            ) : arts.length === 0 ? (
              <div style={{ fontSize: 12, color: 'var(--ink-4)' }}>Maqolalar yo'q.</div>
            ) : arts.map(a => (
              <div key={a.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 6 }}>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 12.5, color: 'var(--ink)', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>{a.title}</div>
                  <div style={{ fontSize: 11.5, color: 'var(--ink-3)' }}>{a.authors_label}</div>
                </div>
                <button onClick={() => onRemoveArticle(iss.id, a.id)} style={{ background: 'none', border: 0, cursor: 'pointer', color: 'var(--ink-4)', fontSize: 14, flexShrink: 0 }}>✕</button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Yil bo'limi ───────────────────────────────────────────────────────────────

function YearSection({
  year, issues, details, onEdit, onDelete, onLoadDetail, onRemoveArticle,
}: {
  year:    number;
  issues:  AdminIssue[];
  details: Record<string, AdminIssueDetail>;
  onEdit:  (i: AdminIssue) => void;
  onDelete: (id: string) => void;
  onLoadDetail: (id: string) => void;
  onRemoveArticle: (issueId: string, articleId: string) => void;
}) {
  const published = issues.filter(i => !i.is_upcoming);
  const total     = published.reduce((s, i) => s + i.article_count, 0);
  const note      = published.length ? `${published.length} son · ${total} ta maqola` : 'Rejalashtirilgan';

  return (
    <section>
      <header style={{ display: 'flex', alignItems: 'end', justifyContent: 'space-between', marginBottom: 24, paddingBottom: 16, borderBottom: '1px solid var(--line)' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 18 }}>
          <h2 className="h-display year-num-rsp" style={{ fontSize: 72, letterSpacing: '-0.04em', lineHeight: 0.9, fontWeight: 700, color: 'var(--navy)' }}>{year}</h2>
          <div>
            <div className="eyebrow" style={{ fontSize: 10.5 }}>Yillik to'plam</div>
            <div style={{ fontSize: 13, color: 'var(--ink-2)', marginTop: 4 }}>{note}</div>
          </div>
        </div>
      </header>

      <div className="rsp-issues">
        {issues.map(iss => (
          <IssueCard
            key={iss.id} iss={iss} year={year}
            det={details[iss.id]}
            onEdit={onEdit}
            onDelete={onDelete}
            onLoadDetail={onLoadDetail}
            onRemoveArticle={onRemoveArticle}
          />
        ))}
      </div>
    </section>
  );
}

// ── Main sahifa ───────────────────────────────────────────────────────────────

export default function AdminJournalsPage() {
  const navigate = useNavigate();
  const [issues,    setIssues]  = useState<AdminIssue[]>([]);
  const [journals,  setJournals] = useState<AdminJournal[]>([]);
  const [cats,      setCats]    = useState<AdminCategory[]>([]);
  const [details,   setDetails] = useState<Record<string, AdminIssueDetail>>({});
  const [loading,   setLoading] = useState(true);
  const [creating,  setCreating] = useState(false);
  const [editing,   setEditing] = useState<AdminIssue | null>(null);
  const [addingArticle, setAddingArticle] = useState(false);
  const [toast,     setToast]   = useState('');

  function flash(t: string) { setToast(t); setTimeout(() => setToast(''), 3000); }

  useEffect(() => {
    Promise.all([adminApi.issues.list(), adminApi.journals.list()])
      .then(([iss, jrnls]) => { setIssues(iss); setJournals(jrnls); setLoading(false); })
      .catch(() => setLoading(false));
    adminApi.categories.list().then(setCats).catch(() => {});
  }, []);

  async function handleCreateArticle(a: NewArticle) {
    await adminApi.articles.create(a);
    setAddingArticle(false);
    flash('✓ Maqola qo\'shildi.');
    // Jurnal soniga biriktirilgan bo'lsa, maqolalar soni yangilanadi
    adminApi.issues.list().then(setIssues).catch(() => {});
    setDetails({});
  }

  async function loadDetail(id: string) {
    if (details[id]) return;
    try { const d = await adminApi.issues.detail(id); setDetails(p => ({ ...p, [id]: d })); } catch {/**/}
  }

  async function handleCreate(data: Record<string, unknown>, files: IssueFiles) {
    const iss = await adminApi.issues.create(data, files);
    setIssues(p => [iss, ...p]); setCreating(false); flash('✓ Yangi jurnal soni yaratildi!');
  }

  async function handleUpdate(data: Record<string, unknown>, files: IssueFiles) {
    if (!editing) return;
    const upd = await adminApi.issues.update(editing.id, data as Partial<AdminIssue>, files);
    setIssues(p => p.map(i => i.id === editing.id ? upd : i)); setEditing(null); flash('✓ Saqlandi.');
  }

  async function handleDelete(id: string) {
    if (!confirm('Jurnal sonini o\'chirasizmi? Maqolalar saqlanib qoladi.')) return;
    await adminApi.issues.remove(id);
    setIssues(p => p.filter(i => i.id !== id)); flash('O\'chirildi.');
  }

  async function handleRemoveArticle(issueId: string, articleId: string) {
    await adminApi.issues.removeArticle(issueId, articleId);
    setDetails(p => {
      const d = p[issueId];
      if (!d) return p;
      return { ...p, [issueId]: { ...d, articles: d.articles.filter(a => a.id !== articleId) } };
    });
    setIssues(pr => pr.map(i => i.id === issueId ? { ...i, article_count: i.article_count - 1 } : i));
    flash('Maqola olib tashlandi.');
  }

  // Yillarga guruhlash
  const yearGroups: { year: number; issues: AdminIssue[] }[] = Object.entries(
    issues.reduce<Record<number, AdminIssue[]>>((acc, i) => {
      (acc[i.year] ??= []).push(i); return acc;
    }, {})
  ).map(([y, arr]) => ({ year: Number(y), issues: arr })).sort((a, b) => b.year - a.year);

  const totalArticles = issues.reduce((s, i) => s + i.article_count, 0);
  const totalPublished = issues.filter(i => !i.is_upcoming).length;
  const minYear = issues.length ? Math.min(...issues.map(i => i.year)) : new Date().getFullYear();

  return (
    <div className="bg-archive" style={{ minHeight: '100vh' }}>
      <PageLoadBar />
      <Topbar active="admin-journals" />

      {/* Header */}
      <div style={{ padding: '40px var(--px) 28px', maxWidth: 1400, margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14, fontSize: 12.5, color: 'var(--ink-3)' }}>
          <a onClick={() => navigate('/')} style={{ cursor: 'pointer', color: 'var(--ink-3)' }}>Bosh sahifa</a>
          <span style={{ color: 'var(--ink-4)' }}>/</span>
          <span style={{ color: 'var(--ink-2)', fontWeight: 500 }}>Jurnal sonlari boshqaruvi</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'end', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1 className="h-display h1-rsp" style={{ fontSize: 48, marginBottom: 10 }}>Jurnal sonlari</h1>
            <p style={{ fontSize: 14.5, color: 'var(--ink-3)', maxWidth: 680, lineHeight: 1.6 }}>
              Yangi son yaratish, maqolalarni ko'rish va boshqarish. Maqolani saytda ko'rsatish uchun «Kelgan maqolalar» sahifasida jurnal soniga torting.
            </p>
          </div>
          <div style={{ display: 'flex', gap: 8, flexShrink: 0, flexWrap: 'wrap' }}>
            <button onClick={() => setAddingArticle(true)}
              className="btn ghost"
              style={{ height: 44, padding: '0 18px', fontSize: 14, fontWeight: 600 }}>
              + Qo'lda maqola qo'shish
            </button>
            <button onClick={() => setCreating(true)}
              style={{ height: 44, padding: '0 20px', borderRadius: 8, border: 0, background: 'var(--navy)', color: 'white', cursor: 'pointer', fontSize: 14, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8, fontFamily: 'var(--sans)' }}>
              + Yangi son yaratish
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="rsp-stats-4" style={{ marginTop: 32 }}>
          {[
            [yearGroups.length > 0 ? `${new Date().getFullYear() - minYear + 1}` : '—', `${minYear}→${new Date().getFullYear()}`],
            [totalPublished > 0 ? totalPublished.toString() : '—', 'Nashr etilgan sonlar'],
            [totalArticles > 0 ? totalArticles.toLocaleString() : '—', 'Jami maqolalar'],
          ].map(([k, v], i) => (
            <div key={i} style={{ background: 'var(--paper)', padding: '18px 22px' }}>
              <div style={{ fontFamily: 'var(--serif)', fontSize: 26, letterSpacing: '-0.02em', color: 'var(--navy)', fontWeight: 600 }}>{k}</div>
              <div style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 4, letterSpacing: 0.2, textTransform: 'uppercase', fontWeight: 600 }}>{v}</div>
            </div>
          ))}
        </div>

        {toast && (
          <div style={{ marginTop: 18, padding: '10px 16px', background: 'rgba(6,95,70,0.08)', border: '1px solid rgba(6,95,70,0.25)', borderRadius: 8, fontSize: 13, color: '#065F46' }}>
            {toast}
          </div>
        )}
      </div>

      {/* Content */}
      <div style={{ padding: '24px var(--px) 64px', maxWidth: 1400, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 56 }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '64px 0', color: 'var(--ink-3)', fontSize: 13 }}>Yuklanmoqda…</div>
        ) : yearGroups.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '64px 0', color: 'var(--ink-3)', fontSize: 13 }}>
            Hali jurnal sonlari yo'q. Yuqoridagi «+ Yangi son yaratish» tugmasini bosing.
          </div>
        ) : yearGroups.map(g => (
          <YearSection
            key={g.year} year={g.year} issues={g.issues}
            details={details}
            onEdit={setEditing}
            onDelete={handleDelete}
            onLoadDetail={loadDetail}
            onRemoveArticle={handleRemoveArticle}
          />
        ))}
      </div>

      <Footer />

      {creating && (
        <IssueFormModal
          init={EMPTY} initCoverUrl={null} initPdfUrl={null}
          journals={journals} title="Yangi jurnal soni"
          onSave={handleCreate} onClose={() => setCreating(false)}
        />
      )}
      {editing && (
        <IssueFormModal
          init={{ volume: String(editing.volume), number: String(editing.number), year: String(editing.year), season: editing.season, date_label: editing.date_label, palette: editing.palette, is_current: editing.is_current, is_upcoming: editing.is_upcoming, journal_id: editing.journal }}
          initCoverUrl={editing.cover_image_url}
          initPdfUrl={editing.pdf_file_url}
          journals={journals} title="Jurnal sonini tahrirlash"
          onSave={handleUpdate} onClose={() => setEditing(null)}
        />
      )}
      {addingArticle && (
        <ArticleFormModal
          issues={issues} categories={cats}
          onSave={handleCreateArticle} onClose={() => setAddingArticle(false)}
        />
      )}
    </div>
  );
}
