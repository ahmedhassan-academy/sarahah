import { Navigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../store/auth';

export default function ProtectedRoute({ children }) {
  const { t } = useTranslation();
  const user = useAuth((s) => s.user);
  const loaded = useAuth((s) => s.loaded);
  const loc = useLocation();

  if (!loaded) {
    return (
      <div className="py-24 text-center text-slate-500">{t('common.loading')}</div>
    );
  }
  if (!user) {
    return <Navigate to="/login" state={{ from: loc.pathname }} replace />;
  }
  return children;
}
