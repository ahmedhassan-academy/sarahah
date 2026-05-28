import { Outlet } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import LanguageToggle from './LanguageToggle';
import Footer from './Footer';
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

function IconLink({ href, label, children }) {
  return (
    <a
      href={href}
      className="w-11 h-11 grid place-items-center rounded-xl bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors"
      aria-label={label}
      title={label}
    >
      {children}
    </a>
  );
}

export default function MinimalLayout() {
  const { t } = useTranslation();
  const user = useAuth((s) => s.user);
  const rootHost =
    typeof window !== 'undefined' && window.location.host.endsWith('saraha.pro')
      ? 'https://saraha.pro'
      : '';
  const homeHref = rootHost || '/';
  const displayName = user?.display_name || user?.username || '';
  const avatarUrl = user?.avatar_url;

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="w-full px-4 sm:px-6 h-14 flex items-center justify-between gap-2">
          <a href={homeHref} className="text-brand-500" aria-label={t('brand.name')}>
            <InfinityLogo className="w-12 h-6" />
          </a>

          {user ? (
            <div className="flex items-center gap-2">
              <IconLink href={`${rootHost}/inbox`} label={t('nav.inbox')}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
              </IconLink>

              <IconLink href={`${rootHost}/settings`} label={t('nav.settings')}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="3" />
                  <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
                </svg>
              </IconLink>

              <IconLink href={`${rootHost}/inbox`} label={t('nav.inbox')}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
                  <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
                </svg>
              </IconLink>

              <a
                href={`${rootHost}/settings`}
                className="w-11 h-11 rounded-full overflow-hidden bg-gradient-to-br from-brand-400 to-brand-700 grid place-items-center text-white font-extrabold shadow-soft ring-1 ring-slate-200"
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
              </a>
            </div>
          ) : (
            <div className="flex items-center gap-1">
              <LanguageToggle />
              <a href={`${rootHost}/register`} className="btn-primary text-sm">
                {t('nav.register')}
              </a>
            </div>
          )}
        </div>
      </header>
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
