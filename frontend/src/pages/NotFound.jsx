import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export default function NotFound() {
  const { t } = useTranslation();
  return (
    <div className="max-w-md mx-auto px-4 py-20 text-center">
      <div className="text-6xl">🔍</div>
      <h1 className="mt-4 text-2xl font-extrabold text-slate-900">404</h1>
      <Link to="/" className="btn-primary mt-6">{t('profile.backHome')}</Link>
    </div>
  );
}
