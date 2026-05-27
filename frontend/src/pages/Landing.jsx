import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../store/auth';

export default function Landing() {
  const { t } = useTranslation();
  const user = useAuth((s) => s.user);

  return (
    <div>
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-brand-50 via-white to-white" />
        <div className="relative max-w-5xl mx-auto px-4 py-20 md:py-28 text-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-white border border-slate-200 px-3 py-1 text-xs font-semibold text-brand-700 shadow-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-brand-500" />
            {t('brand.tagline')}
          </div>
          <h1 className="mt-6 text-4xl md:text-6xl font-extrabold text-slate-900 leading-tight">
            {t('landing.heroTitle')}
          </h1>
          <p className="mt-5 text-lg text-slate-600 max-w-2xl mx-auto">
            {t('landing.heroSub')}
          </p>
          <div className="mt-8 flex items-center justify-center gap-3 flex-wrap">
            {user ? (
              <>
                <Link to="/inbox" className="btn-primary">
                  {t('nav.inbox')}
                </Link>
                <Link to={`/${user.username}`} className="btn-outline" dir="ltr">
                  @{user.username}
                </Link>
              </>
            ) : (
              <>
                <Link to="/register" className="btn-primary">
                  {t('landing.ctaSignup')}
                </Link>
                <Link to="/login" className="btn-outline">
                  {t('landing.ctaLogin')}
                </Link>
              </>
            )}
          </div>
        </div>
      </section>

      <section className="max-w-5xl mx-auto px-4 py-16">
        <h2 className="text-2xl md:text-3xl font-extrabold text-slate-900 text-center">
          {t('landing.howItWorksTitle')}
        </h2>
        <div className="mt-10 grid md:grid-cols-3 gap-4">
          {[1, 2, 3].map((n) => (
            <div key={n} className="card p-6">
              <div className="w-10 h-10 rounded-full bg-brand-100 text-brand-700 grid place-items-center font-bold">
                {n}
              </div>
              <h3 className="mt-4 font-bold text-lg text-slate-900">
                {t(`landing.step${n}Title`)}
              </h3>
              <p className="mt-2 text-slate-600 text-sm leading-relaxed">
                {t(`landing.step${n}Body`)}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="max-w-5xl mx-auto px-4 py-16">
        <h2 className="text-2xl md:text-3xl font-extrabold text-slate-900 text-center">
          {t('landing.featuresTitle')}
        </h2>
        <div className="mt-10 grid md:grid-cols-3 gap-4">
          {[
            { key: 'fAnon', icon: 'M12 2a5 5 0 0 0-5 5v3H5a2 2 0 0 0-2 2v9h18v-9a2 2 0 0 0-2-2h-2V7a5 5 0 0 0-5-5z' },
            { key: 'fFast', icon: 'M13 2L3 14h7l-1 8 10-12h-7l1-8z' },
            { key: 'fSafe', icon: 'M12 2l8 4v6c0 5-3.5 9-8 10-4.5-1-8-5-8-10V6l8-4z' },
          ].map((f) => (
            <div key={f.key} className="card p-6">
              <div className="w-11 h-11 rounded-xl bg-brand-600 text-white grid place-items-center">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d={f.icon} />
                </svg>
              </div>
              <h3 className="mt-4 font-bold text-lg text-slate-900">{t(`landing.${f.key}Title`)}</h3>
              <p className="mt-2 text-slate-600 text-sm leading-relaxed">
                {t(`landing.${f.key}Body`)}
              </p>
            </div>
          ))}
        </div>
      </section>

      {!user && (
        <section className="max-w-5xl mx-auto px-4 pb-16">
          <div className="rounded-2xl bg-gradient-to-br from-brand-600 to-brand-800 text-white p-8 md:p-12 text-center shadow-soft">
            <h3 className="text-2xl md:text-3xl font-extrabold">{t('landing.heroTitle')}</h3>
            <p className="mt-3 text-brand-100">{t('landing.heroSub')}</p>
            <Link
              to="/register"
              className="mt-6 inline-flex items-center justify-center rounded-xl bg-white text-brand-700 font-semibold px-5 py-3 hover:bg-brand-50"
            >
              {t('landing.ctaSignup')}
            </Link>
          </div>
        </section>
      )}
    </div>
  );
}
