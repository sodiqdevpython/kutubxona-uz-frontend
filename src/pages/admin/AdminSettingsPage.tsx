import AdminShell from '../../components/admin/AdminShell';
import { apiOrigin } from '../../lib/config';

/**
 * Sozlamalar — Figma'dagi «Sozlamalar» freymi keyingi bosqichda;
 * hozircha Django admin'dagi tegishli bo'limlarga havolalar.
 */
export default function AdminSettingsPage() {
  const base = apiOrigin();
  const links = [
    { t: 'Jurnal va sonlar',        s: 'ISSN, DOI prefiksi, sonlar va muqovalar',      to: `${base}/admin/journals/` },
    { t: 'Yo‘nalishlar',            s: 'Maqola kategoriyalari',                        to: `${base}/admin/articles/category/` },
    { t: 'Hamkor API',              s: 'Tashqi xizmatlar uchun login/parol va tokenlar', to: `${base}/admin/partner/partnerclient/` },
    { t: 'Foydalanuvchilar',        s: 'Tahririyat a’zolari va ruxsatlar',              to: `${base}/admin/auth/user/` },
    { t: 'Mualliflarni birlashtirish', s: 'Kirill/lotin dublikat profillar',            to: `${base}/admin/authors/author/` },
  ];
  return (
    <AdminShell active="settings" crumb="Sozlamalar">
      <div className="adm-head">
        <div>
          <h1 className="adm-h1">Sozlamalar</h1>
          <p className="adm-sub">Tizim sozlamalari hozircha Django admin orqali boshqariladi. Bu sahifa dizayni keyingi bosqichda.</p>
        </div>
      </div>
      <div className="stat-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}>
        {links.map(l => (
          <a key={l.t} href={l.to} target="_blank" rel="noreferrer" className="stat-card" style={{ textDecoration: 'none' }}>
            <div className="acard-title" style={{ marginBottom: 6 }}>{l.t}</div>
            <div className="stat-lbl">{l.s}</div>
            <div className="acard-meta" style={{ marginTop: 12, color: 'var(--accent)' }}>Django admin ↗</div>
          </a>
        ))}
      </div>
    </AdminShell>
  );
}
