import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import AdminShell from '../../components/admin/AdminShell';
import AuthorListEditor, {
  entriesSignature, entriesToPayload, entryFromName, entryFromProfile, matchToProfile, validateEntries,
  type AuthorEntry,
} from '../../components/admin/AuthorPicker';
import { CategoryField, IssueField, parsePages } from '../../components/admin/SubmissionModals';
import { adminApi, type AdminArticleEdit, type AdminCategory, type AdminIssue } from '../../lib/admin-api';
import { refreshDashboard } from '../../lib/admin-dashboard';
import { useI18n } from '../../lib/i18n';

/**
 * Maqolani tahrirlash (Jurnal soni → mundarija → ✎).
 * Sarlavha, mualliflar (bir nechta, har biri alohida profil — mavjudini qidirib
 * yoki yangisini yaratib), yo'nalish, son, betlar, UDK, annotatsiya, kalit so'zlar,
 * adabiyotlar va maqola fayli.
 */

interface Form {
  title: string; categoryId: string; issueId: string; pages: string; udk: string;
  excerpt: string; keywords: string; references: string;
}

const toForm = (a: AdminArticleEdit): Form => ({
  title: a.title, categoryId: a.category?.id ?? '', issueId: a.issue?.id ?? '',
  pages: a.page_start ? `${a.page_start}${a.page_end ? `–${a.page_end}` : ''}` : '',
  udk: a.udk, excerpt: a.excerpt, keywords: a.keywords, references: a.references,
});

function toEntries(a: AdminArticleEdit): AuthorEntry[] {
  const names = new Set(a.authors.map(x => x.name.toLowerCase()));
  return [
    ...a.authors.map(x => entryFromProfile(matchToProfile(x))),
    ...a.author_names.filter(n => !names.has(n.toLowerCase())).map(n => entryFromName(n, 'text')),
  ];
}

export default function AdminArticleEditPage() {
  const { issueId = '', articleId = '' } = useParams<{ issueId: string; articleId: string }>();
  const { t } = useI18n();
  const navigate = useNavigate();
  const [article, setArticle] = useState<AdminArticleEdit | null>(null);
  const [failed, setFailed]   = useState(false);
  const [form, setForm]       = useState<Form | null>(null);
  const [authors, setAuthors] = useState<AuthorEntry[]>([]);
  const [baseSig, setBaseSig] = useState('');
  const [file, setFile]       = useState<File | null>(null);
  const [cats, setCats]       = useState<AdminCategory[]>([]);
  const [issues, setIssues]   = useState<AdminIssue[]>([]);
  const [saving, setSaving]   = useState(false);
  const [err, setErr]         = useState('');
  const [toast, setToast]     = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  function reset(a: AdminArticleEdit) {
    const entries = toEntries(a);
    setArticle(a); setForm(toForm(a)); setAuthors(entries); setBaseSig(entriesSignature(entries)); setFile(null);
  }

  useEffect(() => {
    adminApi.articles.get(articleId).then(reset).catch(() => setFailed(true));
    adminApi.categories.list().then(setCats).catch(() => {});
    adminApi.issues.list().then(setIssues).catch(() => {});
  }, [articleId]);

  const dirty = !!(article && form) && (
    JSON.stringify(form) !== JSON.stringify(toForm(article)) || entriesSignature(authors) !== baseSig || !!file
  );

  // Saqlanmagan o'zgarish bilan sahifani yopishdan ogohlantirish
  useEffect(() => {
    if (!dirty) return;
    const h = (e: BeforeUnloadEvent) => { e.preventDefault(); };
    window.addEventListener('beforeunload', h);
    return () => window.removeEventListener('beforeunload', h);
  }, [dirty]);

  function flash(msg: string) { setToast(msg); setTimeout(() => setToast(''), 3500); }
  const backTo = `/admin/journals/${article?.issue?.id ?? issueId}`;

  async function save() {
    if (!article || !form) return;
    if (!form.title.trim()) { setErr(t('adm.sub.mod.title_required')); return; }
    const authorsErr = validateEntries(authors, t);
    if (authorsErr) { setErr(authorsErr); return; }
    setSaving(true); setErr('');
    const pg = parsePages(form.pages);
    try {
      const fresh = await adminApi.articles.update(article.id, {
        title: form.title.trim(), excerpt: form.excerpt, references: form.references, udk: form.udk.trim(),
        keywords: form.keywords, page_start: pg.page_start ?? null, page_end: pg.page_end ?? null,
        category_id: form.categoryId || null, issue_id: form.issueId || null,
        authors: entriesToPayload(authors),
      }, file);
      reset(fresh); refreshDashboard(); flash(t('adm.art.saved'));
    } catch (e) { setErr((e as Error).message); }
    finally { setSaving(false); }
  }

  function goBack() {
    if (dirty && !confirm(t('adm.art.leave_confirm'))) return;
    navigate(backTo);
  }

  async function addCategory(name: string) { const c = await adminApi.categories.create(name); setCats(p => [...p, c]); return c; }

  return (
    <AdminShell active="journals" crumb={t('nav.admin.journals')}>
      <div className="det-top">
        <button className="ab" onClick={goBack}>{t('adm.art.back')}</button>
        {article?.issue && <span className="lbl">{article.issue.year} · № {article.issue.number}</span>}
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 10, alignItems: 'center' }}>
          {dirty && <span className="art-dirty">{t('adm.art.unsaved')}</span>}
          {article && <a className="ab" href={`/articles/${article.slug}`} target="_blank" rel="noreferrer">{t('adm.art.open_site')}</a>}
          <button className="ab primary" onClick={save} disabled={!dirty || saving}>{saving ? t('adm.iss.saving') : t('common.save')}</button>
        </div>
      </div>

      {failed && <div className="sub-empty">{t('adm.art.not_found')}</div>}
      {!article || !form ? (!failed && <div className="sub-empty">{t('common.loading')}</div>) : (
        <div className="art-grid">
          <div>
            <div className="acard">
              <div className="iss-head"><h3>{t('adm.art.main')}</h3></div>
              <div className="art-sec">
                <div>
                  <label className="f-label"><span>{t('adm.sub.d.f.title')}<span className="req">*</span></span></label>
                  <textarea className="f-textarea" rows={2} value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
                </div>
                <div className="f-grid2">
                  <CategoryField value={form.categoryId} onChange={id => setForm({ ...form, categoryId: id })} categories={cats} onAdd={addCategory} />
                  <IssueField value={form.issueId} onChange={id => setForm({ ...form, issueId: id })} required={false}
                    emptyLabel={t('adm.art.no_issue')} issues={issues} />
                </div>
                <div className="f-grid2">
                  <div>
                    <label className="f-label"><span>{t('adm.sub.mod.pages')}</span></label>
                    <input className="f-input" value={form.pages} onChange={e => setForm({ ...form, pages: e.target.value })} placeholder="12–19" />
                  </div>
                  <div>
                    <label className="f-label"><span>{t('adm.sub.d.f.udk')}</span></label>
                    <input className="f-input" value={form.udk} onChange={e => setForm({ ...form, udk: e.target.value })} placeholder="02(575.1)" />
                  </div>
                </div>
              </div>
            </div>

            <div className="acard ap-host" style={{ marginTop: 16 }}>
              <div className="iss-head"><h3>{t('adm.art.authors')}<small>{authors.length}</small></h3></div>
              <div className="art-sec">
                <p className="art-hint">{t('adm.art.authors_hint')}</p>
                <AuthorListEditor value={authors} onChange={setAuthors} />
              </div>
            </div>

            <div className="acard" style={{ marginTop: 16 }}>
              <div className="iss-head"><h3>{t('adm.art.content')}</h3></div>
              <div className="art-sec">
                <div>
                  <label className="f-label"><span>{t('adm.art.f.excerpt')}</span></label>
                  <textarea className="f-textarea" rows={5} value={form.excerpt} onChange={e => setForm({ ...form, excerpt: e.target.value })} />
                </div>
                <div>
                  <label className="f-label"><span>{t('adm.art.f.keywords')}</span></label>
                  <input className="f-input" value={form.keywords} onChange={e => setForm({ ...form, keywords: e.target.value })} />
                </div>
                <div>
                  <label className="f-label"><span>{t('adm.art.f.references')}</span></label>
                  <textarea className="f-textarea" rows={6} value={form.references} onChange={e => setForm({ ...form, references: e.target.value })} />
                </div>
              </div>
            </div>
          </div>

          <aside className="art-side">
            <div className="iss-card">
              <div className="iss-lbl">{t('adm.art.file')}</div>
              {article.file_name
                ? <div className="iss-file"><span className="ico">{(article.file_name.split('.').pop() || 'PDF').toUpperCase()}</span><div style={{ minWidth: 0 }}><b title={article.file_name}>{article.file_name}</b></div></div>
                : <div className="meta" style={{ fontSize: 13, color: 'var(--ink-3)', marginBottom: 12 }}>{t('adm.art.no_file')}</div>}
              {file && <div className="meta" style={{ fontSize: 12.5, color: 'var(--accent)', margin: '0 0 12px' }}>{t('adm.art.new_file', { name: file.name })}</div>}
              <button className="ab block" onClick={() => fileRef.current?.click()}>{t('adm.art.replace_file')}</button>
              <input ref={fileRef} type="file" accept=".pdf,.docx" hidden onChange={e => setFile(e.target.files?.[0] ?? null)} />
            </div>
            {err && <div className="f-err">{err}</div>}
            <Link to={backTo} className="ab text block" onClick={e => { if (dirty && !confirm(t('adm.art.leave_confirm'))) e.preventDefault(); }}>
              {t('adm.art.back')}
            </Link>
          </aside>
        </div>
      )}

      {toast && <div className="adm-toast">{toast}</div>}
    </AdminShell>
  );
}
