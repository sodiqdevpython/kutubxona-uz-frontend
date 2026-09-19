import { Link, useLocation } from 'react-router-dom';
import AdminShell from '../../components/admin/AdminShell';

/** Admin ichidagi noma'lum manzil — qobiq saqlanadi, 404 kartasi. */
export default function AdminNotFoundPage() {
  const { pathname } = useLocation();
  return (
    <AdminShell active="dashboard" crumb="404">
      <div className="acard" style={{ maxWidth: 620, padding: '34px 36px' }}>
        <div className="adm-eyebrow">404</div>
        <h1 className="adm-h1" style={{ fontSize: 30 }}>Bunday sahifa yo‘q</h1>
        <p className="adm-sub" style={{ marginBottom: 22 }}>
          <code style={{ fontFamily: 'var(--mono)', fontSize: 13, background: 'var(--grey-3)', padding: '2px 6px', borderRadius: 4 }}>{pathname}</code> admin panelida mavjud emas.
        </p>
        <div className="adm-actions">
          <Link to="/admin" className="ab primary">Asosiy panel</Link>
          <Link to="/admin/submissions" className="ab">Kelgan maqolalar</Link>
        </div>
      </div>
    </AdminShell>
  );
}
