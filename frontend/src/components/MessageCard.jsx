import { useTranslation } from 'react-i18next';

function formatDate(iso, lang) {
  const d = new Date(iso);
  return d.toLocaleString(lang === 'ar' ? 'ar-EG' : 'en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

export default function MessageCard({ message, onFavorite, onDelete, onMarkRead }) {
  const { t, i18n } = useTranslation();

  const handleClick = () => {
    if (!message.is_read) onMarkRead(message.id);
  };

  return (
    <article
      onClick={handleClick}
      className={`card p-5 ${!message.is_read ? 'ring-2 ring-brand-200' : ''}`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="text-xs text-slate-500">
          {formatDate(message.created_at, i18n.language)}
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onFavorite(message.id);
            }}
            className="p-1.5 rounded-lg hover:bg-slate-100"
            aria-label={message.is_favorite ? t('inbox.unfavorite') : t('inbox.favorite')}
            title={message.is_favorite ? t('inbox.unfavorite') : t('inbox.favorite')}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill={message.is_favorite ? '#f59e0b' : 'none'} stroke={message.is_favorite ? '#f59e0b' : '#64748b'} strokeWidth="2">
              <polygon points="12 2 15 9 22 9.3 17 14 18.5 21 12 17.3 5.5 21 7 14 2 9.3 9 9 12 2" />
            </svg>
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (confirm(t('inbox.confirmDelete'))) onDelete(message.id);
            }}
            className="p-1.5 rounded-lg hover:bg-red-50"
            aria-label={t('inbox.delete')}
            title={t('inbox.delete')}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2">
              <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
            </svg>
          </button>
        </div>
      </div>
      <p className="mt-3 text-slate-800 whitespace-pre-wrap leading-relaxed">{message.body}</p>
    </article>
  );
}
