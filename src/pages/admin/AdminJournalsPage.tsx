import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AdminShell from '../../components/admin/AdminShell';
import ParsePanel from '../../components/admin/ParsePanel';
import { NewIssueModal } from '../../components/admin/IssueModals';
import { adminApi, type AdminIssue } from '../../lib/admin-api';
import { fmtBytes } from '../../lib/admin-dashboard';

/**
 * Jurnal sonlari — Figma «Jurnal sonlari»: 4 statistika, yillar bo'yicha
 * kartalar (muqova, holat, PDF, ko'rishlar; Tahrirlash | PDF'dan ajratish).
 */
export default function AdminJournalsPage() {
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

  const years = useMemo(() => {
    const m = new Map<number, AdminIssue[]>();
    for (const i of issues) m.set(i.year, [...(m.get(i.year) ?? []), i]);
    return [...m.entries()].sort((a, b) => b[0] - a[0]).map(([y, list]) => [y, list.sort((a, b) => b.number - a.number)] as const);
  }, [issues]);

  return (
    <AdminShell active="journals" crumb="Jurnal sonlari">
      <div className="adm-head">
        <div>
          <h1 className="adm-h1">Jurnal sonlari</h1>
          <p className="adm-sub">Son yaratish, muqova va PDF yuklash. Yuklangan PDF’dan maqolalar avtomatik ajratiladi.</p>
        </div>
        <div className="adm-actions"><button className="ab lg primary" onClick={() => setCreating(true)}>+ Yangi son</button></div>
      </div>

      <div className="stat-grid">
        {[['Jami son', stats.total], ['Nashr etilgan', stats.published], ['Qoralama', stats.drafts], ['Jami maqola', stats.articles]].map(([k, v]) => (
          <div key={k} className="stat-card"><div className="stat-val" style={{ margin: '0 0 6px' }}>{v}</div><div className="stat-lbl">{k}</div></div>
        ))}
      </div>

      {loading && <div className="sub-empty">Yuklanmoqda…</div>}
      {!loading && issues.length === 0 && <div className="sub-empty">Hali son yaratilmagan — «+ Yangi son» bosing.</div>}

      {years.map(([year, list]) => (
        <section key={year}>
          <div className="jr-year">
            <span className="y">{year}</span><span className="rule" />
            <span className="m">{list.length} son · {list.reduce((s, i) => s + i.article_count, 0)} maqola</span>
          </div>
          <div className="jr-grid">
            {list.map(i => (
              <article key={i.id} className="jr-card">
                <div className="jr-body">
                  <Link to={`/admin/journals/${i.id}`} className={`jr-cover${i.cover_image_url ? '' : ' ph'}`}>
                    {i.cover_image_url ? <img src={i.cover_image_url} alt="" /> : <><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><rect x="4" y="4" width="16" height="16" rx="2"/><circle cx="9" cy="9" r="1.6"/><path d="M20 16l-5-5-7 7"/></svg><span>Muqova</span></>}
                  </Link>
                  <div style={{ minWidth: 0 }}>
                    <span className={`chip-m ${i.is_upcoming ? 'accent' : 'green'}`}>{i.is_upcoming ? 'Qoralama' : 'Nashr etilgan'}</span>
                    <div className="jr-title">{i.year} · № {i.number}</div>
                    <div className="jr-sub">{i.season ? i.season.charAt(0).toUpperCase() + i.season.slice(1) : '—'} · {i.article_count} maqola{i.is_upcoming ? ' biriktirilgan' : ''}</div>
                    <div className={`jr-pdf${i.pdf_file_url ? '' : ' no'}`}>{i.pdf_file_url ? `PDF · ${fmtBytes(i.pdf_size)}` : 'PDF yuklanmagan'}</div>
                    <div className="jr-views">{i.is_upcoming ? 'saytda ko‘rinmaydi' : `${i.views.toLocaleString('ru-RU')} ko‘rish`}</div>
                  </div>
                </div>
                <div className="jr-foot">
                  <Link to={`/admin/journals/${i.id}`}>Tahrirlash</Link>
                  <button className="accent" onClick={() => setParsing(i)}>PDF’dan ajratish</button>
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
