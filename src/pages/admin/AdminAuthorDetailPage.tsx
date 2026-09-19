import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import AdminShell from '../../components/admin/AdminShell';
import { AuthorDeleteModal, AuthorEditModal } from '../../components/admin/AuthorModals';
import { adminApi, type AdminAuthorDetail } from '../../lib/admin-api';
import { mediaUrl } from '../../lib/config';

/** Muallif profili — Figma «Muallif detail». */

function d(iso: string | null | undefined): string {
  if (!iso) return '—';
  const x = new Date(iso); if (Number.isNaN(x.getTime())) return iso;
  return `${String(x.getDate()).padStart(2, '0')}.${String(x.getMonth() + 1).padStart(2, '0')}.${x.getFullYear()}`;
}
const SRC: Record<string, string> = { telegram: 'Telegram bot', parser: 'PDF parser', manual: 'Qo‘lda' };

export default function AdminAuthorDetailPage() {
  const { id = '' } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [a, setA] = useState<AdminAuthorDetail | null>(null);
  const [failed, setFailed] = useState(false);
  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  // id o'zgarsa — eski profilni render vaqtida darhol tozalaymiz
  const [shownId, setShownId] = useState(id);
  if (shownId !== id) { setShownId(id); setA(null); setFailed(false); }
  const load = useCallback(() => adminApi.authors.get(id).then(setA).catch(() => setFailed(true)), [id]);
  useEffect(() => { load(); }, [load]);

  return (
    <AdminShell active="authors" crumb="Mualliflar › Muallif profili">
      <div className="det-top">
        <Link to="/admin/authors" className="ab">‹ Mualliflar</Link>
        <span className="lbl">Muallif profili</span>
        {a && (
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 10 }}>
            <button className="ab" disabled={!a.telegram_chat_id} onClick={() => navigate(`/admin/chat?author=${a.slug}`)}>Xabar yozish</button>
            <button className="ab primary" onClick={() => setEditing(true)}>Tahrirlash</button>
          </div>
        )}
      </div>

      {failed && <div className="sub-empty">Muallif topilmadi.</div>}
      {!a ? (!failed && <div className="sub-empty">Yuklanmoqda…</div>) : (
        <div className="aud-grid">
          <div>
            <div className="acard aud-profile">
              <div className="aud-ava">{a.avatar_url ? <img src={mediaUrl(a.avatar_url) ?? undefined} alt="" /> : a.initials || '?'}</div>
              <div className="aud-name">{a.name}</div>
              <div className="aud-org">{[a.org, a.role].filter(Boolean).join(' · ') || 'Tashkilot ko‘rsatilmagan'}</div>
              <span className={`chip-m ${a.source === 'telegram' ? 'accent' : a.source === 'manual' ? 'green' : 'grey'}`}>{SRC[a.source]}</span>
              {a.is_incomplete && <div className="meta" style={{ fontSize: 12.5, color: 'var(--adm-red)', marginTop: 12 }}>Profil to‘liqsiz — tashkilot yoki ORCID kiritilmagan</div>}
            </div>
            <div className="acard" style={{ marginTop: 16 }}>
              <div className="acard-head"><h2 className="acard-title">Aloqa va identifikatorlar</h2></div>
              <div className="aud-rows">
                <div className="aud-row"><div className="k">Telegram</div><div className={`v${a.telegram_username ? '' : ' no'}`}>{a.telegram_username ? <a href={`https://t.me/${a.telegram_username}`} target="_blank" rel="noreferrer">@{a.telegram_username}</a> : 'yo‘q'}</div></div>
                <div className="aud-row"><div className="k">ORCID</div><div className={`v${a.orcid ? '' : ' no'}`}>{a.orcid ? <a href={`https://orcid.org/${a.orcid}`} target="_blank" rel="noreferrer">{a.orcid}</a> : 'ko‘rsatilmagan'}</div></div>
                <div className="aud-row"><div className="k">E-pochta</div><div className={`v${a.email ? '' : ' no'}`}>{a.email ? <a href={`mailto:${a.email}`}>{a.email}</a> : 'ko‘rsatilmagan'}</div></div>
                <div className="aud-row"><div className="k">Scopus Author ID</div><div className={`v${a.scopus_id ? '' : ' no'}`}>{a.scopus_id || 'ko‘rsatilmagan'}</div></div>
                {a.degree && <div className="aud-row"><div className="k">Ilmiy daraja</div><div className="v">{a.degree}</div></div>}
                <div className="aud-row"><div className="k">Profil yaratilgan</div><div className="v">{d(a.created_at)}</div></div>
              </div>
            </div>
            {a.bio && <div className="acard" style={{ marginTop: 16, padding: 20 }}><div className="iss-lbl">Tarjimai hol</div><p style={{ margin: 0, fontSize: 14, lineHeight: 1.6, color: 'var(--ink-2)' }}>{a.bio}</p></div>}
            <button className="ab text red block" style={{ marginTop: 16 }} onClick={() => setDeleting(true)}>Profilni o‘chirish</button>
          </div>

          <div>
            <div className="aud-stats">
              {[['Nashr etilgan', a.stats.published], ['Ko‘rib chiqilmoqda', a.stats.pending], ['Ko‘rishlar', a.stats.views], ['Rad etilgan', a.stats.rejected]].map(([k, v]) => (
                <div key={k} className="aud-stat"><div className="k">{k}</div><div className="v">{v || '—'}</div></div>
              ))}
            </div>
            <div className="acard">
              <div className="acard-head"><h2 className="acard-title">Maqolalari <span className="acard-meta" style={{ fontFamily: 'var(--mono)' }}>{a.articles.length ? `${a.articles.length} ta` : 'yo‘q'}</span></h2></div>
              {a.articles.map((x, i) => (
                <a key={x.id} className="aud-art" href={`/articles/${x.slug}`} target="_blank" rel="noreferrer">
                  <span className="n">{String(i + 1).padStart(2, '0')}</span>
                  <span className="t">{x.title}</span>
                  <span className="m">{x.issue_label ?? 'songa biriktirilmagan'}</span>
                  <span className="m" style={{ textAlign: 'right' }}>{x.views} ko‘rish</span>
                </a>
              ))}
            </div>
            {a.pending_submission && (
              <div className="acard" style={{ marginTop: 16, padding: 18 }}>
                <div className="iss-lbl">Ko‘rib chiqilayotgan maqola</div>
                <div className="ch-art">
                  <span className="chip-m blue">Taqrizda</span>
                  <div className="t">{a.pending_submission.title || 'Sarlavhasiz'}</div>
                  <div className="m">{d(a.pending_submission.submitted_at)}</div>
                  <Link to={`/admin/submissions/${a.pending_submission.id}`} className="ab sm block">Maqolaga o‘tish</Link>
                </div>
              </div>
            )}
            <div className="acard" style={{ marginTop: 16 }}>
              <div className="acard-head"><h2 className="acard-title">Faoliyat tarixi</h2></div>
              {a.activity.map((e, i) => (
                <div key={i} className={`aud-act ${e.kind}`}><span className="dot" /><span>{e.text}</span><span className="d">{d(e.time)}</span></div>
              ))}
            </div>
          </div>
        </div>
      )}

      {editing && a && <AuthorEditModal author={a} onDone={() => { setEditing(false); load(); }} onClose={() => setEditing(false)} />}
      {deleting && a && <AuthorDeleteModal author={a} onDone={() => navigate('/admin/authors')} onClose={() => setDeleting(false)} />}
    </AdminShell>
  );
}
