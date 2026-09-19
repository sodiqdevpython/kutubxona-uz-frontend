import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import AdminShell from '../../components/admin/AdminShell';
import Pagination from '../../components/ui/Pagination';
import AiUnavailableModal from '../../components/ui/AiUnavailableModal';
import { ApproveModal, ManualAddModal, RejectModal, RevertModal } from '../../components/admin/SubmissionModals';
import { getAiStatus, isAiUnavailableError, resetAiStatus } from '../../lib/ai';
import { adminApi, type AdminCategory, type AdminIssue, type AdminSubmission } from '../../lib/admin-api';
import { fmtBytes, fullTime, refreshDashboard } from '../../lib/admin-dashboard';
import { READINESS_LABEL, abstractLangs, initialsOf, readiness, readinessNote, refsCount } from '../../lib/submission-meta';

/**
 * Kelgan maqolalar — Figma «Admin / Kelgan maqolalar»:
 * filtr chiplari + qidiruv, har bir qo'lyozma uchun karta (rasm, holat,
 * sarlavha, muallif, metama'lumot chiplari, izoh, o'ngda amallar).
 */

const PAGE_SIZE = 8;
type Tab = 'pending' | 'approved' | 'rejected' | 'all';
const TABS: { key: Tab; label: string }[] = [
  { key: 'pending', label: 'Kutilmoqda' }, { key: 'approved', label: 'Tasdiqlangan' },
  { key: 'rejected', label: 'Rad etilgan' }, { key: 'all', label: 'Barchasi' },
];

// ── Karta ─────────────────────────────────────────────────────────────────────

interface CardProps {
  sub: AdminSubmission; issues: AdminIssue[]; aiBusy: boolean; trainBusy: boolean;
  onOpen: (edit?: boolean) => void; onApprove: () => void; onReject: () => void; onRevert: () => void;
  onAi: () => void; onAssign: (issueId: string) => void; onUnassign: () => void;
  onTrain: () => void; onClearAi: () => void; onDelete: () => void;
}

function SubCard({ sub, issues, aiBusy, trainBusy, onOpen, onApprove, onReject, onRevert, onAi, onAssign, onUnassign, onTrain, onClearAi, onDelete }: CardProps) {
  const r  = readiness(sub);
  const st = sub.status;
  const cls = st === 'approved' ? 'approved' : st === 'rejected' ? 'rejected' : r;
  const chip = st === 'approved' ? { cls: 'green', text: 'Tasdiqlangan' }
             : st === 'rejected' ? { cls: 'grey',  text: 'Rad etilgan' }
             : { cls: r === 'ready' ? 'green' : r === 'ai' ? 'blue' : 'red', text: READINESS_LABEL[r] };
  const langs = abstractLangs(sub.abstract);
  const refs  = refsCount(sub.references);
  const kw    = sub.keywords_list.length;
  const category = sub.article_category?.name;
  const authorName = sub.author?.name || sub.author_name;
  const note = st === 'approved'
    ? (sub.article_issue ? `Jurnal: ${sub.article_issue.year} № ${sub.article_issue.number}${sub.article_doi ? ` · DOI ${sub.article_doi}` : ''}` : 'Tasdiqlangan, lekin jurnal soniga hali biriktirilmagan.')
    : st === 'rejected' ? (sub.reject_reason ? `Sabab: ${sub.reject_reason}` : 'Rad etilgan.')
    : readinessNote(sub);

  return (
    <article className={`sub-card ${cls}`}>
      {sub.image_url
        ? <div className="sub-thumb" onClick={() => onOpen()} style={{ cursor: 'pointer' }}><img src={sub.image_url} alt="" /></div>
        : <div className="sub-thumb ph" onClick={() => onOpen()} style={{ cursor: 'pointer' }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><rect x="4" y="4" width="16" height="16" rx="2"/><circle cx="9" cy="9" r="1.6"/><path d="M20 16l-5-5-7 7"/></svg>
            <span>Maqola fayli</span>
          </div>}

      <div style={{ minWidth: 0 }}>
        <div className="sub-head">
          <span className={`chip-m ${chip.cls}`}>{chip.text}</span>
          <span>{fullTime(sub.submitted_at || sub.created_at)}</span>
          {sub.file_name && <><span className="sep">•</span><span className="file">{sub.file_name}{sub.file_size ? ` · ${fmtBytes(sub.file_size)}` : ''}</span></>}
        </div>
        <h3 className={`sub-title${sub.title ? '' : ' missing'}`} onClick={() => onOpen()}>
          {sub.title || 'Sarlavha aniqlanmadi — fayl skan qilingan rasm'}
        </h3>
        <div className="sub-author">
          <span className="ava">{initialsOf(authorName)}</span>
          <b>{authorName || "Noma'lum muallif"}</b>
          {sub.tg_username && <a className="tg" href={`https://t.me/${sub.tg_username}`} target="_blank" rel="noreferrer">@{sub.tg_username}</a>}
        </div>
        <div className="sub-meta">
          <span className={`mchip${category ? '' : ' muted'}`}><span className="k">Yo‘nalish</span><span className="v">{category ?? 'aniqlanmagan'}</span></span>
          <span className={`mchip${kw ? '' : ' muted'}`}><span className="k">Kalit so‘z</span><span className="v">{kw ? `${kw} ta` : 'yo‘q'}</span></span>
          <span className={`mchip ${langs.length ? 'ok' : 'bad'}`}><span className="k">Annotatsiya</span><span className="v">{langs.length ? langs.join(' · ') : 'yo‘q'}</span></span>
          <span className={`mchip${refs ? '' : ' muted'}`}><span className="k">Adabiyot</span><span className="v">{refs ? `${refs} manba` : 'yo‘q'}</span></span>
        </div>
        <div className="sub-note">{note}</div>
      </div>

      <div className="sub-acts">
        {st === 'pending' && r !== 'incomplete' && (
          <button className="ab primary" onClick={onApprove}>Tasdiqlash</button>
        )}
        {st === 'pending' && r === 'incomplete' && (
          <>
            <button className="ab dark" onClick={onAi} disabled={aiBusy || !sub.source_file_url}>
              {aiBusy ? '✦ Tahlil qilinmoqda…' : '✦ AI bilan to‘ldirish'}
            </button>
            <span className="ab soft">Avval to‘ldirish kerak</span>
          </>
        )}
        {st === 'approved' && (
          sub.article_issue
            ? <span className="ab soft" style={{ color: 'var(--adm-green)', background: 'var(--adm-green-08)', borderColor: 'var(--adm-green-08)' }}>Saytda · {sub.article_issue.year} № {sub.article_issue.number}</span>
            : <select className="f-select" style={{ height: 42 }} value="" onChange={e => e.target.value && onAssign(e.target.value)}>
                <option value="">Jurnal soniga qo‘shish…</option>
                {issues.map(i => <option key={i.id} value={i.id}>{i.year} № {i.number}</option>)}
              </select>
        )}
        <div className="pair">
          <button className="ab" onClick={() => onOpen()}>Ko‘rish</button>
          <button className="ab" onClick={() => onOpen(true)}>Tahrir</button>
        </div>
        {st === 'pending' && r !== 'incomplete' && (
          <button className="ab sm text" onClick={onAi} disabled={aiBusy} style={{ color: 'var(--ink-3)' }}>
            {aiBusy ? '✦ Tahlil qilinmoqda…' : sub.ai_filled ? '✦ Qayta AI tahlil' : '✦ AI bilan to‘ldirish'}
          </button>
        )}
        {st === 'pending'  && <button className="ab text red" onClick={onReject}>Rad etish</button>}
        {st === 'approved' && sub.article_id && (
          sub.article_ai_ready
            ? <button className="ab sm" onClick={onClearAi} disabled={trainBusy}>AI chatni o‘chirish</button>
            : <button className="ab sm dark" onClick={onTrain} disabled={trainBusy}>{trainBusy ? '⏳ O‘qitilmoqda…' : '✦ AI ga o‘qitish'}</button>
        )}
        {st === 'approved' && sub.article_issue && <button className="ab sm text" onClick={onUnassign} style={{ color: 'var(--ink-3)' }}>Jurnaldan olib tashlash</button>}
        {st === 'approved' && <button className="ab text red" onClick={onRevert}>Qaytarish</button>}
        {st === 'rejected' && <button className="ab text red" onClick={onDelete}>O‘chirish</button>}
      </div>
    </article>
  );
}

// ── Sahifa ────────────────────────────────────────────────────────────────────

export default function AdminSubmissionsPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();

  const [tab, setTab]       = useState<Tab>('pending');
  const [search, setSearch] = useState(params.get('q') ?? '');
  const [debQ, setDebQ]     = useState(params.get('q') ?? '');
  const [page, setPage]     = useState(1);
  const [subs, setSubs]     = useState<AdminSubmission[]>([]);
  const [count, setCount]   = useState(0);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [issues, setIssues] = useState<AdminIssue[]>([]);
  const [cats, setCats]     = useState<AdminCategory[]>([]);

  const [approve, setApprove] = useState<AdminSubmission | null>(null);
  const [reject, setReject]   = useState<AdminSubmission | null>(null);
  const [revert, setRevert]   = useState<AdminSubmission | null>(null);
  const [manual, setManual]   = useState(false);
  const [aiBusyId, setAiBusyId] = useState<string | null>(null);
  const [trainBusyId, setTrainBusyId] = useState<string | null>(null);
  const [aiOff, setAiOff]   = useState<{ action: string; reason?: string } | null>(null);
  const [toast, setToast]   = useState('');

  function flash(t: string) { setToast(t); setTimeout(() => setToast(''), 4000); }

  // Yuqori paneldagi qidiruv ?q= bilan kelsa — holatni render vaqtida moslaymiz
  const qParam = params.get('q') ?? '';
  const [seenQ, setSeenQ] = useState(qParam);
  if (seenQ !== qParam) { setSeenQ(qParam); setSearch(qParam); setDebQ(qParam); }
  useEffect(() => { const t = setTimeout(() => { setDebQ(search); setPage(1); }, 350); return () => clearTimeout(t); }, [search]);

  // «Yuklanmoqda…» faqat birinchi yuklashda; keyin eski kartalar yangisi kelguncha turadi
  const load = useCallback(() =>
    adminApi.submissions.list({ status: tab === 'all' ? undefined : tab, search: debQ || undefined, page, page_size: PAGE_SIZE })
      .then(d => { setSubs(d.results); setCount(d.count); })
      .catch(() => {}).finally(() => setLoading(false)),
  [tab, debQ, page]);

  const loadCounts = useCallback(() =>
    Promise.all((['pending', 'approved', 'rejected'] as const).map(s =>
      adminApi.submissions.list({ status: s, page_size: 1 }).then(d => d.count).catch(() => 0),
    )).then(([pending, approved, rejected]) => setCounts({ pending, approved, rejected, all: pending + approved + rejected })),
  []);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    loadCounts();
    adminApi.issues.list().then(setIssues).catch(() => {});
    adminApi.categories.list().then(setCats).catch(() => {});
  }, [loadCounts]);

  async function reload() { await Promise.all([load(), loadCounts()]); refreshDashboard(); }
  function patch(u: AdminSubmission) { setSubs(p => p.map(s => (s.id === u.id ? u : s))); }

  async function addCategory(name: string) {
    const c = await adminApi.categories.create(name);
    setCats(p => [...p, c].sort((a, b) => a.name.localeCompare(b.name)));
    return c;
  }

  async function doAi(sub: AdminSubmission) {
    const status = await getAiStatus();
    if (!status.available) { setAiOff({ action: "AI bilan to'ldirish", reason: status.reason }); return; }
    setAiBusyId(sub.id);
    try { patch(await adminApi.submissions.aiExtract(sub.id)); flash('✦ AI to‘ldirdi — tekshirib chiqing.'); }
    catch (e) { if (isAiUnavailableError(e)) { resetAiStatus(); setAiOff({ action: "AI bilan to'ldirish" }); } else flash(`AI xatosi: ${(e as Error).message}`); }
    finally { setAiBusyId(null); }
  }
  async function doAssign(sub: AdminSubmission, issueId: string) {
    if (!sub.article_id) return;
    try { await adminApi.issues.assign(issueId, sub.article_id); flash('✓ Jurnalga qo‘shildi — saytda ko‘rinadi.'); await reload(); }
    catch (e) { flash(`Xatolik: ${(e as Error).message}`); }
  }
  async function doUnassign(sub: AdminSubmission) {
    if (!sub.article_id || !sub.article_issue) return;
    try { await adminApi.issues.removeArticle(sub.article_issue.id, sub.article_id); flash('Jurnaldan olib tashlandi.'); await reload(); }
    catch (e) { flash(`Xatolik: ${(e as Error).message}`); }
  }
  async function doTrain(sub: AdminSubmission) {
    if (!sub.article_id) return;
    const status = await getAiStatus();
    if (!status.available) { setAiOff({ action: "AI ga o'qitish", reason: status.reason }); return; }
    setTrainBusyId(sub.id);
    try { const r = await adminApi.articles.trainAi(sub.article_id); patch({ ...sub, article_ai_ready: r.ai_ready }); flash('✦ AI o‘qitildi — saytda chat ochiq.'); }
    catch (e) { if (isAiUnavailableError(e)) { resetAiStatus(); setAiOff({ action: "AI ga o'qitish" }); } else flash(`Xatolik: ${(e as Error).message}`); }
    finally { setTrainBusyId(null); }
  }
  async function doClearAi(sub: AdminSubmission) {
    if (!sub.article_id || !confirm('AI chatni o‘chirasizmi?')) return;
    setTrainBusyId(sub.id);
    try { const r = await adminApi.articles.clearAi(sub.article_id); patch({ ...sub, article_ai_ready: r.ai_ready }); flash('AI chat o‘chirildi.'); }
    catch (e) { flash(`Xatolik: ${(e as Error).message}`); }
    finally { setTrainBusyId(null); }
  }
  async function doDelete(sub: AdminSubmission) {
    if (!confirm(`«${sub.title || 'Sarlavhasiz'}» butunlay o‘chirilsinmi?`)) return;
    try { await adminApi.submissions.remove(sub.id); flash('O‘chirildi.'); await reload(); }
    catch (e) { flash(`Xatolik: ${(e as Error).message}`); }
  }

  return (
    <AdminShell active="submissions" crumb="Kelgan maqolalar">
      <div className="adm-head">
        <div>
          <h1 className="adm-h1">Kelgan maqolalar</h1>
          <p className="adm-sub">Telegram bot orqali kelgan qo‘lyozmalar. Metama’lumotni tekshiring, so‘ng songa biriktirib tasdiqlang.</p>
        </div>
        <div className="adm-actions">
          <button className="ab lg" onClick={() => setManual(true)}>Qo‘lda qo‘shish</button>
        </div>
      </div>

      <div className="sub-filters">
        {TABS.map(t => (
          <button key={t.key} className={`fchip${tab === t.key ? ' on' : ''}`} onClick={() => { setTab(t.key); setPage(1); }}>
            {t.label}{counts[t.key] !== undefined && <span>{counts[t.key]}</span>}
          </button>
        ))}
        <div className="sub-search">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/></svg>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Sarlavha yoki muallif" />
          {search && <button onClick={() => setSearch('')} style={{ border: 0, background: 'none', cursor: 'pointer', color: 'var(--ink-3)' }}>×</button>}
        </div>
        <span className="sub-count">{loading ? '…' : `${subs.length} ta ko‘rsatilmoqda`}</span>
      </div>

      {loading && subs.length === 0 && <div className="sub-empty">Yuklanmoqda…</div>}
      {!loading && subs.length === 0 && <div className="sub-empty">{debQ ? 'Qidiruv bo‘yicha natija topilmadi.' : 'Bu bo‘limda hozircha hech narsa yo‘q.'}</div>}

      {subs.map(s => (
        <SubCard key={s.id} sub={s} issues={issues.filter(i => !i.is_upcoming || true)}
          aiBusy={aiBusyId === s.id} trainBusy={trainBusyId === s.id}
          onOpen={edit => navigate(`/admin/submissions/${s.id}${edit ? '#tahrir' : ''}`)}
          onApprove={() => setApprove(s)} onReject={() => setReject(s)} onRevert={() => setRevert(s)}
          onAi={() => doAi(s)} onAssign={id => doAssign(s, id)} onUnassign={() => doUnassign(s)}
          onTrain={() => doTrain(s)} onClearAi={() => doClearAi(s)} onDelete={() => doDelete(s)} />
      ))}

      {count > PAGE_SIZE && (
        <Pagination total={count} perPage={PAGE_SIZE} current={page} onPageChange={p => { setPage(p); window.scrollTo({ top: 0, behavior: 'smooth' }); }} />
      )}

      {toast && <div className="adm-toast">{toast}</div>}
      <AiUnavailableModal open={aiOff !== null} action={aiOff?.action} reason={aiOff?.reason} onClose={() => setAiOff(null)} />
      {approve && <ApproveModal sub={approve} categories={cats} issues={issues} onAddCategory={addCategory}
        onDone={() => { setApprove(null); flash('✓ Tasdiqlandi va songa joylandi.'); reload(); }} onClose={() => setApprove(null)} />}
      {reject && <RejectModal sub={reject} onDone={() => { setReject(null); flash('Rad etildi — muallifga xabar yuborildi.'); reload(); }} onClose={() => setReject(null)} />}
      {revert && <RevertModal sub={revert} onDone={() => { setRevert(null); flash('Tasdiqdan qaytarildi.'); reload(); }} onClose={() => setRevert(null)} />}
      {manual && <ManualAddModal categories={cats} issues={issues} onAddCategory={addCategory}
        onDone={c => { setManual(false); flash(`✓ «${c.title}» saqlandi.`); reload(); }} onClose={() => setManual(false)} />}
    </AdminShell>
  );
}
