import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import AdminShell from '../../components/admin/AdminShell';
import { AuthorDeleteModal, AuthorEditModal } from '../../components/admin/AuthorModals';
import { adminApi, type AdminAuthorDetail } from '../../lib/admin-api';
import { mediaUrl } from '../../lib/config';
import { useI18n, type MsgKey } from '../../lib/i18n';

/** Muallif profili — Figma «Muallif detail». */

function d(iso: string | null | undefined): string {
  if (!iso) return '—';
  const x = new Date(iso); if (Number.isNaN(x.getTime())) return iso;
  return `${String(x.getDate()).padStart(2, '0')}.${String(x.getMonth() + 1).padStart(2, '0')}.${x.getFullYear()}`;
}
const SRC: Record<string, MsgKey> = { telegram: 'adm.au.src_long.telegram', parser: 'adm.au.src_long.parser', manual: 'adm.au.src.manual' };

export default function AdminAuthorDetailPage() {
  const { id = '' } = useParams<{ id: string }>();
  const { t, tn } = useI18n();
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
    <AdminShell active="authors" crumb={t('adm.au.crumb_detail')}>
      <div className="det-top">
        <Link to="/admin/authors" className="ab">{t('adm.au.back')}</Link>
        <span className="lbl">{t('adm.au.profile')}</span>
        {a && (
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 10 }}>
            <button className="ab" disabled={!a.telegram_chat_id} onClick={() => navigate(`/admin/chat?author=${a.slug}`)}>{t('adm.au.message')}</button>
            <button className="ab primary" onClick={() => setEditing(true)}>{t('common.edit')}</button>
          </div>
        )}
      </div>

      {failed && <div className="sub-empty">{t('adm.au.not_found')}</div>}
      {!a ? (!failed && <div className="sub-empty">{t('common.loading')}</div>) : (
        <div className="aud-grid">
          <div>
            <div className="acard aud-profile">
              <div className="aud-ava">{a.avatar_url ? <img src={mediaUrl(a.avatar_url) ?? undefined} alt="" /> : a.initials || '?'}</div>
              <div className="aud-name">{a.name}</div>
              <div className="aud-org">{[a.org, a.role].filter(Boolean).join(' · ') || t('adm.au.no_org')}</div>
              <span className={`chip-m ${a.source === 'telegram' ? 'accent' : a.source === 'manual' ? 'green' : 'grey'}`}>{SRC[a.source] ? t(SRC[a.source]) : a.source}</span>
              {a.is_incomplete && <div className="meta" style={{ fontSize: 12.5, color: 'var(--adm-red)', marginTop: 12 }}>{t('adm.au.incomplete_note')}</div>}
            </div>
            <div className="acard" style={{ marginTop: 16 }}>
              <div className="acard-head"><h2 className="acard-title">{t('adm.au.contacts')}</h2></div>
              <div className="aud-rows">
                <div className="aud-row"><div className="k">Telegram</div><div className={`v${a.telegram_username ? '' : ' no'}`}>{a.telegram_username ? <a href={`https://t.me/${a.telegram_username}`} target="_blank" rel="noreferrer">@{a.telegram_username}</a> : t('adm.au.none')}</div></div>
                <div className="aud-row"><div className="k">ORCID</div><div className={`v${a.orcid ? '' : ' no'}`}>{a.orcid ? <a href={`https://orcid.org/${a.orcid}`} target="_blank" rel="noreferrer">{a.orcid}</a> : t('common.not_specified')}</div></div>
                <div className="aud-row"><div className="k">{t('adm.au.email')}</div><div className={`v${a.email ? '' : ' no'}`}>{a.email ? <a href={`mailto:${a.email}`}>{a.email}</a> : t('common.not_specified')}</div></div>
                <div className="aud-row"><div className="k">Scopus Author ID</div><div className={`v${a.scopus_id ? '' : ' no'}`}>{a.scopus_id || t('common.not_specified')}</div></div>
                {a.degree && <div className="aud-row"><div className="k">{t('adm.au.degree')}</div><div className="v">{a.degree}</div></div>}
                <div className="aud-row"><div className="k">{t('adm.au.created')}</div><div className="v">{d(a.created_at)}</div></div>
              </div>
            </div>
            {a.bio && <div className="acard" style={{ marginTop: 16, padding: 20 }}><div className="iss-lbl">{t('adm.au.bio')}</div><p style={{ margin: 0, fontSize: 14, lineHeight: 1.6, color: 'var(--ink-2)' }}>{a.bio}</p></div>}
            <button className="ab text red block" style={{ marginTop: 16 }} onClick={() => setDeleting(true)}>{t('adm.au.delete')}</button>
          </div>

          <div>
            <div className="aud-stats">
              {([[t('adm.au.st.published'), a.stats.published], [t('adm.au.st.pending'), a.stats.pending], [t('adm.au.st.views'), a.stats.views], [t('adm.au.st.rejected'), a.stats.rejected]] as [string, number][]).map(([k, v]) => (
                <div key={k} className="aud-stat"><div className="k">{k}</div><div className="v">{v || '—'}</div></div>
              ))}
            </div>
            <div className="acard">
              <div className="acard-head"><h2 className="acard-title">{t('adm.au.articles')} <span className="acard-meta" style={{ fontFamily: 'var(--mono)' }}>{a.articles.length ? t('unit.count_ta', { n: a.articles.length }) : t('adm.au.none')}</span></h2></div>
              {a.articles.map((x, i) => (
                <a key={x.id} className="aud-art" href={`/articles/${x.slug}`} target="_blank" rel="noreferrer">
                  <span className="n">{String(i + 1).padStart(2, '0')}</span>
                  <span className="t">{x.title}</span>
                  <span className="m">{x.issue_label ?? t('adm.au.no_issue')}</span>
                  <span className="m" style={{ textAlign: 'right' }}>{tn('unit.views', x.views)}</span>
                </a>
              ))}
            </div>
            {a.pending_submission && (
              <div className="acard" style={{ marginTop: 16, padding: 18 }}>
                <div className="iss-lbl">{t('adm.chat.reviewing')}</div>
                <div className="ch-art">
                  <span className="chip-m blue">{t('adm.chat.in_review')}</span>
                  <div className="t">{a.pending_submission.title || t('adm.chat.untitled')}</div>
                  <div className="m">{d(a.pending_submission.submitted_at)}</div>
                  <Link to={`/admin/submissions/${a.pending_submission.id}`} className="ab sm block">{t('adm.chat.goto_article')}</Link>
                </div>
              </div>
            )}
            <div className="acard" style={{ marginTop: 16 }}>
              <div className="acard-head"><h2 className="acard-title">{t('adm.au.activity')}</h2></div>
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
