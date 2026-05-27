import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../store/auth';
import LanguageToggle from './LanguageToggle';

export default function Header() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const user = useAuth((s) => s.user);
  const logout = useAuth((s) => s.logout);

  const onLogout = () => {
    logout();
    navigate('/');
  };

  const link = ({ isActive }) =>
    `px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors ${
      isActive ? 'bg-brand-50 text-brand-700' : 'text-slate-600 hover:bg-slate-100'
    }`;

  return (
    <header className="bg-white/80 backdrop-blur border-b border-slate-200 sticky top-0 z-30">
      <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between gap-2">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-400 to-brand-700 grid place-items-center text-white font-extrabold shadow-soft">
            S
          </div>
          <span className="font-extrabold text-lg text-ink">{t('brand.name')}</span>
        </Link>

        <nav className="flex items-center gap-1">
          {user ? (
            <>
              <NavLink to="/inbox" className={link}>
                {t('nav.inbox')}
              </NavLink>
              <NavLink to="/settings" className={link}>
                {t('nav.settings')}
              </NavLink>
              <LanguageToggle />
              <button onClick={onLogout} className="btn-ghost text-sm">
                {t('nav.logout')}
              </button>
            </>
          ) : (
            <>
              <LanguageToggle />
              <Link to="/login" className="btn-ghost text-sm">
                {t('nav.login')}
              </Link>
              <Link to="/register" className="btn-primary text-sm">
                {t('nav.register')}
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
