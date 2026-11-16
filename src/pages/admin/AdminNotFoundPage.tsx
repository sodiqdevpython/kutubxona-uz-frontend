import { Link, useLocation } from 'react-router-dom';
import AdminShell from '../../components/admin/AdminShell';
import { useI18n } from '../../lib/i18n';

/** Admin ichidagi noma'lum manzil — qobiq saqlanadi, 404 kartasi. */
export default function AdminNotFoundPage() {
  const { pathname } = useLocation();
  const { t } = useI18n();
  const [before, after] = t('adm.nf.text').split('{path}');
  return (
    <AdminShell active="dashboard" crumb="404">
      <div className="acard" style={{ maxWidth: 620, padding: '34px 36px' }}>
        <div className="adm-eyebrow">404</div>
        <h1 className="adm-h1" style={{ fontSize: 30 }}>{t('adm.nf.title')}</h1>
        <p className="adm-sub" style={{ marginBottom: 22 }}>
          {before}<code style={{ fontFamily: 'var(--mono)', fontSize: 13, background: 'var(--grey-3)', padding: '2px 6px', borderRadius: 4 }}>{pathname}</code>{after}
        </p>
        <div className="adm-actions">
          <Link to="/admin" className="ab primary">{t('nav.admin.dashboard')}</Link>
          <Link to="/admin/submissions" className="ab">{t('nav.admin.submissions')}</Link>
        </div>
      </div>
    </AdminShell>
  );
}
