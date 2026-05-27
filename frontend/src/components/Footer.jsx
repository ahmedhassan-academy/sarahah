import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

function Icon({ d }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d={d} />
    </svg>
  );
}

const social = [
  {
    href: 'https://instagram.com',
    label: 'Instagram',
    d: 'M12 2.2c3.2 0 3.6.01 4.85.07 1.17.05 1.8.25 2.22.41.56.22.96.48 1.38.9.42.42.68.82.9 1.38.16.42.36 1.05.41 2.22.06 1.26.07 1.65.07 4.85 0 3.2-.01 3.6-.07 4.85-.05 1.17-.25 1.8-.41 2.22a3.7 3.7 0 0 1-.9 1.38c-.42.42-.82.68-1.38.9-.42.16-1.05.36-2.22.41-1.26.06-1.65.07-4.85.07-3.2 0-3.6-.01-4.85-.07-1.17-.05-1.8-.25-2.22-.41a3.7 3.7 0 0 1-1.38-.9 3.7 3.7 0 0 1-.9-1.38c-.16-.42-.36-1.05-.41-2.22C2.21 15.6 2.2 15.2 2.2 12c0-3.2.01-3.6.07-4.85.05-1.17.25-1.8.41-2.22.22-.56.48-.96.9-1.38.42-.42.82-.68 1.38-.9.42-.16 1.05-.36 2.22-.41C8.4 2.21 8.8 2.2 12 2.2zm0 5.4a4.4 4.4 0 1 0 0 8.8 4.4 4.4 0 0 0 0-8.8zm0 7.26a2.86 2.86 0 1 1 0-5.72 2.86 2.86 0 0 1 0 5.72zm5.6-7.43a1.03 1.03 0 1 1-2.06 0 1.03 1.03 0 0 1 2.06 0z',
  },
  {
    href: 'https://facebook.com',
    label: 'Facebook',
    d: 'M22 12a10 10 0 1 0-11.56 9.88v-6.99H7.9V12h2.54V9.8c0-2.51 1.49-3.9 3.78-3.9 1.1 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.77-1.63 1.56V12h2.77l-.44 2.89h-2.33v6.99A10 10 0 0 0 22 12z',
  },
  {
    href: 'https://x.com',
    label: 'X',
    d: 'M18.244 2H21l-6.52 7.45L22 22h-6.79l-4.69-6.13L4.95 22H2.19l6.98-7.98L2 2h6.92l4.24 5.6L18.24 2zm-2.38 18h1.5L7.2 4H5.6l10.27 16z',
  },
];

export default function Footer() {
  const { t } = useTranslation();
  return (
    <footer className="mt-16 bg-ink text-white/90">
      <div className="max-w-5xl mx-auto px-4 py-8">
        <ul className="flex items-center justify-center gap-6 mb-4">
          {social.map((s) => (
            <li key={s.href}>
              <a
                href={s.href}
                aria-label={s.label}
                rel="noopener noreferrer"
                target="_blank"
                className="inline-flex w-9 h-9 items-center justify-center rounded-full text-white/85 hover:text-white hover:bg-white/10 transition"
              >
                <Icon d={s.d} />
              </a>
            </li>
          ))}
        </ul>
        <ul className="flex items-center justify-center gap-5 text-sm">
          <li><Link to="/terms" className="text-white/75 hover:text-white">{t('nav.terms')}</Link></li>
          <li><Link to="/privacy" className="text-white/75 hover:text-white">{t('nav.privacy')}</Link></li>
          <li><Link to="/help" className="text-white/75 hover:text-white">{t('nav.help')}</Link></li>
        </ul>
        <div className="mt-4 text-center text-xs text-white/55">
          © {new Date().getFullYear()} {t('brand.name')}
        </div>
      </div>
    </footer>
  );
}
