import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Topbar from '../../components/layout/Topbar';
import PageLoadBar from '../../components/ui/PageLoadBar';
import Footer from '../../components/layout/Footer';
import AuthorAvatar from '../../components/ui/AuthorAvatar';
import { PinIcon, SearchIcon } from '../../components/ui/Icons';
import { adminApi, type AdminAuthor } from '../../lib/admin-api';

// ── O'chirish modali ──────────────────────────────────────────────────────────

function DeleteModal({
  author, onConfirm, onClose,
}: { author: AdminAuthor; onConfirm: (m: 'soft' | 'full') => void; onClose: () => void }) {
  const [mode, setMode] = useState<'soft' | 'full'>('soft');
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(10,25,47,0.55)', zIndex: 200, display: 'grid', placeItems: 'center' }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background: 'var(--paper)', border: '1px solid var(--line)', borderRadius: 14, padding: '32px 36px', maxWidth: 460, width: '100%', boxShadow: '0 28px 64px -24px rgba(10,25,47,0.35)' }}>
        <h3 className="h-display" style={{ fontSize: 22, marginBottom: 8 }}>Muallifni o'chirish</h3>
        <p style={{ fontSize: 13.5, color: 'var(--ink-3)', marginBottom: 24 }}>
          <b>{author.name}</b> — qanday o'chirasiz?
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
          {([
            ['soft', "Faqat profilni o'chirish",
              `Profil o'chiriladi. Uning ${author.article_count} ta maqolasi saqlanib qoladi (muallif nomi ko'rsatilmaydi).`],
            ['full', "Profil va barcha maqolalarini o'chirish",
              `Profil + ${author.article_count} ta maqola barchasi o'chiriladi. Qaytarib bo'lmaydi.`],
          ] as [string, string, string][]).map(([val, label, desc]) => (
            <label key={val} style={{
              display: 'flex', gap: 12, padding: '14px 16px', borderRadius: 10, cursor: 'pointer',
              border: `1px solid ${mode === val ? (val === 'full' ? '#FCA5A5' : 'var(--navy)') : 'var(--line)'}`,
              background: mode === val ? (val === 'full' ? '#FEF2F2' : 'rgba(10,25,47,0.04)') : 'var(--grey-2)',
            }}>
              <input type="radio" value={val} checked={mode === val} onChange={() => setMode(val as 'soft' | 'full')} style={{ marginTop: 3, accentColor: val === 'full' ? '#DC2626' : 'var(--navy)' }} />
              <div>
                <div style={{ fontSize: 13.5, fontWeight: 600, color: val === 'full' ? '#DC2626' : 'var(--ink)' }}>{label}</div>
                <div style={{ fontSize: 12.5, color: 'var(--ink-3)', marginTop: 3 }}>{desc}</div>
              </div>
            </label>
          ))}
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <button onClick={onClose} className="btn ghost" style={{ height: 38 }}>Bekor qilish</button>
          <button onClick={() => onConfirm(mode)}
            style={{ height: 38, padding: '0 20px', borderRadius: 6, border: 0, background: mode === 'full' ? '#DC2626' : 'var(--navy)', color: 'white', cursor: 'pointer', fontSize: 13, fontWeight: 600, fontFamily: 'var(--sans)' }}>
            O'chirish
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Muallif formasi (qo'shish va tahrirlash uchun bitta forma) ────────────────

interface FormState {
  name:   string;
  role:   string;
  org:    string;
  degree: string;
  bio:    string;
}

const EMPTY_FORM: FormState = { name: '', role: '', org: '', degree: '', bio: '' };

function AuthorFormModal({
  title, initial, submitLabel, onSave, onClose,
}: {
  title:       string;
  initial:     FormState;
  submitLabel: string;
  onSave:      (data: FormState) => Promise<void>;
  onClose:     () => void;
}) {
  const [form, setForm] = useState<FormState>(initial);
  const [saving, setSaving] = useState(false);
  const [err, setErr]       = useState('');

  const inp = (k: keyof FormState) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm(p => ({ ...p, [k]: e.target.value }));

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) { setErr("Ism kiritilishi shart."); return; }
    setSaving(true); setErr('');
    try { await onSave(form); }
    catch (e) { setErr((e as Error).message); }
    finally { setSaving(false); }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(10,25,47,0.55)', zIndex: 200, display: 'grid', placeItems: 'center' }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background: 'var(--paper)', border: '1px solid var(--line)', borderRadius: 14, padding: '32px 36px', maxWidth: 520, width: '100%', maxHeight: '92vh', overflowY: 'auto', boxShadow: '0 28px 64px -24px rgba(10,25,47,0.35)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <h3 className="h-display" style={{ fontSize: 22, margin: 0 }}>{title}</h3>
          <button onClick={onClose} style={{ background: 'none', border: 0, cursor: 'pointer', fontSize: 22, color: 'var(--ink-3)' }}>✕</button>
        </div>
        <form onSubmit={save}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {([
              ['F.I.Sh. *', 'name'],
              ['Lavozim', 'role'],
              ['Tashkilot', 'org'],
              ['Ilmiy daraja', 'degree'],
            ] as [string, keyof FormState][]).map(([lbl, key]) => (
              <div key={key}>
                <label style={{ display: 'block', fontSize: 11.5, fontWeight: 600, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: 0.18, marginBottom: 5 }}>{lbl}</label>
                <input value={form[key]} onChange={inp(key)}
                  required={key === 'name'}
                  style={{ width: '100%', height: 40, border: '1px solid var(--line-2)', borderRadius: 8, padding: '0 12px', fontSize: 14, fontFamily: 'var(--sans)', background: 'var(--grey-2)', color: 'var(--ink)', outline: 'none', boxSizing: 'border-box' }} />
              </div>
            ))}
            <div>
              <label style={{ display: 'block', fontSize: 11.5, fontWeight: 600, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: 0.18, marginBottom: 5 }}>Bio</label>
              <textarea value={form.bio} onChange={inp('bio')} rows={3}
                style={{ width: '100%', border: '1px solid var(--line-2)', borderRadius: 8, padding: '10px 12px', fontSize: 14, fontFamily: 'var(--sans)', background: 'var(--grey-2)', color: 'var(--ink)', outline: 'none', resize: 'vertical', boxSizing: 'border-box' }} />
            </div>
            <div style={{ padding: '12px 14px', background: 'var(--grey-2)', border: '1px solid var(--line)', borderRadius: 8, fontSize: 12.5, color: 'var(--ink-3)', lineHeight: 1.5 }}>
              💡 Avatar avtomatik ism familiyaning bosh harflari asosida yaratiladi. Muallif Telegram bot orqali ham o'z profilini boshqarishi mumkin.
            </div>
          </div>
          {err && <div style={{ marginTop: 14, padding: '10px 14px', background: '#FEF2F2', border: '1px solid #FCA5A5', borderRadius: 8, fontSize: 13, color: '#DC2626' }}>{err}</div>}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 24 }}>
            <button type="button" onClick={onClose} className="btn ghost" style={{ height: 38 }}>Bekor qilish</button>
            <button type="submit" disabled={saving}
              style={{ height: 38, padding: '0 22px', borderRadius: 6, border: 0, background: saving ? 'var(--navy-30)' : 'var(--navy)', color: 'white', cursor: saving ? 'default' : 'pointer', fontSize: 13, fontWeight: 600, fontFamily: 'var(--sans)' }}>
              {saving ? 'Saqlanmoqda…' : submitLabel}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Muallif kartasi ───────────────────────────────────────────────────────────

function AuthorAdminCard({
  a, onClick, onEdit, onDelete, onChat,
}: {
  a: AdminAuthor;
  onClick: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onChat: () => void;
}) {
  // Tugma bosilganda card click ishlamasin
  const stop = (e: React.MouseEvent) => e.stopPropagation();

  return (
    <div className="card-hover" onClick={onClick} style={{
      background: 'var(--paper)',
      border: '1px solid var(--line)',
      borderRadius: 12, padding: '22px 22px 18px',
      display: 'flex', flexDirection: 'column', gap: 14, cursor: 'pointer',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <AuthorAvatar name={a.initials} idx={a.avatar_idx} size={52} />
        <div style={{ minWidth: 0 }}>
          <div style={{ fontFamily: 'var(--serif)', fontSize: 17, fontWeight: 600, color: 'var(--ink)', letterSpacing: '-0.01em', lineHeight: 1.2 }}>{a.name}</div>
          <div style={{ fontSize: 11.5, color: 'var(--ink-3)', marginTop: 3 }}>{a.role || '—'}</div>
        </div>
      </div>

      <div style={{ fontSize: 11.5, color: 'var(--ink-3)', display: 'flex', alignItems: 'center', gap: 6, paddingBottom: 14, borderBottom: '1px solid var(--line)' }}>
        <PinIcon size={11} style={{ color: 'var(--navy-50)', flexShrink: 0 }} />
        <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.org || '—'}</span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)' }}>
        {[
          [a.article_count.toLocaleString(), 'maqola'],
          [a.telegram_chat_id ? `@${a.telegram_username || '—'}` : '—', 'telegram'],
        ].map(([v, k], i) => (
          <div key={i} style={{ textAlign: 'center', borderRight: i < 1 ? '1px solid var(--line)' : 'none', padding: '2px 0' }}>
            <div style={{ fontFamily: 'var(--serif)', fontSize: 15, color: 'var(--ink)', fontWeight: 600, letterSpacing: '-0.01em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', padding: '0 4px' }}>{v}</div>
            <div style={{ fontSize: 10, color: 'var(--ink-4)', marginTop: 1, letterSpacing: 0.15, textTransform: 'uppercase', fontWeight: 600 }}>{k}</div>
          </div>
        ))}
      </div>

      {/* Admin tugmalar — card click ni to'xtatadi */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }} onClick={stop}>
        {/* Asosiy harakat — Yozish (faqat telegram chat_id bo'lsa) */}
        {a.telegram_chat_id && (
          <button onClick={onChat}
            style={{
              width: '100%', height: 34, borderRadius: 6, border: 0,
              background: 'var(--navy)', color: 'white', cursor: 'pointer',
              fontSize: 12.5, fontWeight: 600, fontFamily: 'var(--sans)',
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            }}>
            ✉️ Yozish
          </button>
        )}
        <div style={{ display: 'flex', gap: 6 }}>
          <button onClick={onEdit} className="btn ghost"
            style={{ flex: 1, height: 32, fontSize: 12, justifyContent: 'center' }}>
            ✏️ Tahrirlash
          </button>
          <button onClick={onDelete}
            style={{ flex: 1, height: 32, borderRadius: 6, border: '1px solid #FCA5A5', background: '#FEF2F2', color: '#DC2626', cursor: 'pointer', fontSize: 12, fontWeight: 600, fontFamily: 'var(--sans)' }}>
            🗑 O'chirish
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main sahifa ───────────────────────────────────────────────────────────────

export default function AdminAuthorsPage() {
  const navigate = useNavigate();
  const [authors,  setAuthors]  = useState<AdminAuthor[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [search,   setSearch]   = useState('');
  const [creating, setCreating] = useState(false);
  const [editing,  setEditing]  = useState<AdminAuthor | null>(null);
  const [deleting, setDeleting] = useState<AdminAuthor | null>(null);
  const [toast,    setToast]    = useState('');

  function flash(t: string) { setToast(t); setTimeout(() => setToast(''), 3000); }

  useEffect(() => {
    adminApi.authors.list().then(d => { setAuthors(d); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  const filtered = authors.filter(a =>
    a.name.toLowerCase().includes(search.toLowerCase()) ||
    a.org.toLowerCase().includes(search.toLowerCase()) ||
    a.telegram_username.toLowerCase().includes(search.toLowerCase())
  );

  async function handleDelete(mode: 'soft' | 'full') {
    if (!deleting) return;
    try {
      await adminApi.authors.remove(deleting.id, mode);
      setAuthors(p => p.filter(a => a.id !== deleting.id));
      setDeleting(null);
      flash("✓ Muallif o'chirildi.");
    } catch (e) { flash(`Xatolik: ${(e as Error).message}`); }
  }

  async function handleCreate(data: FormState) {
    const created = await adminApi.authors.create(data);
    setAuthors(p => [...p, created].sort((a, b) => a.name.localeCompare(b.name)));
    setCreating(false);
    flash('✓ Yangi muallif qo\'shildi.');
  }

  async function handleEdit(data: FormState) {
    if (!editing) return;
    const upd = await adminApi.authors.update(editing.id, data);
    setAuthors(p => p.map(a => a.id === editing.id ? upd : a));
    setEditing(null);
    flash('✓ Saqlandi.');
  }

  return (
    <div className="bg-authors" style={{ minHeight: '100vh' }}>
      <PageLoadBar />
      <Topbar active="admin-authors" />

      {/* Header */}
      <div style={{ padding: '48px var(--px) 32px', maxWidth: 1400, margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14, fontSize: 12.5, color: 'var(--ink-3)' }}>
          <a onClick={() => navigate('/')} style={{ cursor: 'pointer', color: 'var(--ink-3)' }}>Bosh sahifa</a>
          <span style={{ color: 'var(--ink-4)' }}>/</span>
          <span style={{ color: 'var(--ink-2)', fontWeight: 500 }}>Mualliflar</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'end', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <h1 className="h-display h1-rsp" style={{ fontSize: 52, marginBottom: 14 }}>Mualliflar</h1>
            <p style={{ fontSize: 14, color: 'var(--ink-3)', maxWidth: 600, lineHeight: 1.6 }}>
              Barcha mualliflar — chop etilmagan maqolalar egalari ham. Kartani bosing — muallif profilini ko'ring.
            </p>
          </div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
            <div className="searchbar" style={{ height: 44, minWidth: 240 }}>
              <SearchIcon size={16} style={{ color: 'var(--ink-4)', flexShrink: 0 }} />
              <input
                value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Ism, tashkilot…"
                style={{ fontSize: 13.5 }}
              />
              {search && <button onClick={() => setSearch('')} style={{ background: 'none', border: 0, cursor: 'pointer', color: 'var(--ink-3)', fontSize: 16, lineHeight: 1 }}>×</button>}
            </div>
            <button onClick={() => setCreating(true)} className="btn primary" style={{ height: 44, fontSize: 13.5 }}>
              + Yangi muallif
            </button>
          </div>
        </div>

        {toast && (
          <div style={{ marginTop: 16, padding: '10px 16px', background: 'rgba(6,95,70,0.08)', border: '1px solid rgba(6,95,70,0.25)', borderRadius: 8, fontSize: 13, color: '#065F46' }}>
            {toast}
          </div>
        )}
      </div>

      {/* Admin strip */}
      <div style={{ padding: '0 var(--px) 0', maxWidth: 1400, margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 18 }}>
          <span className="eyebrow" style={{ fontSize: 10.5 }}>
            Admin ko'rinish · {filtered.length} ta muallif bor
          </span>
        </div>
      </div>

      {/* Author cards */}
      {loading ? (
        <div style={{ padding: '64px var(--px)', textAlign: 'center', color: 'var(--ink-3)', fontSize: 13 }}>Yuklanmoqda…</div>
      ) : (
        <div className="rsp-4" style={{ padding: '0 var(--px) 64px', maxWidth: 1400, margin: '0 auto' }}>
          {filtered.length === 0 ? (
            <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '64px 0', color: 'var(--ink-3)', fontSize: 14 }}>
              Mualliflar topilmadi.
            </div>
          ) : (
            filtered.map(a => (
              <AuthorAdminCard
                key={a.id} a={a}
                onClick={() => navigate(`/authors/${a.slug}`)}
                onEdit={() => setEditing(a)}
                onDelete={() => setDeleting(a)}
                onChat={() => navigate(`/admin/chat?author=${a.slug}`)}
              />
            ))
          )}
        </div>
      )}

      <Footer />

      {creating && (
        <AuthorFormModal
          title="Yangi muallif qo'shish"
          initial={EMPTY_FORM}
          submitLabel="Qo'shish"
          onSave={handleCreate}
          onClose={() => setCreating(false)}
        />
      )}
      {editing && (
        <AuthorFormModal
          title="Muallif tahrirlash"
          initial={{
            name:   editing.name,
            role:   editing.role,
            org:    editing.org,
            degree: editing.degree,
            bio:    editing.bio,
          }}
          submitLabel="Saqlash"
          onSave={handleEdit}
          onClose={() => setEditing(null)}
        />
      )}
      {deleting && (
        <DeleteModal author={deleting} onConfirm={handleDelete} onClose={() => setDeleting(null)} />
      )}
    </div>
  );
}
