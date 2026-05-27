import { useTranslation } from 'react-i18next';

export default function LanguageToggle() {
  const { i18n } = useTranslation();
  const toggle = () => i18n.changeLanguage(i18n.language === 'ar' ? 'en' : 'ar');
  return (
    <button
      onClick={toggle}
      className="rounded-lg px-3 py-1.5 text-sm font-semibold text-slate-600 hover:bg-slate-100"
      aria-label="toggle language"
    >
      {i18n.language === 'ar' ? 'EN' : 'العربية'}
    </button>
  );
}
