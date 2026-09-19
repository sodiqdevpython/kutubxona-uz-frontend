import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import AdminShell from '../../components/admin/AdminShell';
import ParsePanel from '../../components/admin/ParsePanel';
import { ManualAddModal } from '../../components/admin/SubmissionModals';
import { SEASONS } from '../../lib/seasons';
import { adminApi, type AdminCategory, type AdminIssue, type AdminIssueDetail } from '../../lib/admin-api';
import { fmtBytes, refreshDashboard } from '../../lib/admin-dashboard';

/**
 * Jurnal soni — Figma «Jurnal detail»: chapda muqova + PDF, o'ngda «Son ma'lumotlari»
 * formasi va «Mundarija» (maqola qo'shish / olib tashlash), «PDF'dan ajratish», «Saqlash».
 */

type Form = { volume: string; number: string; year: string; season: string; date_label: string; total_pages: string; is_upcoming: boolean; editor_name: string; editorial_note: string };
const toForm = (i: AdminIssue): Form => ({
  volume: String(i.volume), number: String(i.number), year: String(i.year), season: i.season, date_label: i.date_label,
  total_pages: String(i.total_pages || ''), is_upcoming: i.is_upcoming, editor_name: i.editor_name, editorial_note: i.editorial_note,
});

export default function AdminIssueDetailPage() {
  const { id = '' } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [issue, setIssue]   = useState<AdminIssueDetail | null>(null);
  const [failed, setFailed] = useState(false);
  const [form, setForm]     = useState<Form | null>(null);
  const [saving, setSaving] = useState(false);
  const [cats, setCats]     = useState<AdminCategory[]>([]);
  const [parsing, setParsing] = useState(false);
  const [adding, setAdding]   = useState(false);
  const [toast, setToast]     = useState('');
  const coverRef = useRef<HTMLInputElement>(null);
  const pdfRef   = useRef<HTMLInputElement>(null);

  function flash(t: string) { setToast(t); setTimeout(() => setToast(''), 3500); }
  // id o'zgarsa — eski sonni render vaqtida darhol tozalaymiz
  const [shownId, setShownId] = useState(id);
  if (shownId !== id) { setShownId(id); setIssue(null); setForm(null); setFailed(false); }
  const load = useCallback(() => adminApi.issues.detail(id).then(d => { setIssue(d); setForm(f => f ?? toForm(d)); }).catch(() => setFailed(true)), [id]);
  useEffect(() => { load(); adminApi.categories.list().then(setCats).catch(() => {}); }, [load]);

  const dirty = !!(issue && form) && JSON.stringify(form) !== JSON.stringify(toForm(issue));

  async function save() {
    if (!issue || !form) return;
    setSaving(true);
    try {
      await adminApi.issues.update(issue.id, {
        volume: +form.volume || issue.volume, number: +form.number || issue.number, year: +form.year || issue.year,
        season: form.season, date_label: form.date_label, total_pages: +form.total_pages || 0,
        is_upcoming: form.is_upcoming, editor_name: form.editor_name, editorial_note: form.editorial_note,
      });
      const fresh = await adminApi.issues.detail(issue.id); setIssue(fresh); setForm(toForm(fresh));
      refreshDashboard(); flash('✓ Saqlandi.');
    } catch (e) { flash(`Xatolik: ${(e as Error).message}`); }
    finally { setSaving(false); }
  }
  async function upload(kind: 'cover' | 'pdf', f?: File) {
    if (!issue || !f) return;
    try { await adminApi.issues.update(issue.id, {}, kind === 'cover' ? { cover: f } : { pdf: f }); await load(); flash(kind === 'cover' ? '✓ Muqova yangilandi.' : '✓ PDF yuklandi.'); }
    catch (e) { flash(`Xatolik: ${(e as Error).message}`); }
  }
  async function removeArticle(aid: string) {
    if (!issue || !confirm('Maqola sondan olib tashlansinmi? (maqola o‘zi o‘chirilmaydi)')) return;
    try { await adminApi.issues.removeArticle(issue.id, aid); await load(); refreshDashboard(); }
    catch (e) { flash(`Xatolik: ${(e as Error).message}`); }
  }
  async function removeIssue() {
    if (!issue || !confirm(`${issue.year} № ${issue.number} soni o‘chirilsinmi? Maqolalar sondan chiqadi, o‘zi saqlanadi.`)) return;
    try { await adminApi.issues.remove(issue.id); refreshDashboard(); navigate('/admin/journals'); }
    catch (e) { flash(`Xatolik: ${(e as Error).message}`); }
  }
  async function addCategory(name: string) { const c = await adminApi.categories.create(name); setCats(p => [...p, c]); return c; }

  const pdfName = issue?.pdf_file_url ? decodeURIComponent(issue.pdf_file_url.split('/').pop() || 'PDF') : '';

  return (
    <AdminShell active="journals" crumb="Jurnal sonlari">
      <div className="det-top">
        <Link to="/admin/journals" className="ab">‹ Jurnal sonlari</Link>
        {issue && <span className="lbl">{issue.year} · № {issue.number} ({issue.volume}) {issue.is_upcoming ? 'Qoralama' : 'Nashr etilgan'}</span>}
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 10 }}>
          <button className="ab" style={{ color: 'var(--accent)', borderColor: 'var(--accent)' }} onClick={() => setParsing(true)} disabled={!issue}>PDF’dan ajratish</button>
          <button className="ab primary" onClick={save} disabled={!dirty || saving}>{saving ? 'Saqlanmoqda…' : 'Saqlash'}</button>
        </div>
      </div>

      {failed && <div className="sub-empty">Son topilmadi.</div>}
      {!issue || !form ? (!failed && <div className="sub-empty">Yuklanmoqda…</div>) : (
        <div className="iss-grid">
          <div>
            <div className="iss-card">
              <div className="iss-lbl">Muqova</div>
              <div className={`iss-cover${issue.cover_image_url ? '' : ' ph'}`}>{issue.cover_image_url ? <img src={issue.cover_image_url} alt="" /> : 'Muqova yuklanmagan'}</div>
              <button className="ab block" onClick={() => coverRef.current?.click()}>{issue.cover_image_url ? 'Muqovani almashtirish' : 'Muqova yuklash'}</button>
              <input ref={coverRef} type="file" accept="image/*" hidden onChange={e => upload('cover', e.target.files?.[0])} />
            </div>
            <div className="iss-card">
              <div className="iss-lbl">Sonning PDF fayli</div>
              {issue.pdf_file_url ? (
                <div className="iss-file"><span className="ico">PDF</span><div style={{ minWidth: 0 }}><b title={pdfName}>{pdfName}</b><span>{fmtBytes(issue.pdf_size)}</span></div></div>
              ) : <div className="meta" style={{ fontSize: 13, color: 'var(--adm-red)', marginBottom: 12 }}>PDF yuklanmagan — mundarijani ajratish uchun kerak.</div>}
              <button className="ab block" onClick={() => pdfRef.current?.click()}>{issue.pdf_file_url ? 'Faylni almashtirish' : 'PDF yuklash'}</button>
              <input ref={pdfRef} type="file" accept=".pdf" hidden onChange={e => upload('pdf', e.target.files?.[0])} />
            </div>
            <button className="ab text red block" style={{ marginTop: 16 }} onClick={removeIssue}>Sonni o‘chirish</button>
          </div>

          <div>
            <div className="acard">
              <div className="iss-head"><h3>Son ma’lumotlari</h3></div>
              <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div className="f-grid4">
                  <div><label className="f-label"><span>Jild</span></label><input className="f-input" value={form.volume} onChange={e => setForm({ ...form, volume: e.target.value.replace(/\D/g, '') })} /></div>
                  <div><label className="f-label"><span>Son</span></label><input className="f-input" value={form.number} onChange={e => setForm({ ...form, number: e.target.value.replace(/\D/g, '') })} /></div>
                  <div><label className="f-label"><span>Yil</span></label><input className="f-input" value={form.year} onChange={e => setForm({ ...form, year: e.target.value.replace(/\D/g, '') })} /></div>
                  <div><label className="f-label"><span>Mavsum</span></label><select className="f-select" value={form.season} onChange={e => setForm({ ...form, season: e.target.value })}>{(SEASONS.includes(form.season) ? SEASONS : [form.season, ...SEASONS]).map(s => <option key={s}>{s}</option>)}</select></div>
                </div>
                <div className="f-grid4">
                  <div><label className="f-label"><span>Chiqarilgan sana</span></label><input className="f-input" value={form.date_label} onChange={e => setForm({ ...form, date_label: e.target.value })} placeholder="18.12.2025" /></div>
                  <div><label className="f-label"><span>Sahifalar</span></label><input className="f-input" value={form.total_pages} onChange={e => setForm({ ...form, total_pages: e.target.value.replace(/\D/g, '') })} placeholder="104" /></div>
                  <div><label className="f-label"><span>DOI suffiksi</span></label><input className="f-input mono" value={issue.doi_suffix} readOnly /></div>
                  <div><label className="f-label"><span>Holat</span></label><select className="f-select" value={form.is_upcoming ? 'draft' : 'pub'} onChange={e => setForm({ ...form, is_upcoming: e.target.value === 'draft' })}><option value="pub">Nashr etilgan</option><option value="draft">Qoralama</option></select></div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 16 }}>
                  <div><label className="f-label"><span>Bosh muharrir</span></label><input className="f-input" value={form.editor_name} onChange={e => setForm({ ...form, editor_name: e.target.value })} placeholder="f.f.d. N. Qodirova" /></div>
                  <div><label className="f-label"><span>Tahririyat so‘zi (son sahifasida)</span></label><textarea className="f-textarea" rows={2} style={{ minHeight: 44 }} value={form.editorial_note} onChange={e => setForm({ ...form, editorial_note: e.target.value })} /></div>
                </div>
              </div>
            </div>

            <div className="acard" style={{ marginTop: 16 }}>
              <div className="iss-head">
                <h3>Mundarija<small>{issue.articles.length} maqola</small></h3>
                <button className="ab sm" onClick={() => setAdding(true)}>+ Maqola qo‘shish</button>
              </div>
              <div className="toc-list">
                {issue.articles.length === 0 && <div className="toc-empty">Hali maqola biriktirilmagan — PDF’dan ajrating yoki qo‘lda qo‘shing.</div>}
                {issue.articles.map((a, i) => (
                  <div key={a.id} className="toc-row">
                    <span className="n">{String(i + 1).padStart(2, '0')}</span>
                    <div style={{ minWidth: 0 }}>
                      <a className="t" href={`/articles/${a.slug}`} target="_blank" rel="noreferrer" style={{ textDecoration: 'none' }}>{a.title}</a>
                      {a.doi && <div className="d">{a.doi}</div>}
                    </div>
                    <span className="a">{a.authors_label || '—'}</span>
                    <span className="p">{a.page_start ? `${a.page_start}–${a.page_end ?? ''}` : (a.pages ? `${a.pages} b.` : '—')}</span>
                    <button className="x" title="Sondan olib tashlash" onClick={() => removeArticle(a.id)}>✕</button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {toast && <div className="adm-toast">{toast}</div>}
      {parsing && issue && <ParsePanel issue={issue} onClose={() => { setParsing(false); load(); }} onSaved={load} />}
      {adding && issue && <ManualAddModal categories={cats} issues={[issue]} defaultIssueId={issue.id} onAddCategory={addCategory}
        onDone={() => { setAdding(false); load(); flash('✓ Maqola qo‘shildi.'); }} onClose={() => setAdding(false)} />}
    </AdminShell>
  );
}
