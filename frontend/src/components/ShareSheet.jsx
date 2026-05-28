import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';

function qrUrl(link, size = 280) {
  return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(link)}`;
}

const socials = [
  {
    key: 'whatsapp',
    color: 'bg-[#25D366]',
    href: (link, text) => `https://wa.me/?text=${encodeURIComponent(`${text} ${link}`)}`,
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
        <path d="M.057 24l1.687-6.163a11.867 11.867 0 0 1-1.587-5.946C.16 5.335 5.495 0 12.05 0a11.82 11.82 0 0 1 8.413 3.488 11.82 11.82 0 0 1 3.48 8.414c-.003 6.557-5.338 11.892-11.893 11.892a11.9 11.9 0 0 1-5.688-1.448L.057 24zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413z" />
      </svg>
    ),
  },
  {
    key: 'twitter',
    color: 'bg-black',
    href: (link, text) => `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(link)}`,
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24h-6.66l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
      </svg>
    ),
  },
  {
    key: 'facebook',
    color: 'bg-[#1877F2]',
    href: (link) => `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(link)}`,
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
        <path d="M9.101 23.691v-7.98H6.627v-3.667h2.474v-1.58c0-4.085 1.848-5.978 5.858-5.978.401 0 .955.042 1.468.103a8.68 8.68 0 0 1 1.141.195v3.325a8.623 8.623 0 0 0-.653-.036 26.805 26.805 0 0 0-.733-.009c-.707 0-1.259.096-1.675.309a1.686 1.686 0 0 0-.679.622c-.258.42-.374.995-.374 1.752v1.297h3.919l-.386 2.103-.287 1.564h-3.246v8.245C19.396 23.238 24 18.179 24 12.044c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.628 3.874 10.35 9.101 11.647Z" />
      </svg>
    ),
  },
  {
    key: 'telegram',
    color: 'bg-[#229ED9]',
    href: (link, text) => `https://t.me/share/url?url=${encodeURIComponent(link)}&text=${encodeURIComponent(text)}`,
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
        <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
      </svg>
    ),
  },
];

function SocialPanel({ link, onBack }) {
  const { t } = useTranslation();
  const text = t('share.title');
  return (
    <div className="px-2">
      <button
        onClick={onBack}
        className="mb-3 text-sm text-brand-700 font-semibold hover:underline flex items-center gap-1"
      >
        <span aria-hidden>‹</span> {t('share.close')}
      </button>
      <div className="text-sm font-semibold text-slate-700 mb-3">{t('share.shareOn')}</div>
      <div className="grid grid-cols-4 gap-3">
        {socials.map((s) => (
          <a
            key={s.key}
            href={s.href(link, text)}
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-col items-center gap-2 group"
          >
            <span className={`${s.color} text-white w-14 h-14 rounded-2xl grid place-items-center shadow-sm group-hover:scale-105 transition-transform`}>
              {s.icon}
            </span>
            <span className="text-xs text-slate-700">{t(`share.${s.key}`)}</span>
          </a>
        ))}
      </div>
    </div>
  );
}

function QrPanel({ link, onBack }) {
  const { t } = useTranslation();
  return (
    <div className="px-2 text-center">
      <button
        onClick={onBack}
        className="mb-3 text-sm text-brand-700 font-semibold hover:underline flex items-center gap-1"
      >
        <span aria-hidden>‹</span> {t('share.close')}
      </button>
      <div className="mt-1 p-3 inline-block bg-white rounded-2xl border border-slate-200">
        <img src={qrUrl(link, 280)} alt="QR" className="w-64 h-64 block" />
      </div>
      <div className="mt-3 text-xs text-slate-500 break-all" dir="ltr">{link}</div>
      <a
        href={qrUrl(link, 600)}
        download="sarahah-qr.png"
        target="_blank"
        rel="noopener noreferrer"
        className="btn-primary mt-4 text-sm inline-flex"
      >
        {t('share.downloadQr')}
      </a>
    </div>
  );
}

export default function ShareSheet({ open, onClose, link }) {
  const { t } = useTranslation();
  const [view, setView] = useState('menu');

  useEffect(() => {
    if (!open) return;
    setView('menu');
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open) return null;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(link);
      toast.success(t('share.copied'));
    } catch {
      const el = document.createElement('input');
      el.value = link;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      el.remove();
      toast.success(t('share.copied'));
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
        aria-hidden
      />
      <div className="relative w-full sm:max-w-md bg-white rounded-t-3xl sm:rounded-3xl shadow-xl p-5 pb-7 max-h-[85vh] overflow-y-auto animate-[slideUp_.25s_ease]">
        <div className="flex items-start justify-between gap-3">
          <div className="w-12 h-1.5 rounded-full bg-slate-200 mx-auto absolute start-1/2 -translate-x-1/2 top-2" aria-hidden />
          <button
            onClick={onClose}
            className="ms-auto p-1.5 rounded-full hover:bg-slate-100 text-slate-500"
            aria-label={t('share.close')}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>

        {view === 'menu' && (
          <>
            <p className="mt-2 text-center text-sm text-slate-700 leading-relaxed px-2">
              {t('share.title')}
            </p>

            <div className="mt-5 space-y-2">
              <button
                onClick={() => setView('social')}
                className="w-full flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 px-4 py-3.5 transition-colors text-start"
              >
                <span className="flex items-center gap-3">
                  <span className="w-9 h-9 rounded-lg bg-gradient-to-br from-pink-400 via-purple-500 to-orange-400 grid place-items-center text-white">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="3" width="18" height="18" rx="5" />
                      <circle cx="12" cy="12" r="4" />
                      <circle cx="17.5" cy="6.5" r="1.2" fill="currentColor" />
                    </svg>
                  </span>
                  <span className="font-semibold text-slate-800 text-sm">{t('share.socialMedia')}</span>
                </span>
                <span className="text-slate-400 text-xl leading-none">›</span>
              </button>

              <button
                onClick={() => setView('qr')}
                className="w-full flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 px-4 py-3.5 transition-colors text-start"
              >
                <span className="flex items-center gap-3">
                  <span className="w-9 h-9 rounded-lg bg-brand-50 text-brand-600 grid place-items-center">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="3" width="7" height="7" rx="1" />
                      <rect x="14" y="3" width="7" height="7" rx="1" />
                      <rect x="3" y="14" width="7" height="7" rx="1" />
                      <path d="M14 14h3v3h-3zM20 14v3M14 20h3M20 20h1" />
                    </svg>
                  </span>
                  <span className="font-semibold text-slate-800 text-sm">{t('share.qrCode')}</span>
                </span>
                <span className="text-slate-400 text-xl leading-none">›</span>
              </button>

              <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 flex items-center gap-2">
                <button
                  onClick={copy}
                  className="shrink-0 inline-flex items-center gap-1.5 text-brand-700 font-semibold text-sm px-2 py-1.5 rounded-lg hover:bg-brand-50"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="9" y="9" width="11" height="11" rx="2" />
                    <path d="M5 15V5a2 2 0 0 1 2-2h10" />
                  </svg>
                  {t('share.copy')}
                </button>
                <span className="flex-1 truncate text-sm text-slate-700" dir="ltr">{link}</span>
              </div>
            </div>
          </>
        )}

        {view === 'social' && <SocialPanel link={link} onBack={() => setView('menu')} />}
        {view === 'qr' && <QrPanel link={link} onBack={() => setView('menu')} />}
      </div>

      <style>{`
        @keyframes slideUp {
          from { transform: translateY(20px); opacity: 0.4; }
          to   { transform: translateY(0);    opacity: 1; }
        }
      `}</style>
    </div>
  );
}
