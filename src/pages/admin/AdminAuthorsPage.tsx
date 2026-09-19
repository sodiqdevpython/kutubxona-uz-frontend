import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminShell from '../../components/admin/AdminShell';
import AuthorAvatar from '../../components/ui/AuthorAvatar';
import Pagination from '../../components/ui/Pagination';
import { AuthorEditModal } from '../../components/admin/AuthorModals';
import { adminApi, type AdminAuthor, type AuthorCounts, type AuthorFilter } from '../../lib/admin-api';
import { mediaUrl } from '../../lib/config';

/**
 * Mualliflar — Figma «Mualliflar»: filtr chiplari (Barchasi / To'liqsiz / Telegramli / Parserdan),
 * jadval (muallif · tashkilot · maqola · manba · amallar), to'liqsizlar tepada, raqamli sahifalash.
 */

const PER_PAGE = 8;
const SRC: Record<AdminAuthor['source'], string> = { telegram: 'Bot', parser: 'Parser', manual: 'Qo‘lda' };

export default function AdminAuthorsPage() {
  const navigate = useNavigate();
  const [filter, setFilter] = useState<AuthorFilter>('all');
  const [search, setSearch] = useState('');
  const [debQ, setDebQ]     = useState('');
  const [page, setPage]     = useState(1);
  const [rows, setRows]     = useState<AdminAuthor[]>([]);
  const [total, setTotal]   = useState(0);
  const [counts, setCounts] = useState<AuthorCounts | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<AdminAuthor | null | 'new'>(null);
  const [toast, setToast]     = useState('');
  function flash(t: string) { setToast(t); setTimeout(() => setToast(''), 3500); }

  useEffect(() => { const t = setTimeout(() => { setDebQ(search); setPage(1); }, 350); return () => clearTimeout(t); }, [search]);

  // «Yuklanmoqda…» faqat birinchi yuklashda; keyingi so'rovlarda eski qatorlar yangisi kelguncha turadi
  const load = useCallback(() =>
    adminApi.authors.list({ offset: (page - 1) * PER_PAGE, limit: PER_PAGE, search: debQ || undefined, filter })
      .then(d => { setRows(d.results); setTotal(d.total); setCounts(d.counts); })
      .catch(() => {}).finally(() => setLoading(false)),
  [page, debQ, filter]);
  useEffect(() => { load(); }, [load]);

  const chips: { key: AuthorFilter; label: string; n?: number }[] = [
    { key: 'all', label: 'Barchasi', n: counts?.all }, { key: 'incomplete', label: 'To‘liqsiz profil', n: counts?.incomplete },
    { key: 'telegram', label: 'Telegramli', n: counts?.telegram }, { key: 'parser', label: 'Parserdan', n: counts?.parser },
  ];
  const from = total ? (page - 1) * PER_PAGE + 1 : 0, to = Math.min(page * PER_PAGE, total);

  return (
    <AdminShell active="authors" crumb="Mualliflar">
      <div className="adm-head">
        <div>
          <h1 className="adm-h1">Mualliflar</h1>
          <p className="adm-sub">{counts ? `${counts.all} profil. To‘liqsizlari tepada — ularga tashkilot yoki ORCID kiritish kerak.` : 'Yuklanmoqda…'}</p>
        </div>
        <div className="adm-actions">
          <div className="sub-search" style={{ width: 250, height: 46 }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/></svg>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Ism yoki tashkilot" />
          </div>
          <button className="ab lg primary" onClick={() => setEditing('new')}>+ Muallif</button>
        </div>
      </div>

      <div className="sub-filters" style={{ marginBottom: 18 }}>
        {chips.map(c => (
          <button key={c.key} className={`fchip${filter === c.key ? ' on' : ''}`} onClick={() => { setFilter(c.key); setPage(1); }}>
            {c.label}{c.n !== undefined && <span>{c.n}</span>}
          </button>
        ))}
      </div>

      <div className="au-table">
        <div className="au-th"><span>Muallif</span><span>Tashkilot</span><span>Maqola</span><span>Manba</span><span /></div>
        {loading && rows.length === 0 && <div className="sub-empty">Yuklanmoqda…</div>}
        {!loading && rows.length === 0 && <div className="sub-empty">Mualliflar topilmadi.</div>}
        {rows.map(a => (
          <div key={a.id} className={`au-tr${a.is_incomplete ? ' inc' : ''}`}>
            <div className="who">
              <AuthorAvatar name={a.initials || '?'} idx={a.avatar_idx} src={mediaUrl(a.avatar_url)} size={40} />
              <div style={{ minWidth: 0 }}>
                <div className="nm" onClick={() => navigate(`/admin/authors/${a.id}`)}>{a.name}</div>
                {a.telegram_username ? <div className="tg">@{a.telegram_username}</div> : <div className="tg no">Telegramsiz</div>}
              </div>
            </div>
            <div className={`org${a.org ? '' : ' no'}`}>{a.org ? [a.org, a.role].filter(Boolean).join(' · ') : 'Tashkilot ko‘rsatilmagan'}</div>
            <div className="cnt">{a.article_count || '–'}</div>
            <div><span className={`src-chip ${a.source}`}>{SRC[a.source]}</span></div>
            <div className="acts">
              {a.telegram_chat_id && <button className="ab sm" onClick={() => navigate(`/admin/chat?author=${a.slug}`)}>Yozish</button>}
              <button className="ab sm" onClick={() => setEditing(a)}>Tahrir</button>
            </div>
          </div>
        ))}
        {total > 0 && (
          <div className="au-tfoot">
            <span>{from}–{to} / {total}</span>
            <Pagination total={total} perPage={PER_PAGE} current={page} label={null} onPageChange={p => setPage(p)} />
          </div>
        )}
      </div>

      {toast && <div className="adm-toast">{toast}</div>}
      {editing && <AuthorEditModal author={editing === 'new' ? null : editing}
        onDone={a => { setEditing(null); flash(`✓ «${a.name}» saqlandi.`); load(); }} onClose={() => setEditing(null)} />}
    </AdminShell>
  );
}
