import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import AdminShell from '../../components/admin/AdminShell';
import AiUnavailableModal from '../../components/ui/AiUnavailableModal';
import PdfViewer from '../../components/ui/PdfViewer';
import { isPdf } from '../../lib/file-kind';
import DocxViewer from '../../components/article/DocxViewer';
import { ApproveModal, RejectModal, RevertModal } from '../../components/admin/SubmissionModals';
import { getAiStatus, isAiUnavailableError, resetAiStatus } from '../../lib/ai';
import { adminApi, type AdminCategory, type AdminIssue, type AdminSubmission, type SubmissionEdit } from '../../lib/admin-api';
import { fmtBytes, fullTime, refreshDashboard } from '../../lib/admin-dashboard';
import { initialsOf } from '../../lib/submission-meta';
import { mediaUrl } from '../../lib/config';

/**
 * Kelgan maqola — «Ko'rish» sahifasi (Figma «Maqola detail»):
 * chapda qo'lyozma fayli, o'ngda metama'lumot formasi + amallar + muallif kartasi.
 */

type FormState = Required<Pick<SubmissionEdit, 'title' | 'extracted_authors' | 'org' | 'abstract' | 'keywords' | 'references' | 'udk'>>;

function toForm(s: AdminSubmission): FormState {
  return { title: s.title, extracted_authors: s.extracted_authors, org: s.org, abstract: s.abstract, keywords: s.keywords, references: s.references, udk: s.udk };
}

export default function AdminSubmissionDetailPage() {
  const { id = '' } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [sub, setSub]       = useState<AdminSubmission | null>(null);
  const [failed, setFailed] = useState(false);
  const [form, setForm]     = useState<FormState | null>(null);
  const [saving, setSaving] = useState(false);
  const [issues, setIssues] = useState<AdminIssue[]>([]);
  const [cats, setCats]     = useState<AdminCategory[]>([]);
  const [approve, setApprove] = useState(false);
  const [reject, setReject]   = useState(false);
  const [revert, setRevert]   = useState(false);
  const [aiBusy, setAiBusy]   = useState(false);
  const [aiOff, setAiOff]     = useState<{ action: string; reason?: string } | null>(null);
  const [toast, setToast]     = useState('');
  const titleRef = useRef<HTMLInputElement>(null);

  function flash(t: string) { setToast(t); setTimeout(() => setToast(''), 4000); }

  // id o'zgarsa — eski topshirish render vaqtida darhol tozalanadi
  const [shownId, setShownId] = useState(id);
  if (shownId !== id) { setShownId(id); setSub(null); setForm(null); setFailed(false); }

  useEffect(() => {
    adminApi.submissions.get(id).then(s => { setSub(s); setForm(toForm(s)); }).catch(() => setFailed(true));
    adminApi.issues.list().then(setIssues).catch(() => {});
    adminApi.categories.list().then(setCats).catch(() => {});
  }, [id]);

  useEffect(() => {
    if (form && window.location.hash === '#tahrir') setTimeout(() => titleRef.current?.focus(), 100);
  }, [form]);

  const dirty = !!(sub && form) && JSON.stringify(form) !== JSON.stringify(toForm(sub));

  async function save() {
    if (!sub || !form) return;
    setSaving(true);
    try { const u = await adminApi.submissions.update(sub.id, form); setSub(u); setForm(toForm(u)); flash('✓ Saqlandi.'); }
    catch (e) { flash(`Xatolik: ${(e as Error).message}`); }
    finally { setSaving(false); }
  }

  async function runAi() {
    if (!sub) return;
    const status = await getAiStatus();
    if (!status.available) { setAiOff({ action: "AI to'ldirish", reason: status.reason }); return; }
    setAiBusy(true);
    try { const u = await adminApi.submissions.aiExtract(sub.id); setSub(u); setForm(toForm(u)); flash('✦ AI to‘ldirdi — maydonlarni tekshiring.'); }
    catch (e) { if (isAiUnavailableError(e)) { resetAiStatus(); setAiOff({ action: "AI to'ldirish" }); } else flash(`AI xatosi: ${(e as Error).message}`); }
    finally { setAiBusy(false); }
  }

  async function addCategory(name: string) {
    const c = await adminApi.categories.create(name);
    setCats(p => [...p, c].sort((a, b) => a.name.localeCompare(b.name)));
    return c;
  }

  async function ensureSavedThen(open: () => void) {
    if (dirty) await save();
    open();
  }

  if (failed) {
    return (
      <AdminShell active="submissions" crumb="Kelgan maqolalar">
        <div className="sub-empty">Topshirish topilmadi. <Link to="/admin/submissions">← Ro‘yxatga qaytish</Link></div>
      </AdminShell>
    );
  }

  const fileUrl = mediaUrl(sub?.source_file_url);
  const authorName = sub?.author?.name || sub?.author_name || '';
  const authorSub  = [sub?.author?.role, sub?.author?.org || sub?.org].filter(Boolean).join(' · ') || (sub?.tg_username ? `@${sub.tg_username}` : 'Telegram orqali');

  return (
    <AdminShell active="submissions" crumb="Kelgan maqolalar">
      <div className="det-top">
        <Link to="/admin/submissions" className="ab">‹ Kelgan maqolalar</Link>
        <span className="lbl">Ko‘rish</span>
        {sub && <span className="meta">{fullTime(sub.submitted_at || sub.created_at)}{sub.file_name ? ` · ${sub.file_name}` : ''}{sub.file_size ? ` · ${fmtBytes(sub.file_size)}` : ''}</span>}
      </div>

      {!sub || !form ? <div className="sub-empty">Yuklanmoqda…</div> : (
        <div className="det-grid">
          {/* ── Qo'lyozma fayli ── */}
          <div className="det-file">
            <div className="det-file-head">
              <h3>Qo‘lyozma fayli</h3>
              {fileUrl && <a className="ab sm" href={fileUrl} target="_blank" rel="noreferrer">Yuklab olish</a>}
            </div>
            <div className="det-file-body">
              {fileUrl && isPdf(fileUrl) ? (
                <PdfViewer url={fileUrl} title={sub.title || 'Qo‘lyozma'} />
              ) : fileUrl && sub.preview_html ? (
                <div className="docx-wrap"><DocxViewer title={sub.title || sub.file_name || 'Qo‘lyozma'} html={sub.preview_html} /></div>
              ) : fileUrl ? (
                <div className="det-file-empty">
                  <b style={{ display: 'block', color: 'var(--ink)', marginBottom: 6 }}>{sub.file_name}</b>
                  Bu fayl turini brauzerda ko‘rsatib bo‘lmaydi — «Yuklab olish» orqali oching.
                  {sub.image_url && <img src={sub.image_url} alt="" style={{ display: 'block', maxWidth: 360, margin: '20px auto 0', borderRadius: 8, border: '1px solid var(--line)' }} />}
                </div>
              ) : (
                <div className="det-file-empty">Muallif fayl yubormagan.{sub.image_url && <img src={sub.image_url} alt="" style={{ display: 'block', maxWidth: 360, margin: '20px auto 0', borderRadius: 8, border: '1px solid var(--line)' }} />}</div>
              )}
            </div>
          </div>

          {/* ── Metama'lumot ── */}
          <div>
            <div className="det-meta">
              <div className="det-meta-head">
                <h3>Metama’lumot</h3>
                {sub.status === 'pending' && (
                  <button className="ab sm dark" onClick={runAi} disabled={aiBusy || !fileUrl}>{aiBusy ? '✦ Tahlil…' : '✦ AI to‘ldirish'}</button>
                )}
              </div>
              <div className="det-meta-body">
                <Field label="Sarlavha"><input ref={titleRef} className="f-input" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} /></Field>
                <Field label="Muallif"><input className="f-input" value={form.extracted_authors} onChange={e => setForm({ ...form, extracted_authors: e.target.value })} placeholder={authorName} /></Field>
                <Field label="Tashkilot" ai={sub.ai_filled}><input className="f-input" value={form.org} onChange={e => setForm({ ...form, org: e.target.value })} placeholder={sub.author?.org || 'Tashkilot nomi'} /></Field>
                <Field label="Annotatsiya (UZ)" ai={sub.ai_filled}><textarea className="f-textarea" rows={4} value={form.abstract} onChange={e => setForm({ ...form, abstract: e.target.value })} /></Field>
                <Field label="Kalit so‘zlar" ai={sub.ai_filled}><textarea className="f-textarea" rows={3} style={{ minHeight: 72 }} value={form.keywords} onChange={e => setForm({ ...form, keywords: e.target.value })} placeholder="vergul bilan" /></Field>
                <Field label="Adabiyotlar" ai={sub.ai_filled}><textarea className="f-textarea" rows={4} value={form.references} onChange={e => setForm({ ...form, references: e.target.value })} /></Field>
                <Field label="UDK"><input className="f-input" value={form.udk} onChange={e => setForm({ ...form, udk: e.target.value })} placeholder="02:004(575.1)" /></Field>
                <div style={{ height: 6 }} />
              </div>
              <div className="det-meta-foot">
                {sub.status === 'pending' && (
                  <>
                    <button className="ab primary block" onClick={() => ensureSavedThen(() => setApprove(true))}>Tasdiqlash va songa qo‘shish</button>
                    <div className="pair">
                      <button className="ab" onClick={save} disabled={saving || !dirty}>{saving ? 'Saqlanmoqda…' : 'Saqlash'}</button>
                      <button className="ab text red" onClick={() => setReject(true)}>Rad etish</button>
                    </div>
                  </>
                )}
                {sub.status === 'approved' && (
                  <>
                    <div className="det-status">
                      ✓ Tasdiqlangan{sub.article_issue ? ` · ${sub.article_issue.year} № ${sub.article_issue.number}` : ' · songa biriktirilmagan'}
                      {sub.article_doi && <div style={{ fontFamily: 'var(--mono)', fontSize: 12, marginTop: 4 }}>DOI {sub.article_doi}</div>}
                    </div>
                    <div className="pair">
                      <button className="ab" onClick={save} disabled={saving || !dirty}>{saving ? 'Saqlanmoqda…' : 'Saqlash'}</button>
                      <button className="ab text red" onClick={() => setRevert(true)}>Qaytarish</button>
                    </div>
                    {sub.article_slug && <a className="ab sm text" href={`/articles/${sub.article_slug}`} target="_blank" rel="noreferrer">Saytda ochish ↗</a>}
                  </>
                )}
                {sub.status === 'rejected' && (
                  <div className="det-status rejected">Rad etilgan{sub.reject_reason ? ` — ${sub.reject_reason}` : ''}</div>
                )}
              </div>
            </div>

            {/* ── Muallif ── */}
            <div className="det-author">
              <div className="f-label"><span>Muallif</span></div>
              <div className="det-author-row">
                <span className="ava">{sub.author?.avatar_url ? <img src={mediaUrl(sub.author.avatar_url) ?? undefined} alt="" /> : initialsOf(authorName)}</span>
                <div>
                  <div className="det-author-name">{authorName || "Noma'lum muallif"}</div>
                  <div className="det-author-role">{authorSub}</div>
                </div>
              </div>
              <div className="pair">
                <button className="ab" disabled={!sub.author} onClick={() => sub.author && navigate(`/admin/chat?author=${sub.author.slug}`)}>Xabar yozish</button>
                {sub.author
                  ? <a className="ab" href={`/authors/${sub.author.slug}`} target="_blank" rel="noreferrer">Profil</a>
                  : <button className="ab" disabled>Profil</button>}
              </div>
            </div>
          </div>
        </div>
      )}

      {toast && <div className="adm-toast">{toast}</div>}
      <AiUnavailableModal open={aiOff !== null} action={aiOff?.action} reason={aiOff?.reason} onClose={() => setAiOff(null)} />
      {approve && sub && <ApproveModal sub={sub} categories={cats} issues={issues} onAddCategory={addCategory}
        onDone={u => { setSub(u); setForm(toForm(u)); setApprove(false); flash('✓ Tasdiqlandi va songa joylandi.'); refreshDashboard(); }} onClose={() => setApprove(false)} />}
      {reject && sub && <RejectModal sub={sub} onDone={u => { setSub(u); setReject(false); flash('Rad etildi — muallifga xabar yuborildi.'); }} onClose={() => setReject(false)} />}
      {revert && sub && <RevertModal sub={sub} onDone={u => { setSub(u); setRevert(false); flash('Tasdiqdan qaytarildi.'); }} onClose={() => setRevert(false)} />}
    </AdminShell>
  );
}

function Field({ label, ai, children }: { label: string; ai?: boolean; children: ReactNode }) {
  return (
    <div>
      <label className="f-label"><span>{label}</span>{ai && <span className="ai-tag">AI</span>}</label>
      {children}
    </div>
  );
}
