import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

function relativeTime(iso, t) {
  const now = Date.now();
  const then = new Date(iso).getTime();
  const diff = Math.max(0, now - then);
  const m = Math.floor(diff / 60000);
  if (m < 1) return t('time.justNow');
  if (m < 60) return t('time.minutesAgo', { n: m });
  const h = Math.floor(m / 60);
  if (h < 24) return t('time.hoursAgo', { n: h });
  const d = Math.floor(h / 24);
  if (d < 7) return t('time.daysAgo', { n: d });
  const w = Math.floor(d / 7);
  if (w < 5) return t('time.weeksAgo', { n: w });
  const mo = Math.floor(d / 30);
  if (mo < 12) return t('time.monthsAgo', { n: mo });
  const y = Math.floor(d / 365);
  return t('time.yearsAgo', { n: y });
}

export default function MessageCard({ message, onFavorite, onDelete, onMarkRead }) {
  const { t } = useTranslation();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    if (!menuOpen) return;
    const close = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [menuOpen]);

  const handleClick = () => {
    if (!message.is_read) onMarkRead(message.id);
  };

  return (
    <article
      onClick={handleClick}
      className={`card p-4 sm:p-5 cursor-pointer transition-shadow hover:shadow-md ${
        !message.is_read ? 'ring-1 ring-brand-200' : ''
      }`}
    >
      <div className="flex items-start gap-3">
        <div className="shrink-0 w-10 h-10 rounded-full bg-brand-100 grid place-items-center overflow-hidden">
          <img src="/logo.png" alt="" className="w-7 h-7 object-contain" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 text-xs text-ink-muted">
            <span className="font-semibold text-slate-700">{t('inbox.anonymous')}</span>
            <span className="text-slate-400">•</span>
            <span>{relativeTime(message.created_at, t)}</span>
          </div>
          <div className="mt-1 flex items-center gap-1.5 text-xs text-slate-500">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="4" y="11" width="16" height="10" rx="2" />
              <path d="M8 11V7a4 4 0 0 1 8 0v4" />
            </svg>
            <span>{t('inbox.privateMessage')}</span>
          </div>
        </div>

        <div className="flex items-center gap-0.5 shrink-0">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onFavorite(message.id);
            }}
            className="p-1.5 rounded-lg hover:bg-slate-100"
            aria-label={message.is_favorite ? t('inbox.unfavorite') : t('inbox.favorite')}
            title={message.is_favorite ? t('inbox.unfavorite') : t('inbox.favorite')}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill={message.is_favorite ? '#1ABC9C' : 'none'} stroke={message.is_favorite ? '#1ABC9C' : '#64748b'} strokeWidth="2" strokeLinejoin="round">
              <polygon points="12 2 15 9 22 9.3 17 14 18.5 21 12 17.3 5.5 21 7 14 2 9.3 9 9 12 2" />
            </svg>
          </button>
          <div className="relative" ref={menuRef}>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setMenuOpen((v) => !v);
              }}
              className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500"
              aria-label={t('inbox.options')}
              title={t('inbox.options')}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <circle cx="5" cy="12" r="1.8" />
                <circle cx="12" cy="12" r="1.8" />
                <circle cx="19" cy="12" r="1.8" />
              </svg>
            </button>
            {menuOpen && (
              <div className="absolute end-0 mt-1 w-40 rounded-xl bg-white shadow-lg border border-slate-200 z-10 overflow-hidden">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setMenuOpen(false);
                    if (confirm(t('inbox.confirmDelete'))) onDelete(message.id);
                  }}
                  className="w-full text-start px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
                  </svg>
                  {t('inbox.delete')}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <p className="mt-3 text-[15px] text-slate-800 whitespace-pre-wrap leading-relaxed break-words">
        {message.body}
      </p>

      <div className="mt-4 flex items-center justify-between">
        <button
          type="button"
          onClick={(e) => e.stopPropagation()}
          className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
          aria-label={t('inbox.reply')}
          title={t('inbox.reply')}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            <path d="M12 8v6M9 11h6" />
          </svg>
        </button>
        <button
          type="button"
          onClick={(e) => e.stopPropagation()}
          className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
          aria-label={t('inbox.react')}
          title={t('inbox.react')}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="9" />
            <path d="M8.5 14a4 4 0 0 0 7 0" />
            <path d="M9 9.5h.01M15 9.5h.01" />
          </svg>
        </button>
      </div>
    </article>
  );
}
