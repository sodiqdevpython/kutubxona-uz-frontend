import { Link } from 'react-router-dom';
import AdminShell from '../../components/admin/AdminShell';
import { relTime, todayEyebrow, useDashboard } from '../../lib/admin-dashboard';

/**
 * Boshqaruv paneli — Figma «Admin / Asosiy»:
 * sana + sarlavha + 2 tugma, 4 ta statistika kartasi,
 * chapda «Ish navbati», o'ngda tayyorlanayotgan son va «So'nggi harakatlar».
 */

function fmtN(n: number | undefined | null): string {
  if (n === undefined || n === null) return '–';
  return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
}

function Stat({ label, value, chip }: { label: string; value?: number | null; chip?: { cls: 'red' | 'green' | 'grey'; text: string } }) {
  return (
    <div className="stat-card">
      <div className="stat-lbl">{label}</div>
      <div className="stat-val">{fmtN(value)}</div>
      {chip && <span className={`chip-s ${chip.cls}`}>{chip.text}</span>}
    </div>
  );
}

export default function AdminDashboardPage() {
  const d = useDashboard();
  const c = d?.counts;
  const up = d?.upcoming_issue;

  return (
    <AdminShell active="dashboard" crumb="Panel">
      <div className="adm-head">
        <div>
          <div className="adm-eyebrow">{todayEyebrow(d?.date)}</div>
          <h1 className="adm-h1">Boshqaruv paneli</h1>
          <p className="adm-sub">
            {c ? (
              c.pending > 0 ? (
                <>Bugun <b>{c.pending} maqola</b> ko‘rib chiqishni kutmoqda
                  {c.pending_overdue > 0 ? <>, {c.pending_overdue} tasi besh kundan ortiq turgan</> : null}.</>
              ) : <>Ko‘rib chiqilmagan maqola yo‘q — navbat bo‘sh.</>
            ) : 'Yuklanmoqda…'}
          </p>
        </div>
        <div className="adm-actions">
          <Link to="/admin/journals" className="ab lg">Yangi son</Link>
          <Link to="/admin/submissions" className="ab lg primary">Kelgan maqolalar · {c?.pending ?? 0}</Link>
        </div>
      </div>

      <div className="stat-grid">
        <Stat label="Ko‘rib chiqilmagan" value={c?.pending}
          chip={c ? (c.pending_overdue > 0 ? { cls: 'red', text: `${c.pending_overdue} tasi kechikkan` } : { cls: 'green', text: 'kechikkan yo‘q' }) : undefined} />
        <Stat label="Nashr etilgan maqola" value={c?.published}
          chip={c ? { cls: 'green', text: `+${c.published_quarter} shu chorakda` } : undefined} />
        <Stat label="Mualliflar" value={c?.authors}
          chip={c ? { cls: 'grey', text: `${c.authors_incomplete} profil to‘liqsiz` } : undefined} />
        <Stat label="Ko‘rishlar · 30 kun" value={c?.views_30d}
          chip={c ? (c.views_delta_pct === null
            ? { cls: 'grey', text: 'oldingi davr yo‘q' }
            : { cls: c.views_delta_pct >= 0 ? 'green' : 'red', text: `${c.views_delta_pct >= 0 ? '+' : ''}${c.views_delta_pct}%` }) : undefined} />
      </div>

      <div className="dash-grid">
        {/* ── Ish navbati ── */}
        <div className="acard">
          <div className="acard-head">
            <h2 className="acard-title">Ish navbati</h2>
            <span className="acard-meta">muhimlik bo‘yicha</span>
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
          {d && d.queue.length === 0 && <div className="q-empty">Navbat bo‘sh — hammasi ko‘rib chiqilgan.</div>}
          {!d && <div className="q-empty">Yuklanmoqda…</div>}
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
                  <div className="up-meta">{up.steps_done} / {up.steps} bosqich · {up.articles} maqola</div>
                </div>
              </Link>
            </div>
          )}

          {/* ── So'nggi harakatlar ── */}
          <div className="acard">
            <div className="acard-head"><h2 className="acard-title">So‘nggi harakatlar</h2></div>
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
              {d && d.activity.length === 0 && <div className="act-row"><div className="act-txt" style={{ color: 'var(--ink-3)' }}>Hali harakatlar yo‘q.</div></div>}
            </div>
          </div>
        </div>
      </div>
    </AdminShell>
  );
}
