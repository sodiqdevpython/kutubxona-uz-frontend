import AdminShell from '../../components/admin/AdminShell';
import { apiOrigin } from '../../lib/config';
import { useI18n, type MsgKey } from '../../lib/i18n';

/**
 * Sozlamalar — Figma'dagi «Sozlamalar» freymi keyingi bosqichda;
 * hozircha Django admin'dagi tegishli bo'limlarga havolalar.
 */
export default function AdminSettingsPage() {
  const { t } = useI18n();
  const base = apiOrigin();
  const links: { t: MsgKey; s: MsgKey; to: string }[] = [
    { t: 'adm.set.journals',   s: 'adm.set.journals_s',   to: `${base}/admin/journals/` },
    { t: 'adm.set.categories', s: 'adm.set.categories_s', to: `${base}/admin/articles/category/` },
    { t: 'adm.set.partner',    s: 'adm.set.partner_s',    to: `${base}/admin/partner/partnerclient/` },
    { t: 'adm.set.users',      s: 'adm.set.users_s',      to: `${base}/admin/auth/user/` },
    { t: 'adm.set.merge',      s: 'adm.set.merge_s',      to: `${base}/admin/authors/author/` },
  ];
  return (
    <AdminShell active="settings" crumb={t('adm.set.title')}>
      <div className="adm-head">
        <div>
          <h1 className="adm-h1">{t('adm.set.title')}</h1>
          <p className="adm-sub">{t('adm.set.sub')}</p>
        </div>
      </div>
      <div className="stat-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}>
        {links.map(l => (
          <a key={l.t} href={l.to} target="_blank" rel="noreferrer" className="stat-card" style={{ textDecoration: 'none' }}>
            <div className="acard-title" style={{ marginBottom: 6 }}>{t(l.t)}</div>
            <div className="stat-lbl">{t(l.s)}</div>
            <div className="acard-meta" style={{ marginTop: 12, color: 'var(--accent)' }}>{t('adm.set.django')}</div>
          </a>
        ))}
      </div>
    </AdminShell>
  );
}
