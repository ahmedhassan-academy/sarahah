import { Outlet } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import LanguageToggle from './LanguageToggle';
import Footer from './Footer';

export default function MinimalLayout() {
  const { t } = useTranslation();
  const rootHost =
    typeof window !== 'undefined' && window.location.host.endsWith('saraha.pro')
      ? 'https://saraha.pro'
      : '/';

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-white/80 backdrop-blur border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between gap-2">
          <a href={rootHost} className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-400 to-brand-700 grid place-items-center text-white font-extrabold shadow-soft">
              S
            </div>
            <span className="font-extrabold text-lg text-ink">{t('brand.name')}</span>
          </a>
          <div className="flex items-center gap-1">
            <LanguageToggle />
            <a href={`${rootHost === '/' ? '' : rootHost}/register`} className="btn-primary text-sm">
              {t('nav.register')}
            </a>
          </div>
        </div>
      </header>
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
