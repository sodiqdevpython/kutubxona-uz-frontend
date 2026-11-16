import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import AdminShell from '../../components/admin/AdminShell';
import ParsePanel from '../../components/admin/ParsePanel';
import { ManualAddModal } from '../../components/admin/SubmissionModals';
import { adminApi, type AdminCategory, type AdminIssue, type AdminIssueDetail } from '../../lib/admin-api';
import { fmtBytes, refreshDashboard } from '../../lib/admin-dashboard';
import { useI18n } from '../../lib/i18n';

/**
 * Jurnal soni — Figma «Jurnal detail»: chapda muqova + PDF, o'ngda «Son ma'lumotlari»
 * formasi va «Mundarija» (maqola qo'shish / olib tashlash), «PDF'dan ajratish», «Saqlash».
 */

type Form = { volume: string; number: string; year: string; date_label: string; total_pages: string; is_upcoming: boolean; editor_name: string; editorial_note: string };
const toForm = (i: AdminIssue): Form => ({
  volume: String(i.volume), number: String(i.number), year: String(i.year), date_label: i.date_label,
  total_pages: String(i.total_pages || ''), is_upcoming: i.is_upcoming, editor_name: i.editor_name, editorial_note: i.editorial_note,
});

export default function AdminIssueDetailPage() {
  const { id = '' } = useParams<{ id: string }>();
  const { t, tn } = useI18n();
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

  function flash(msg: string) { setToast(msg); setTimeout(() => setToast(''), 3500); }
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
        date_label: form.date_label, total_pages: +form.total_pages || 0,
        is_upcoming: form.is_upcoming, editor_name: form.editor_name, editorial_note: form.editorial_note,
      });
      const fresh = await adminApi.issues.detail(issue.id); setIssue(fresh); setForm(toForm(fresh));
      refreshDashboard(); flash(t('adm.iss.saved'));
    } catch (e) { flash(t('adm.iss.error', { e: (e as Error).message })); }
    finally { setSaving(false); }
  }
  async function upload(kind: 'cover' | 'pdf', f?: File) {
    if (!issue || !f) return;
    try { await adminApi.issues.update(issue.id, {}, kind === 'cover' ? { cover: f } : { pdf: f }); await load(); flash(kind === 'cover' ? t('adm.iss.cover_updated') : t('adm.iss.pdf_uploaded')); }
    catch (e) { flash(t('adm.iss.error', { e: (e as Error).message })); }
  }
  async function removeArticle(aid: string) {
    if (!issue || !confirm(t('adm.iss.confirm_remove_article'))) return;
    try { await adminApi.issues.removeArticle(issue.id, aid); await load(); refreshDashboard(); }
    catch (e) { flash(t('adm.iss.error', { e: (e as Error).message })); }
  }
  async function removeIssue() {
    if (!issue || !confirm(t('adm.iss.confirm_remove_issue', { year: issue.year, n: issue.number }))) return;
    try { await adminApi.issues.remove(issue.id); refreshDashboard(); navigate('/admin/journals'); }
    catch (e) { flash(t('adm.iss.error', { e: (e as Error).message })); }
  }
  async function addCategory(name: string) { const c = await adminApi.categories.create(name); setCats(p => [...p, c]); return c; }

  const pdfName = issue?.pdf_file_url ? decodeURIComponent(issue.pdf_file_url.split('/').pop() || 'PDF') : '';

  return (
    <AdminShell active="journals" crumb={t('nav.admin.journals')}>
      <div className="det-top">
        <Link to="/admin/journals" className="ab">{t('adm.iss.back')}</Link>
        {issue && <span className="lbl">{issue.year} · № {issue.number} {issue.is_upcoming ? t('adm.jr.draft') : t('adm.jr.published')}</span>}
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 10 }}>
          <button className="ab" style={{ color: 'var(--accent)', borderColor: 'var(--accent)' }} onClick={() => setParsing(true)} disabled={!issue}>{t('adm.jr.parse')}{issue && issue.parsed_pending > 0 ? ` · ${issue.parsed_pending}` : ''}</button>
          <button className="ab primary" onClick={save} disabled={!dirty || saving}>{saving ? t('adm.iss.saving') : t('common.save')}</button>
        </div>
      </div>

      {failed && <div className="sub-empty">{t('adm.iss.not_found')}</div>}
      {!issue || !form ? (!failed && <div className="sub-empty">{t('common.loading')}</div>) : (
        <div className="iss-grid">
          <div>
            <div className="iss-card">
              <div className="iss-lbl">{t('adm.iss.cover')}</div>
              <div className={`iss-cover${issue.cover_image_url ? '' : ' ph'}`}>{issue.cover_image_url ? <img src={issue.cover_image_url} alt="" /> : t('adm.iss.no_cover')}</div>
              <button className="ab block" onClick={() => coverRef.current?.click()}>{issue.cover_image_url ? t('adm.iss.replace_cover') : t('adm.iss.upload_cover')}</button>
              <input ref={coverRef} type="file" accept="image/*" hidden onChange={e => upload('cover', e.target.files?.[0])} />
            </div>
            <div className="iss-card">
              <div className="iss-lbl">{t('adm.iss.pdf_file')}</div>
              {issue.pdf_file_url ? (
                <div className="iss-file"><span className="ico">PDF</span><div style={{ minWidth: 0 }}><b title={pdfName}>{pdfName}</b><span>{fmtBytes(issue.pdf_size)}</span></div></div>
              ) : <div className="meta" style={{ fontSize: 13, color: 'var(--adm-red)', marginBottom: 12 }}>{t('adm.iss.pdf_needed')}</div>}
              {issue.parsed_pending > 0 && (
                <div className="meta" style={{ fontSize: 12.5, color: 'var(--adm-red)', margin: '0 0 12px', lineHeight: 1.5 }}>
                  {t('adm.iss.pending_note', { n: issue.parsed_pending })}
                </div>
              )}
              <button className="ab block" onClick={() => pdfRef.current?.click()}>{issue.pdf_file_url ? t('adm.iss.replace_file') : t('adm.iss.upload_pdf')}</button>
              <input ref={pdfRef} type="file" accept=".pdf" hidden onChange={e => upload('pdf', e.target.files?.[0])} />
            </div>
            <button className="ab text red block" style={{ marginTop: 16 }} onClick={removeIssue}>{t('adm.iss.delete')}</button>
          </div>

          <div>
            <div className="acard">
              <div className="iss-head"><h3>{t('adm.iss.info')}</h3></div>
              <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div className="f-grid3">
                  <div><label className="f-label"><span>{t('adm.iss.f.number')}</span></label><input className="f-input" value={form.number} onChange={e => setForm({ ...form, number: e.target.value.replace(/\D/g, '') })} /></div>
                  <div><label className="f-label"><span>{t('adm.iss.f.year')}</span></label><input className="f-input" value={form.year} onChange={e => setForm({ ...form, year: e.target.value.replace(/\D/g, '') })} /></div>
                  <div><label className="f-label"><span>{t('adm.iss.f.volume')}</span></label><input className="f-input" value={form.volume} onChange={e => setForm({ ...form, volume: e.target.value.replace(/\D/g, '') })} /></div>
                </div>
                <div className="f-grid3">
                  <div><label className="f-label"><span>{t('adm.iss.f.date')}</span></label><input className="f-input" value={form.date_label} onChange={e => setForm({ ...form, date_label: e.target.value })} placeholder="18.12.2025" /></div>
                  <div><label className="f-label"><span>{t('adm.iss.f.pages')}</span></label><input className="f-input" value={form.total_pages} onChange={e => setForm({ ...form, total_pages: e.target.value.replace(/\D/g, '') })} placeholder="104" /></div>
                  <div><label className="f-label"><span>{t('adm.iss.f.status')}</span></label><select className="f-select" value={form.is_upcoming ? 'draft' : 'pub'} onChange={e => setForm({ ...form, is_upcoming: e.target.value === 'draft' })}><option value="pub">{t('adm.jr.published')}</option><option value="draft">{t('adm.jr.draft')}</option></select></div>
                </div>
                <div className="f-grid-1-2" style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 16 }}>
                  <div><label className="f-label"><span>{t('adm.iss.f.editor')}</span></label><input className="f-input" value={form.editor_name} onChange={e => setForm({ ...form, editor_name: e.target.value })} placeholder={t('adm.iss.f.editor_ph')} /></div>
                  <div><label className="f-label"><span>{t('adm.iss.f.note')}</span></label><textarea className="f-textarea" rows={2} style={{ minHeight: 44 }} value={form.editorial_note} onChange={e => setForm({ ...form, editorial_note: e.target.value })} /></div>
                </div>
              </div>
            </div>

            <div className="acard" style={{ marginTop: 16 }}>
              <div className="iss-head">
                <h3>{t('adm.iss.toc')}<small>{tn('unit.articles', issue.articles.length)}</small></h3>
                <button className="ab sm" onClick={() => setAdding(true)}>{t('adm.iss.add_article')}</button>
              </div>
              <div className="toc-list">
                {issue.articles.length === 0 && <div className="toc-empty">{t('adm.iss.toc_empty')}</div>}
                {issue.articles.map((a, i) => (
                  <div key={a.id} className="toc-row">
                    <span className="n">{String(i + 1).padStart(2, '0')}</span>
                    <div style={{ minWidth: 0 }}>
                      <Link className="t" to={`/admin/journals/${issue.id}/articles/${a.id}`} style={{ textDecoration: 'none' }}>{a.title}</Link>
                      <div className="d"><a href={`/articles/${a.slug}`} target="_blank" rel="noreferrer" style={{ color: 'inherit' }}>{t('adm.art.open_site')}</a></div>
                    </div>
                    <span className="a">{a.authors_label || '—'}</span>
                    <span className="p">{a.page_start ? `${a.page_start}–${a.page_end ?? ''}` : (a.pages ? t('unit.pages_abbr', { n: a.pages }) : '—')}</span>
                    <span className="acts">
                      <Link className="x ed" to={`/admin/journals/${issue.id}/articles/${a.id}`} title={t('adm.art.edit')} aria-label={t('adm.art.edit')}>✎</Link>
                      <button className="x" title={t('adm.iss.remove_article')} aria-label={t('adm.iss.remove_article')} onClick={() => removeArticle(a.id)}>✕</button>
                    </span>
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
        onDone={() => { setAdding(false); load(); flash(t('adm.iss.article_added')); }} onClose={() => setAdding(false)} />}
    </AdminShell>
  );
}
