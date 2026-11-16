import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AdminShell from '../../components/admin/AdminShell';
import ParsePanel from '../../components/admin/ParsePanel';
import { NewIssueModal } from '../../components/admin/IssueModals';
import { adminApi, type AdminIssue } from '../../lib/admin-api';
import { fmtBytes } from '../../lib/admin-dashboard';
import { useI18n } from '../../lib/i18n';

/**
 * Jurnal sonlari — Figma «Jurnal sonlari»: 4 statistika, yillar bo'yicha
 * kartalar (muqova, holat, PDF, ko'rishlar; Tahrirlash | PDF'dan ajratish).
 */
export default function AdminJournalsPage() {
  const { t, tn } = useI18n();
  const navigate = useNavigate();
  const [issues, setIssues]   = useState<AdminIssue[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [parsing, setParsing] = useState<AdminIssue | null>(null);

  const load = () => adminApi.issues.list().then(setIssues).catch(() => {}).finally(() => setLoading(false));
  useEffect(() => { load(); }, []);

  const stats = useMemo(() => ({
    total: issues.length,
    published: issues.filter(i => !i.is_upcoming).length,
    drafts: issues.filter(i => i.is_upcoming).length,
    articles: issues.reduce((s, i) => s + i.article_count, 0),
  }), [issues]);

  // Ajratish tugallanmagan sonlar — nomzodlari saqlanmagan
  const todo = useMemo(() => issues.filter(i => i.parsed_pending > 0), [issues]);

  const years = useMemo(() => {
    const byYear = new Map<number, AdminIssue[]>();
    for (const i of issues) byYear.set(i.year, [...(byYear.get(i.year) ?? []), i]);
    return [...byYear.entries()].sort((a, b) => b[0] - a[0]).map(([y, list]) => [y, list.sort((a, b) => b.number - a.number)] as const);
  }, [issues]);

  return (
    <AdminShell active="journals" crumb={t('nav.admin.journals')}>
      <div className="adm-head">
        <div>
          <h1 className="adm-h1">{t('nav.admin.journals')}</h1>
          <p className="adm-sub">{t('adm.jr.sub')}</p>
        </div>
        <div className="adm-actions"><button className="ab lg primary" onClick={() => setCreating(true)}>{t('adm.jr.new')}</button></div>
      </div>

      <div className="stat-grid">
        {([[t('adm.jr.stat.total'), stats.total], [t('adm.jr.stat.published'), stats.published], [t('adm.jr.stat.drafts'), stats.drafts], [t('adm.jr.stat.articles'), stats.articles]] as [string, number][]).map(([k, v]) => (
          <div key={k} className="stat-card"><div className="stat-val" style={{ margin: '0 0 6px' }}>{v}</div><div className="stat-lbl">{k}</div></div>
        ))}
      </div>

      {todo.length > 0 && (
        <div className="jr-notice">
          <b>{t('adm.jr.todo', { issues: tn('adm.jr.todo_issues', todo.length) })}</b>
          {todo.map(i => <button key={i.id} onClick={() => setParsing(i)}>{i.year} № {i.number} · {tn('adm.jr.candidates', i.parsed_pending)}</button>)}
        </div>
      )}

      {loading && <div className="sub-empty">{t('common.loading')}</div>}
      {!loading && issues.length === 0 && <div className="sub-empty">{t('adm.jr.empty')}</div>}

      {years.map(([year, list]) => (
        <section key={year}>
          <div className="jr-year">
            <span className="y">{year}</span><span className="rule" />
            <span className="m">{tn('unit.issues', list.length)} · {tn('unit.articles', list.reduce((s, i) => s + i.article_count, 0))}</span>
          </div>
          <div className="jr-grid">
            {list.map(i => (
              <article key={i.id} className={`jr-card${i.parsed_pending > 0 ? ' todo' : ''}`}>
                <div className="jr-body">
                  <Link to={`/admin/journals/${i.id}`} className={`jr-cover${i.cover_image_url ? '' : ' ph'}`}>
                    {i.cover_image_url ? <img src={i.cover_image_url} alt="" /> : <><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><rect x="4" y="4" width="16" height="16" rx="2"/><circle cx="9" cy="9" r="1.6"/><path d="M20 16l-5-5-7 7"/></svg><span>{t('adm.jr.cover_ph')}</span></>}
                  </Link>
                  <div style={{ minWidth: 0 }}>
                    <div className="jr-chips">
                      <span className={`chip-m ${i.is_upcoming ? 'accent' : 'green'}`}>{i.is_upcoming ? t('adm.jr.draft') : t('adm.jr.published')}</span>
                      {i.parsed_pending > 0 && <span className="chip-m red">{tn('adm.jr.unsaved', i.parsed_pending)}</span>}
                      {i.pdf_file_url && i.parsed_total === 0 && i.article_count === 0 && <span className="chip-m grey">{t('adm.jr.not_parsed')}</span>}
                    </div>
                    <div className="jr-title">{i.year} · № {i.number}</div>
                    <div className="jr-sub">{t('issue.date_with_vol', { year: i.year, vol: i.volume })} · {i.is_upcoming ? t('adm.jr.attached', { articles: tn('unit.articles', i.article_count) }) : tn('unit.articles', i.article_count)}</div>
                    <div className={`jr-pdf${i.pdf_file_url ? '' : ' no'}`}>{i.pdf_file_url ? `PDF · ${fmtBytes(i.pdf_size)}` : t('adm.jr.no_pdf')}</div>
                    <div className="jr-views">{i.is_upcoming ? t('adm.jr.hidden') : tn('unit.views', i.views)}</div>
                  </div>
                </div>
                <div className="jr-foot">
                  <Link to={`/admin/journals/${i.id}`}>{t('adm.jr.edit')}</Link>
                  <button className="accent" onClick={() => setParsing(i)}>{t('adm.jr.parse')}{i.parsed_pending > 0 ? ` · ${i.parsed_pending}` : ''}</button>
                </div>
              </article>
            ))}
          </div>
        </section>
      ))}

      {creating && <NewIssueModal issues={issues} onDone={i => { setCreating(false); navigate(`/admin/journals/${i.id}`); }} onClose={() => setCreating(false)} />}
      {parsing && <ParsePanel issue={parsing} onClose={() => setParsing(null)} onSaved={load} />}
    </AdminShell>
  );
}
