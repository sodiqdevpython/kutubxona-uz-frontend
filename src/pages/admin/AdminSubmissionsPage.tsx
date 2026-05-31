import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Topbar from '../../components/layout/Topbar';
import PageLoadBar from '../../components/ui/PageLoadBar';
import Footer from '../../components/layout/Footer';
import AuthorAvatar from '../../components/ui/AuthorAvatar';
import Pagination from '../../components/ui/Pagination';
import { CheckIcon, DocIcon, SearchIcon } from '../../components/ui/Icons';
import {
  adminApi,
  type AdminSubmission, type AdminIssue, type AdminCategory, type SubmissionEdit,
} from '../../lib/admin-api';

const PAGE_SIZE = 8;

// ── Status badge ──────────────────────────────────────────────────────────────

function StatusTag({ status }: { status: string }) {
  if (status === 'approved') return <span className="tag ok" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><CheckIcon size={10} /> Tasdiqlangan</span>;
  if (status === 'rejected') return <span className="tag" style={{ background: 'rgba(220,38,38,0.08)', color: '#DC2626', border: '1px solid rgba(220,38,38,0.2)' }}>Rad etilgan</span>;
  return <span className="tag line">Kutilmoqda</span>;
}

function relDate(iso: string | null): string {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('uz-UZ', { day: 'numeric', month: 'long', year: 'numeric' });
}

function initialsOf(name: string): string {
  return (name || 'N').split(' ').map(p => p[0]).join('').slice(0, 2).toUpperCase();
}

// ── To'liq ko'rish modali ─────────────────────────────────────────────────────

function PreviewModal({ sub, onClose }: { sub: AdminSubmission; onClose: () => void }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(10,25,47,0.55)', zIndex: 200, display: 'grid', placeItems: 'center', padding: 20 }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background: 'var(--paper)', border: '1px solid var(--line)', borderRadius: 14, maxWidth: 640, width: '100%', maxHeight: '92vh', overflowY: 'auto', boxShadow: '0 28px 64px -24px rgba(10,25,47,0.4)' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, padding: '26px 30px 18px', borderBottom: '1px solid var(--line)' }}>
          <div style={{ minWidth: 0 }}>
            <div style={{ marginBottom: 8 }}><StatusTag status={sub.status} /></div>
            <h2 className="h-display" style={{ fontSize: 24, lineHeight: 1.2 }}>{sub.title || 'Sarlavsiz'}</h2>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 0, cursor: 'pointer', fontSize: 24, color: 'var(--ink-3)', lineHeight: 1, flexShrink: 0 }}>✕</button>
        </div>

        <div style={{ padding: '22px 30px 30px', display: 'flex', flexDirection: 'column', gap: 22 }}>
          {/* Muallif */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <AuthorAvatar name={initialsOf(sub.author_name)} idx={0} size={40} />
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink)' }}>{sub.author_name}</div>
              <div style={{ fontSize: 12, color: 'var(--ink-3)' }}>
                {sub.tg_username ? `@${sub.tg_username} · ` : ''}{relDate(sub.submitted_at || sub.created_at)}
              </div>
            </div>
          </div>

          {/* Rasm */}
          {sub.image_url && (
            <div>
              <div className="eyebrow" style={{ marginBottom: 8 }}>Rasm</div>
              <img src={sub.image_url} alt="" style={{ width: '100%', maxHeight: 280, objectFit: 'cover', borderRadius: 10, border: '1px solid var(--line)' }} />
            </div>
          )}

          {/* AI ajratgan mualliflar */}
          {sub.authors_list.length > 0 && (
            <div>
              <div className="eyebrow" style={{ marginBottom: 8 }}>Mualliflar (AI)</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {sub.authors_list.map((a, i) => (
                  <span key={i} className="tag navy-soft" style={{ height: 26 }}>{a}</span>
                ))}
              </div>
            </div>
          )}

          {/* Kalit so'zlar */}
          {sub.keywords_list.length > 0 && (
            <div>
              <div className="eyebrow" style={{ marginBottom: 8 }}>Kalit so'zlar</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {sub.keywords_list.map((k, i) => (
                  <span key={i} className="tag line" style={{ height: 26 }}>{k}</span>
                ))}
              </div>
            </div>
          )}

          {/* Annotatsiya */}
          {sub.abstract && (
            <div>
              <div className="eyebrow" style={{ marginBottom: 8 }}>Annotatsiya</div>
              <p style={{ fontSize: 14, lineHeight: 1.7, color: 'var(--ink-2)', margin: 0, whiteSpace: 'pre-wrap' }}>{sub.abstract}</p>
            </div>
          )}

          {/* Adabiyotlar */}
          {sub.references && (
            <div>
              <div className="eyebrow" style={{ marginBottom: 8 }}>Adabiyotlar</div>
              <p style={{ fontSize: 13, lineHeight: 1.7, color: 'var(--ink-3)', margin: 0, whiteSpace: 'pre-wrap' }}>{sub.references}</p>
            </div>
          )}

          {/* Rad sababi */}
          {sub.reject_reason && (
            <div style={{ padding: '12px 16px', background: 'rgba(220,38,38,0.06)', border: '1px solid rgba(220,38,38,0.2)', borderRadius: 8 }}>
              <div style={{ fontSize: 11.5, fontWeight: 700, color: '#DC2626', textTransform: 'uppercase', letterSpacing: 0.2, marginBottom: 4 }}>Rad / qaytarish sababi</div>
              <p style={{ fontSize: 13.5, color: 'var(--ink-2)', margin: 0 }}>{sub.reject_reason}</p>
            </div>
          )}

          {/* Fayl */}
          {sub.source_file_url && (
            <a href={sub.source_file_url} target="_blank" rel="noreferrer" className="btn ghost"
              style={{ height: 42, justifyContent: 'center', gap: 8, textDecoration: 'none' }}>
              <DocIcon size={14} /> Faylni yangi tabda ochish
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Sabab so'rovchi modal (reject / revert) ───────────────────────────────────

function ReasonModal({ title, hint, confirmLabel, danger, onConfirm, onClose }: {
  title: string; hint: string; confirmLabel: string; danger?: boolean;
  onConfirm: (reason: string) => void; onClose: () => void;
}) {
  const [reason, setReason] = useState('');
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(10,25,47,0.55)', zIndex: 210, display: 'grid', placeItems: 'center', padding: 20 }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background: 'var(--paper)', border: '1px solid var(--line)', borderRadius: 14, padding: '30px 34px', maxWidth: 440, width: '100%' }}>
        <h3 className="h-display" style={{ fontSize: 21, marginBottom: 8 }}>{title}</h3>
        <p style={{ fontSize: 13, color: 'var(--ink-3)', marginBottom: 16 }}>{hint}</p>
        <textarea value={reason} onChange={e => setReason(e.target.value)} rows={3} autoFocus
          placeholder="Sabab (foydalanuvchiga Telegram orqali boradi)…"
          style={{ width: '100%', border: '1px solid var(--line-2)', borderRadius: 8, padding: '10px 12px', fontSize: 14, fontFamily: 'var(--sans)', background: 'var(--grey-2)', outline: 'none', resize: 'vertical', boxSizing: 'border-box' }} />
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 18 }}>
          <button onClick={onClose} className="btn ghost" style={{ height: 38 }}>Bekor qilish</button>
          <button onClick={() => onConfirm(reason)}
            style={{ height: 38, padding: '0 20px', borderRadius: 6, border: 0, background: danger ? '#DC2626' : 'var(--navy)', color: 'white', cursor: 'pointer', fontSize: 13, fontWeight: 600, fontFamily: 'var(--sans)' }}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Tahrirlash modali — AI ajratgan ma'lumotlarni qo'lda tuzatish ─────────────

function EditModal({ sub, onSaved, onClose }: {
  sub: AdminSubmission; onSaved: (u: AdminSubmission) => void; onClose: () => void;
}) {
  const [form, setForm] = useState<SubmissionEdit>({
    title:             sub.title,
    extracted_authors: sub.extracted_authors,
    keywords:          sub.keywords,
    abstract:          sub.abstract,
    references:        sub.references,
  });
  const [saving, setSaving] = useState(false);
  const [err, setErr]       = useState('');

  const inp = (k: keyof SubmissionEdit) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm(p => ({ ...p, [k]: e.target.value }));

  const lbl: React.CSSProperties = { display: 'block', fontSize: 11.5, fontWeight: 600, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: 0.18, marginBottom: 5 };
  const fld: React.CSSProperties = { width: '100%', border: '1px solid var(--line-2)', borderRadius: 8, padding: '10px 12px', fontSize: 14, fontFamily: 'var(--sans)', background: 'var(--grey-2)', color: 'var(--ink)', outline: 'none', resize: 'vertical', boxSizing: 'border-box' };

  async function save() {
    setSaving(true); setErr('');
    try { onSaved(await adminApi.submissions.update(sub.id, form)); }
    catch (e) { setErr((e as Error).message); }
    finally { setSaving(false); }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(10,25,47,0.55)', zIndex: 210, display: 'grid', placeItems: 'center', padding: 20 }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background: 'var(--paper)', border: '1px solid var(--line)', borderRadius: 14, padding: '30px 34px', maxWidth: 560, width: '100%', maxHeight: '92vh', overflowY: 'auto', boxShadow: '0 28px 64px -24px rgba(10,25,47,0.4)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
          <h3 className="h-display" style={{ fontSize: 22, margin: 0 }}>Ma'lumotlarni tahrirlash</h3>
          <button onClick={onClose} style={{ background: 'none', border: 0, cursor: 'pointer', fontSize: 22, color: 'var(--ink-3)' }}>✕</button>
        </div>
        <p style={{ fontSize: 12.5, color: 'var(--ink-3)', marginBottom: 20 }}>
          AI ajratgan natijani tekshiring va kerak bo'lsa tuzating.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={lbl}>Sarlavha</label>
            <input value={form.title} onChange={inp('title')} style={{ ...fld, height: 40 }} />
          </div>
          <div>
            <label style={lbl}>Mualliflar (vergul bilan)</label>
            <input value={form.extracted_authors} onChange={inp('extracted_authors')}
              placeholder="Ism Familiya, Ism Familiya" style={{ ...fld, height: 40 }} />
          </div>
          <div>
            <label style={lbl}>Kalit so'zlar (vergul bilan)</label>
            <input value={form.keywords} onChange={inp('keywords')} style={{ ...fld, height: 40 }} />
          </div>
          <div>
            <label style={lbl}>Annotatsiya</label>
            <textarea value={form.abstract} onChange={inp('abstract')} rows={4} style={fld} />
          </div>
          <div>
            <label style={lbl}>Adabiyotlar</label>
            <textarea value={form.references} onChange={inp('references')} rows={4} style={fld} />
          </div>
        </div>

        {err && <div style={{ marginTop: 14, padding: '10px 14px', background: '#FEF2F2', border: '1px solid #FCA5A5', borderRadius: 8, fontSize: 13, color: '#DC2626' }}>{err}</div>}

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 24 }}>
          <button onClick={onClose} className="btn ghost" style={{ height: 38 }}>Bekor qilish</button>
          <button onClick={save} disabled={saving} className="btn primary" style={{ height: 38 }}>
            {saving ? 'Saqlanmoqda…' : 'Saqlash'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Tasdiqlash modali — category tanlash ──────────────────────────────────────

function ApproveModal({ sub, categories, onConfirm, onAddCategory, onClose }: {
  sub: AdminSubmission;
  categories: AdminCategory[];
  onConfirm: (catId?: string, catName?: string) => void;
  onAddCategory: (name: string) => Promise<AdminCategory>;
  onClose: () => void;
}) {
  const [catId, setCatId]       = useState<string>('');
  const [adding, setAdding]     = useState(false);
  const [newName, setNewName]   = useState('');
  const [cats, setCats]         = useState(categories);
  const [busy, setBusy]         = useState(false);

  async function addCat() {
    const name = newName.trim();
    if (!name) return;
    setBusy(true);
    try {
      const created = await onAddCategory(name);
      setCats(p => [...p, created].sort((a, b) => a.name.localeCompare(b.name)));
      setCatId(created.id);
      setAdding(false);
      setNewName('');
    } finally { setBusy(false); }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(10,25,47,0.55)', zIndex: 210, display: 'grid', placeItems: 'center', padding: 20 }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background: 'var(--paper)', border: '1px solid var(--line)', borderRadius: 14, padding: '30px 34px', maxWidth: 460, width: '100%' }}>
        <h3 className="h-display" style={{ fontSize: 22, marginBottom: 6 }}>Maqolani tasdiqlash</h3>
        <p style={{ fontSize: 13, color: 'var(--ink-3)', marginBottom: 20 }}>
          <b>{sub.title}</b> — yo'nalishini belgilang.
        </p>

        <div className="eyebrow" style={{ marginBottom: 8 }}>Yo'nalish (category)</div>

        {!adding ? (
          <>
            <select value={catId} onChange={e => setCatId(e.target.value)}
              style={{ width: '100%', height: 44, border: '1px solid var(--line-2)', borderRadius: 8, padding: '0 12px', fontSize: 14, fontFamily: 'var(--sans)', background: 'var(--grey-2)', color: 'var(--ink)', outline: 'none', boxSizing: 'border-box' }}>
              <option value="">— Yo'nalishsiz —</option>
              {cats.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <button onClick={() => setAdding(true)}
              style={{ marginTop: 10, background: 'none', border: 0, padding: 0, fontSize: 12.5, color: 'var(--navy)', fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--sans)' }}>
              + Yangi yo'nalish qo'shish
            </button>
          </>
        ) : (
          <div style={{ display: 'flex', gap: 8 }}>
            <input value={newName} onChange={e => setNewName(e.target.value)} autoFocus
              placeholder="Yangi yo'nalish nomi"
              onKeyDown={e => e.key === 'Enter' && addCat()}
              style={{ flex: 1, height: 44, border: '1px solid var(--line-2)', borderRadius: 8, padding: '0 12px', fontSize: 14, fontFamily: 'var(--sans)', background: 'var(--grey-2)', outline: 'none', boxSizing: 'border-box' }} />
            <button onClick={addCat} disabled={busy} className="btn primary" style={{ height: 44, flexShrink: 0 }}>
              {busy ? '…' : 'Qo\'shish'}
            </button>
            <button onClick={() => { setAdding(false); setNewName(''); }} className="btn ghost" style={{ height: 44, flexShrink: 0 }}>✕</button>
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 28 }}>
          <button onClick={onClose} className="btn ghost" style={{ height: 38 }}>Bekor qilish</button>
          <button onClick={() => onConfirm(catId || undefined)} className="btn primary" style={{ height: 38 }}>
            ✓ Tasdiqlash
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Jurnalga qo'shish dropdown ────────────────────────────────────────────────

function AssignJournalSelect({ issues, onAssign }: {
  issues: AdminIssue[]; onAssign: (issueId: string) => void;
}) {
  const [val, setVal] = useState('');
  const available = issues.filter(i => !i.is_upcoming);
  return (
    <select value={val}
      onChange={e => { if (e.target.value) { onAssign(e.target.value); setVal(''); } }}
      style={{ height: 32, border: '1px solid var(--line-2)', borderRadius: 6, padding: '0 8px', fontSize: 12, fontFamily: 'var(--sans)', background: 'var(--paper)', color: 'var(--ink-2)', cursor: 'pointer', maxWidth: 200 }}>
      <option value="">＋ Jurnalga qo'shish…</option>
      {available.map(i => (
        <option key={i.id} value={i.id}>Vol.{i.volume} №{i.number} ({i.year})</option>
      ))}
    </select>
  );
}

// ── Submission kartochkasi ────────────────────────────────────────────────────

function SubmissionCard({ sub, issues, aiBusy, onPreview, onAiExtract, onEdit, onApprove, onReject, onRevert, onAssign, onUnassign, onDelete }: {
  sub: AdminSubmission;
  issues: AdminIssue[];
  aiBusy: boolean;
  onPreview: () => void;
  onAiExtract: () => void;
  onEdit: () => void;
  onApprove: () => void;
  onReject: () => void;
  onRevert: () => void;
  onAssign: (issueId: string) => void;
  onUnassign: () => void;
  onDelete: () => void;
}) {
  return (
    <article style={{ background: 'var(--paper)', border: '1px solid var(--line)', borderRadius: 12, padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* Top row */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
        {sub.image_url ? (
          <img src={sub.image_url} alt="" onClick={onPreview}
            style={{ width: 64, height: 64, borderRadius: 8, objectFit: 'cover', border: '1px solid var(--line)', flexShrink: 0, cursor: 'pointer' }} />
        ) : (
          <div style={{ width: 64, height: 64, borderRadius: 8, background: 'var(--grey-2)', border: '1px solid var(--line)', flexShrink: 0, display: 'grid', placeItems: 'center', color: 'var(--ink-4)' }}>
            <DocIcon size={20} />
          </div>
        )}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, flexWrap: 'wrap' }}>
            <StatusTag status={sub.status} />
            {sub.ai_filled && (
              <span className="tag" style={{ background: 'rgba(43,70,112,0.1)', color: 'var(--navy)', border: '1px solid rgba(43,70,112,0.2)' }}>✨ AI</span>
            )}
            <span style={{ fontSize: 11.5, color: 'var(--ink-4)', fontFamily: 'var(--mono)' }}>{relDate(sub.submitted_at || sub.created_at)}</span>
          </div>
          <h4 className="h-display" style={{ fontSize: 17, lineHeight: 1.25, cursor: 'pointer' }} onClick={onPreview}>
            {sub.title || (sub.ai_filled ? 'Sarlavsiz' : '')}
          </h4>
        </div>
      </div>

      {/* Mualliflar (AI bo'lsa o'sha, bo'lmasa Telegram egasi) */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5, flexWrap: 'wrap' }}>
        <AuthorAvatar name={initialsOf(sub.authors_list[0] || sub.author_name)} idx={0} size={20} />
        <span style={{ color: 'var(--ink-2)', fontWeight: 500 }}>
          {sub.authors_list.length > 0 ? sub.authors_list.join(', ') : sub.author_name}
        </span>
        {sub.tg_username && <span style={{ color: 'var(--ink-4)', fontSize: 11.5 }}>· @{sub.tg_username}</span>}
      </div>

      {/* Kalit so'zlar */}
      {sub.keywords_list.length > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          {sub.keywords_list.slice(0, 4).map((k, i) => (
            <span key={i} style={{ fontSize: 11, color: 'var(--ink-3)', background: 'var(--grey-2)', padding: '2px 8px', borderRadius: 10 }}>{k}</span>
          ))}
          {sub.keywords_list.length > 4 && <span style={{ fontSize: 11, color: 'var(--ink-4)' }}>+{sub.keywords_list.length - 4}</span>}
        </div>
      )}

      {/* Abstract preview */}
      {sub.abstract && (
        <p style={{ fontSize: 13, lineHeight: 1.55, color: 'var(--ink-3)', margin: 0, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
          {sub.abstract}
        </p>
      )}

      {/* Approved: category + journal status */}
      {sub.status === 'approved' && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', padding: '10px 12px', background: 'var(--grey-1)', borderRadius: 8 }}>
          {sub.article_category && (
            <span className="tag navy-soft">{sub.article_category.name}</span>
          )}
          {sub.article_issue ? (
            <span style={{ fontSize: 12.5, color: '#065F46', display: 'inline-flex', alignItems: 'center', gap: 5 }}>
              <CheckIcon size={12} /> Vol.{sub.article_issue.volume} №{sub.article_issue.number} — saytda
              <button onClick={onUnassign} title="Jurnaldan olib tashlash"
                style={{ background: 'none', border: 0, cursor: 'pointer', color: 'var(--ink-4)', fontSize: 14, marginLeft: 4 }}>✕</button>
            </span>
          ) : (
            <AssignJournalSelect issues={issues} onAssign={onAssign} />
          )}
        </div>
      )}

      {/* Reject reason */}
      {sub.status === 'rejected' && sub.reject_reason && (
        <div style={{ fontSize: 12.5, color: 'var(--ink-3)', padding: '8px 12px', background: 'rgba(220,38,38,0.05)', borderRadius: 6 }}>
          <b style={{ color: '#DC2626' }}>Sabab:</b> {sub.reject_reason}
        </div>
      )}

      {/* Actions */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, paddingTop: 12, borderTop: '1px solid var(--line)' }}>
        {sub.status === 'pending' && !sub.ai_filled && (
          /* AI hali ishlamagan — birinchi AI bilan to'ldirish kerak */
          <button onClick={onAiExtract} disabled={aiBusy}
            style={{ height: 38, borderRadius: 8, border: 0, background: aiBusy ? 'var(--navy-30)' : 'linear-gradient(135deg,#2B4670,#0A192F)', color: 'white', cursor: aiBusy ? 'default' : 'pointer', fontSize: 13, fontWeight: 600, fontFamily: 'var(--sans)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            {aiBusy ? '✨ Tahlil qilinmoqda…' : '✨ AI bilan to\'ldirish'}
          </button>
        )}

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button onClick={onPreview} className="btn ghost" style={{ height: 34, fontSize: 12.5, flex: '1 1 auto', justifyContent: 'center' }}>
            👁 Ko'rish
          </button>

          {/* Tahrirlash — pending (AI to'ldirgan), approved va rejected'da ham */}
          {(sub.status !== 'pending' || sub.ai_filled) && (
            <button onClick={onEdit} className="btn ghost" style={{ height: 34, fontSize: 12.5, flex: '1 1 auto', justifyContent: 'center' }}>
              ✏️ Tahrirlash
            </button>
          )}

          {sub.status === 'pending' && (
            <>
              <button onClick={onApprove} disabled={!sub.ai_filled}
                className="btn primary"
                title={sub.ai_filled ? '' : 'Avval AI bilan to\'ldiring'}
                style={{ height: 34, fontSize: 12.5, flex: '1 1 auto', justifyContent: 'center', opacity: sub.ai_filled ? 1 : 0.45, cursor: sub.ai_filled ? 'pointer' : 'not-allowed' }}>
                ✓ Tasdiqlash
              </button>
              <button onClick={onReject}
                style={{ height: 34, padding: '0 14px', borderRadius: 6, border: '1px solid rgba(220,38,38,0.25)', background: 'rgba(220,38,38,0.06)', color: '#DC2626', cursor: 'pointer', fontSize: 12.5, fontWeight: 600, fontFamily: 'var(--sans)', flex: '1 1 auto' }}>
                ✕ Rad etish
              </button>
            </>
          )}

          {sub.status === 'approved' && (
            <button onClick={onRevert}
              style={{ height: 34, padding: '0 14px', borderRadius: 6, border: '1px solid rgba(220,38,38,0.25)', background: 'rgba(220,38,38,0.06)', color: '#DC2626', cursor: 'pointer', fontSize: 12.5, fontWeight: 600, fontFamily: 'var(--sans)', flex: '1 1 auto' }}>
              ⤺ Qaytarish
            </button>
          )}

          {/* O'chirish — hamma statuslarda */}
          <button onClick={onDelete}
            title="Submissionni butunlay o'chirish"
            style={{ height: 34, padding: '0 12px', borderRadius: 6, border: '1px solid var(--line-2)', background: 'var(--paper)', color: 'var(--ink-3)', cursor: 'pointer', fontSize: 12.5, fontWeight: 600, fontFamily: 'var(--sans)' }}>
            🗑
          </button>
        </div>
      </div>
    </article>
  );
}

// ── Main sahifa ───────────────────────────────────────────────────────────────

export default function AdminSubmissionsPage() {
  const navigate = useNavigate();

  const [subs,    setSubs]    = useState<AdminSubmission[]>([]);
  const [count,   setCount]   = useState(0);
  const [issues,  setIssues]  = useState<AdminIssue[]>([]);
  const [cats,    setCats]    = useState<AdminCategory[]>([]);
  const [loading, setLoading] = useState(true);

  const [tab,     setTab]     = useState<'pending' | 'approved' | 'rejected' | 'all'>('pending');
  const [search,  setSearch]  = useState('');
  const [debQ,    setDebQ]    = useState('');
  const [page,    setPage]    = useState(1);

  const [preview, setPreview] = useState<AdminSubmission | null>(null);
  const [edit,    setEdit]    = useState<AdminSubmission | null>(null);
  const [approve, setApprove] = useState<AdminSubmission | null>(null);
  const [reject,  setReject]  = useState<AdminSubmission | null>(null);
  const [revert,  setRevert]  = useState<AdminSubmission | null>(null);
  const [aiBusyId, setAiBusyId] = useState<string | null>(null);
  const [toast,   setToast]   = useState('');
  const [counts,  setCounts]  = useState<Record<string, number>>({});

  function flash(t: string) { setToast(t); setTimeout(() => setToast(''), 4000); }

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => { setDebQ(search); setPage(1); }, 350);
    return () => clearTimeout(t);
  }, [search]);

  const loadSubs = useCallback(async () => {
    setLoading(true);
    try {
      const data = await adminApi.submissions.list({
        status: tab === 'all' ? undefined : tab,
        search: debQ || undefined,
        page, page_size: PAGE_SIZE,
      });
      setSubs(data.results);
      setCount(data.count);
    } catch { /* ignore */ }
    setLoading(false);
  }, [tab, debQ, page]);

  // Tab counts (alohida yengil so'rovlar)
  const loadCounts = useCallback(async () => {
    const statuses = ['pending', 'approved', 'rejected'] as const;
    const out: Record<string, number> = {};
    await Promise.all(statuses.map(async s => {
      try { const d = await adminApi.submissions.list({ status: s, page_size: 1 }); out[s] = d.count; }
      catch { out[s] = 0; }
    }));
    setCounts(out);
  }, []);

  useEffect(() => { loadSubs(); }, [loadSubs]);
  useEffect(() => {
    loadCounts();
    adminApi.issues.list().then(setIssues).catch(() => {});
    adminApi.categories.list().then(setCats).catch(() => {});
  }, [loadCounts]);

  // ── Actions ──────────────────────────────────────────────────────────────────

  async function doAiExtract(sub: AdminSubmission) {
    setAiBusyId(sub.id);
    try {
      const updated = await adminApi.submissions.aiExtract(sub.id);
      setSubs(p => p.map(s => s.id === sub.id ? updated : s));
      flash('✨ AI to\'ldirdi. Tekshirib, kerak bo\'lsa tahrirlang.');
    } catch (e) { flash(`AI xatosi: ${(e as Error).message}`); }
    finally { setAiBusyId(null); }
  }

  function applyUpdate(updated: AdminSubmission) {
    setSubs(p => p.map(s => s.id === updated.id ? updated : s));
  }

  async function doApprove(sub: AdminSubmission, catId?: string) {
    try {
      await adminApi.submissions.approve(sub.id, catId ? { category_id: catId } : undefined);
      setApprove(null);
      flash('✓ Tasdiqlandi. Endi jurnal soniga qo\'shing.');
      await Promise.all([loadSubs(), loadCounts()]);
      adminApi.issues.list().then(setIssues).catch(() => {});
    } catch (e) { flash(`Xatolik: ${(e as Error).message}`); }
  }

  async function doReject(sub: AdminSubmission, reason: string) {
    try {
      await adminApi.submissions.reject(sub.id, reason);
      setReject(null);
      flash('Rad etildi.');
      await Promise.all([loadSubs(), loadCounts()]);
    } catch (e) { flash(`Xatolik: ${(e as Error).message}`); }
  }

  async function doDelete(sub: AdminSubmission) {
    if (!confirm(`"${sub.title || 'Sarlavsiz'}" submissionni butunlay o'chirasizmi? Bog'liq maqola ham o'chiriladi.`)) return;
    try {
      await adminApi.submissions.remove(sub.id);
      flash('🗑 O\'chirildi.');
      await Promise.all([loadSubs(), loadCounts()]);
      adminApi.issues.list().then(setIssues).catch(() => {});
    } catch (e) { flash(`Xatolik: ${(e as Error).message}`); }
  }

  async function doRevert(sub: AdminSubmission, reason: string) {
    try {
      await adminApi.submissions.revert(sub.id, reason);
      setRevert(null);
      flash('Tasdiqdan qaytarildi, maqola o\'chirildi.');
      await Promise.all([loadSubs(), loadCounts()]);
      adminApi.issues.list().then(setIssues).catch(() => {});
    } catch (e) { flash(`Xatolik: ${(e as Error).message}`); }
  }

  async function doAssign(sub: AdminSubmission, issueId: string) {
    if (!sub.article_id) return;
    try {
      await adminApi.issues.assign(issueId, sub.article_id);
      flash('✓ Jurnalga qo\'shildi — saytda ko\'rinadi!');
      await loadSubs();
      adminApi.issues.list().then(setIssues).catch(() => {});
    } catch (e) { flash(`Xatolik: ${(e as Error).message}`); }
  }

  async function doUnassign(sub: AdminSubmission) {
    if (!sub.article_id || !sub.article_issue) return;
    try {
      await adminApi.issues.removeArticle(sub.article_issue.id, sub.article_id);
      flash('Jurnaldan olib tashlandi.');
      await loadSubs();
      adminApi.issues.list().then(setIssues).catch(() => {});
    } catch (e) { flash(`Xatolik: ${(e as Error).message}`); }
  }

  const TABS: [typeof tab, string, number | undefined][] = [
    ['pending',  'Kutilmoqda',   counts.pending],
    ['approved', 'Tasdiqlangan', counts.approved],
    ['rejected', 'Rad etilgan',  counts.rejected],
    ['all',      'Barchasi',     undefined],
  ];

  return (
    <div className="bg-articles" style={{ minHeight: '100vh' }}>
      <PageLoadBar />
      <Topbar active="submissions" />

      {/* Header */}
      <div style={{ padding: '40px var(--px) 24px', maxWidth: 1100, margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14, fontSize: 12.5, color: 'var(--ink-3)' }}>
          <a onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>Bosh sahifa</a>
          <span style={{ color: 'var(--ink-4)' }}>/</span>
          <span style={{ color: 'var(--ink-2)', fontWeight: 500 }}>Topshirishlar</span>
        </div>
        <h1 className="h-display h1-rsp" style={{ fontSize: 44, marginBottom: 8 }}>Topshirishlar</h1>
        <p style={{ fontSize: 14, color: 'var(--ink-3)' }}>
          Botdan kelgan maqolalar. Ko'rib chiqing, tasdiqlang va jurnal soniga qo'shing.
        </p>
        {toast && (
          <div style={{ marginTop: 16, padding: '10px 16px', background: 'rgba(6,95,70,0.08)', border: '1px solid rgba(6,95,70,0.25)', borderRadius: 8, fontSize: 13, color: '#065F46' }}>
            {toast}
          </div>
        )}
      </div>

      {/* Controls */}
      <div style={{ padding: '0 var(--px)', maxWidth: 1100, margin: '0 auto' }}>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center', marginBottom: 20 }}>
          {/* Tabs */}
          <div style={{ display: 'flex', gap: 2, background: 'var(--grey-2)', borderRadius: 8, padding: 3, border: '1px solid var(--line)' }}>
            {TABS.map(([key, lbl, cnt]) => (
              <button key={key} onClick={() => { setTab(key); setPage(1); }} style={{
                height: 34, padding: '0 14px', borderRadius: 6, border: 0,
                background: tab === key ? 'var(--paper)' : 'transparent',
                fontSize: 12.5, fontWeight: tab === key ? 600 : 400,
                cursor: 'pointer', color: tab === key ? 'var(--ink)' : 'var(--ink-3)',
                fontFamily: 'var(--sans)', whiteSpace: 'nowrap',
                boxShadow: tab === key ? '0 1px 3px rgba(10,25,47,0.08)' : 'none',
              }}>
                {lbl}{cnt !== undefined && <span style={{ marginLeft: 5, fontSize: 11, color: 'var(--ink-4)', fontFamily: 'var(--mono)' }}>({cnt})</span>}
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="searchbar" style={{ height: 40, flex: '1 1 240px', minWidth: 200 }}>
            <SearchIcon size={15} style={{ color: 'var(--ink-4)', flexShrink: 0 }} />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Sarlavha, muallif yoki kalit so'z…" style={{ fontSize: 13.5 }} />
            {search && <button onClick={() => setSearch('')} style={{ background: 'none', border: 0, cursor: 'pointer', color: 'var(--ink-3)', fontSize: 16, lineHeight: 1 }}>×</button>}
          </div>
        </div>
      </div>

      {/* List */}
      <div style={{ padding: '0 var(--px) 64px', maxWidth: 1100, margin: '0 auto' }}>
        {loading ? (
          <div style={{ padding: '64px 0', textAlign: 'center', color: 'var(--ink-3)', fontSize: 13 }}>Yuklanmoqda…</div>
        ) : subs.length === 0 ? (
          <div style={{ padding: '64px 0', textAlign: 'center', color: 'var(--ink-3)', fontSize: 14 }}>
            {debQ ? 'Qidiruv bo\'yicha natija topilmadi.' : 'Bu bo\'limda hozircha hech narsa yo\'q.'}
          </div>
        ) : (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(440px, 1fr))', gap: 16 }}>
              {subs.map(s => (
                <SubmissionCard
                  key={s.id} sub={s} issues={issues}
                  aiBusy={aiBusyId === s.id}
                  onPreview={() => setPreview(s)}
                  onAiExtract={() => doAiExtract(s)}
                  onEdit={() => setEdit(s)}
                  onApprove={() => setApprove(s)}
                  onReject={() => setReject(s)}
                  onRevert={() => setRevert(s)}
                  onAssign={issueId => doAssign(s, issueId)}
                  onUnassign={() => doUnassign(s)}
                  onDelete={() => doDelete(s)}
                />
              ))}
            </div>
            {count > PAGE_SIZE && (
              <Pagination total={count} perPage={PAGE_SIZE} current={page}
                onPageChange={p => { setPage(p); window.scrollTo({ top: 0, behavior: 'smooth' }); }} />
            )}
          </>
        )}
      </div>

      <Footer />

      {/* Modals */}
      {preview && <PreviewModal sub={preview} onClose={() => setPreview(null)} />}
      {edit && (
        <EditModal
          sub={edit}
          onSaved={u => { applyUpdate(u); setEdit(null); flash('✓ Saqlandi.'); }}
          onClose={() => setEdit(null)}
        />
      )}
      {approve && (
        <ApproveModal
          sub={approve} categories={cats}
          onConfirm={catId => doApprove(approve, catId)}
          onAddCategory={async name => {
            const c = await adminApi.categories.create(name);
            setCats(p => [...p, c].sort((a, b) => a.name.localeCompare(b.name)));
            return c;
          }}
          onClose={() => setApprove(null)}
        />
      )}
      {reject && (
        <ReasonModal
          title="Maqolani rad etish" hint="Foydalanuvchi Telegram orqali xabar oladi."
          confirmLabel="Rad etish" danger
          onConfirm={r => doReject(reject, r)} onClose={() => setReject(null)}
        />
      )}
      {revert && (
        <ReasonModal
          title="Tasdiqdan qaytarish"
          hint="Maqola o'chiriladi va jurnaldan chiqariladi. Foydalanuvchiga sabab boradi."
          confirmLabel="Qaytarish" danger
          onConfirm={r => doRevert(revert, r)} onClose={() => setRevert(null)}
        />
      )}
    </div>
  );
}
