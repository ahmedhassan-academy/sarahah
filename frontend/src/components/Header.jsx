import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../store/auth';

function InfinityLogo({ className = '' }) {
  return (
    <svg viewBox="0 0 64 32" className={className} aria-hidden="true">
      <path
        d="M 32 16 C 24 4 8 4 6 16 C 4 28 24 28 32 16 C 40 4 60 4 58 16 C 56 28 40 28 34 22"
        fill="none"
        stroke="currentColor"
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconButton({ to, active, label, children }) {
  const base =
    'w-11 h-11 grid place-items-center rounded-xl transition-colors';
  const cls = active
    ? `${base} bg-brand-50 text-brand-600`
    : `${base} bg-slate-100 text-slate-600 hover:bg-slate-200`;
  return (
    <Link to={to} className={cls} aria-label={label} title={label}>
      {children}
    </Link>
  );
}

export default function Header() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const user = useAuth((s) => s.user);
  const logout = useAuth((s) => s.logout);

  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const onClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const onLogout = () => {
    setMenuOpen(false);
    logout();
    navigate('/');
  };

  const toggleLang = () => {
    i18n.changeLanguage(i18n.language === 'ar' ? 'en' : 'ar');
  };

  const onInbox = location.pathname.startsWith('/inbox');
  const onSettings = location.pathname.startsWith('/settings');

  const displayName = user?.display_name || user?.username || '';
  const avatarUrl = user?.avatar_url;

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
      <div className="w-full px-4 sm:px-6 h-14 flex items-center justify-between gap-2">
        <Link to="/" className="text-brand-500" aria-label={t('brand.name')}>
          <InfinityLogo className="w-12 h-6" />
        </Link>

        {user ? (
          <div className="flex items-center gap-2">
            <IconButton to="/inbox" active={onInbox} label={t('nav.inbox')}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
            </IconButton>

            <IconButton to="/settings" active={onSettings} label={t('nav.settings')}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="3" />
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
              </svg>
            </IconButton>

            <IconButton to="/inbox" label={t('inbox.filterUnread')}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
                <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
              </svg>
            </IconButton>

            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setMenuOpen((v) => !v)}
                className="w-11 h-11 rounded-xl overflow-hidden bg-gradient-to-br from-brand-400 to-brand-700 grid place-items-center text-white font-extrabold shadow-soft ring-1 ring-slate-200"
                aria-label={displayName}
                title={displayName}
              >
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt={displayName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-base">
                    {displayName.charAt(0).toUpperCase()}
                  </span>
                )}
              </button>

              {menuOpen && (
                <div className="absolute top-12 end-0 min-w-[180px] card p-1 shadow-lg z-40">
                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      navigate('/settings');
                    }}
                    className="w-full text-start px-3 py-2 rounded-lg text-sm font-semibold text-ink hover:bg-slate-100"
                  >
                    {t('nav.settings')}
                  </button>
                  {user.is_admin && (
                    <button
                      onClick={() => {
                        setMenuOpen(false);
                        navigate('/admin');
                      }}
                      className="w-full text-start px-3 py-2 rounded-lg text-sm font-semibold text-ink hover:bg-slate-100"
                    >
                      {t('nav.admin')}
                    </button>
                  )}
                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      toggleLang();
                    }}
                    className="w-full text-start px-3 py-2 rounded-lg text-sm font-semibold text-ink hover:bg-slate-100"
                  >
                    {i18n.language === 'ar' ? 'English' : 'العربية'}
                  </button>
                  <div className="my-1 h-px bg-slate-100" />
                  <button
                    onClick={onLogout}
                    className="w-full text-start px-3 py-2 rounded-lg text-sm font-semibold text-red-600 hover:bg-red-50"
                  >
                    {t('nav.logout')}
                  </button>
                </div>
              )}
            </div>
          </div>
        ) : (
          <nav className="flex items-center gap-1">
            <button
              onClick={toggleLang}
              className="rounded-lg px-3 py-1.5 text-sm font-semibold text-slate-600 hover:bg-slate-100"
            >
              {i18n.language === 'ar' ? 'EN' : 'العربية'}
            </button>
            <Link to="/login" className="btn-ghost text-sm">
              {t('nav.login')}
            </Link>
            <Link to="/register" className="btn-primary text-sm">
              {t('nav.register')}
            </Link>
          </nav>
        )}
      </div>
    </header>
  );
}
