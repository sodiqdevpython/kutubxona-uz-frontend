import { Link } from 'react-router-dom';
import AdminShell from '../../components/admin/AdminShell';
import { relTime, todayEyebrow, useDashboard } from '../../lib/admin-dashboard';
import { useI18n } from '../../lib/i18n';

/**
 * Boshqaruv paneli — Figma «Admin / Asosiy»:
 * sana + sarlavha + 2 tugma, 4 ta statistika kartasi,
 * chapda «Ish navbati», o'ngda tayyorlanayotgan son va «So'nggi harakatlar».
 */

function Stat({ label, value, chip }: { label: string; value: string; chip?: { cls: 'red' | 'green' | 'grey'; text: string } }) {
  return (
    <div className="stat-card">
      <div className="stat-lbl">{label}</div>
      <div className="stat-val">{value}</div>
      {chip && <span className={`chip-s ${chip.cls}`}>{chip.text}</span>}
    </div>
  );
}

export default function AdminDashboardPage() {
  const { t, tn, num } = useI18n();
  const d = useDashboard();
  const c = d?.counts;
  const up = d?.upcoming_issue;
  const fmtN = (n: number | undefined | null) => (n === undefined || n === null ? '–' : num(n));

  // «Bugun <b>{n} maqola</b> ko‘rib chiqishni kutmoqda» — qalin qism alohida element
  const [pendA, pendB] = t('adm.dash.pending_sub').split('{x}');

  return (
    <AdminShell active="dashboard" crumb={t('adm.dash.crumb')}>
      <div className="adm-head">
        <div>
          <div className="adm-eyebrow">{todayEyebrow(d?.date)}</div>
          <h1 className="adm-h1">{t('adm.dash.title')}</h1>
          <p className="adm-sub">
            {c ? (
              c.pending > 0 ? (
                <>{pendA}<b>{tn('unit.articles', c.pending)}</b>{pendB}
                  {c.pending_overdue > 0 ? t('adm.dash.pending_overdue', { n: c.pending_overdue }) : null}.</>
              ) : <>{t('adm.dash.no_pending')}</>
            ) : t('common.loading')}
          </p>
        </div>
        <div className="adm-actions">
          <Link to="/admin/journals" className="ab lg">{t('adm.dash.new_issue')}</Link>
          <Link to="/admin/submissions" className="ab lg primary">{t('adm.dash.submissions', { n: c?.pending ?? 0 })}</Link>
        </div>
      </div>

      <div className="stat-grid">
        <Stat label={t('adm.dash.stat.pending')} value={fmtN(c?.pending)}
          chip={c ? (c.pending_overdue > 0 ? { cls: 'red', text: tn('adm.dash.stat.overdue', c.pending_overdue) } : { cls: 'green', text: t('adm.dash.stat.no_overdue') }) : undefined} />
        <Stat label={t('adm.dash.stat.published')} value={fmtN(c?.published)}
          chip={c ? { cls: 'green', text: t('adm.dash.stat.quarter', { n: c.published_quarter }) } : undefined} />
        <Stat label={t('adm.dash.stat.authors')} value={fmtN(c?.authors)}
          chip={c ? { cls: 'grey', text: tn('adm.dash.stat.incomplete', c.authors_incomplete) } : undefined} />
        <Stat label={t('adm.dash.stat.views')} value={fmtN(c?.views_30d)}
          chip={c ? (c.views_delta_pct === null
            ? { cls: 'grey', text: t('adm.dash.stat.no_prev') }
            : { cls: c.views_delta_pct >= 0 ? 'green' : 'red', text: `${c.views_delta_pct >= 0 ? '+' : ''}${c.views_delta_pct}%` }) : undefined} />
      </div>

      <div className="dash-grid">
        {/* ── Ish navbati ── */}
        <div className="acard">
          <div className="acard-head">
            <h2 className="acard-title">{t('adm.dash.queue')}</h2>
            <span className="acard-meta">{t('adm.dash.queue_sub')}</span>
          </div>
          {(d?.queue ?? []).map(q => (
            <Link key={q.key} to={q.to} className={`q-row ${q.color}`}>
              <div>
                <div className="q-title">{q.title}</div>
                <div className="q-sub">{q.sub}</div>
              </div>
              <div className="q-meta">{q.meta}</div>
              <div className="q-n">{q.count}<small>{q.unit}</small></div>
            </Link>
          ))}
          {d && d.queue.length === 0 && <div className="q-empty">{t('adm.dash.queue_empty')}</div>}
          {!d && <div className="q-empty">{t('common.loading')}</div>}
        </div>

        <div>
          {/* ── Tayyorlanayotgan son ── */}
          {up && (
            <div className="acard">
              <Link to="/admin/journals" className="up-card" style={{ textDecoration: 'none', color: 'inherit' }}>
                <div className="up-cover">{up.cover_url && <img src={up.cover_url} alt="" />}</div>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <span className="chip-m accent">{up.status}</span>
                  <div className="up-title">{up.label}</div>
                  <div className="up-sub">{up.note}</div>
                  <div className="up-bar"><i style={{ width: `${Math.round(up.steps_done / up.steps * 100)}%` }} /></div>
                  <div className="up-meta">{t('adm.dash.up_meta', { done: up.steps_done, total: up.steps, articles: tn('unit.articles', up.articles) })}</div>
                </div>
              </Link>
            </div>
          )}

          {/* ── So'nggi harakatlar ── */}
          <div className="acard">
            <div className="acard-head"><h2 className="acard-title">{t('adm.dash.activity')}</h2></div>
            <div className="act-list">
              {(d?.activity ?? []).map((a, i) => (
                <div key={i} className={`act-row ${a.kind}`}>
                  <span className="dot" />
                  <div>
                    <div className="act-txt">{a.text}</div>
                    <div className="act-meta">{relTime(a.time)} · {a.who}</div>
                  </div>
                </div>
              ))}
              {d && d.activity.length === 0 && <div className="act-row"><div className="act-txt" style={{ color: 'var(--ink-3)' }}>{t('adm.dash.activity_empty')}</div></div>}
            </div>
          </div>
        </div>
      </div>
    </AdminShell>
  );
}
