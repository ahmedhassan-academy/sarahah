import { Navigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../store/auth';

export default function AdminRoute({ children }) {
  const { t } = useTranslation();
  const user = useAuth((s) => s.user);
  const loaded = useAuth((s) => s.loaded);
  const loc = useLocation();

  if (!loaded) {
    return <div className="py-24 text-center text-ink-muted">{t('common.loading')}</div>;
  }
  if (!user) {
    return <Navigate to="/login" state={{ from: loc.pathname }} replace />;
  }
  if (!user.is_admin) {
    return <Navigate to="/" replace />;
  }
  return children;
}
