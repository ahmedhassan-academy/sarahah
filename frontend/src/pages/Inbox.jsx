import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import api from '../api/client';
import { useAuth } from '../store/auth';
import MessageCard from '../components/MessageCard';
import ShareSheet from '../components/ShareSheet';
import { profileUrl } from '../lib/host';

const TABS = ['inbox', 'sent', 'favorites', 'public'];

export default function Inbox() {
  const { t } = useTranslation();
  const user = useAuth((s) => s.user);
  const [tab, setTab] = useState('inbox');
  const [messages, setMessages] = useState([]);
  const [counts, setCounts] = useState({ total: 0, unread: 0, favorite: 0 });
  const [loading, setLoading] = useState(true);
  const [sortNewestFirst, setSortNewestFirst] = useState(true);
  const [shareOpen, setShareOpen] = useState(false);

  const filterParam = tab === 'favorites' ? 'favorite' : 'all';

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/messages', { params: { filter: filterParam } });
      setMessages(data.messages);
      setCounts(data.counts);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (tab === 'inbox' || tab === 'favorites') load();
    else setLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  const sortedMessages = useMemo(() => {
    const arr = [...messages];
    arr.sort((a, b) => {
      const ta = new Date(a.created_at).getTime();
      const tb = new Date(b.created_at).getTime();
      return sortNewestFirst ? tb - ta : ta - tb;
    });
    return arr;
  }, [messages, sortNewestFirst]);

  const onFavorite = async (id) => {
    try {
      const { data } = await api.patch(`/messages/${id}/favorite`);
      setMessages((ms) => ms.map((m) => (m.id === id ? { ...m, is_favorite: data.is_favorite } : m)));
      setCounts((c) => ({ ...c, favorite: c.favorite + (data.is_favorite ? 1 : -1) }));
    } catch {
      toast.error(t('errors.server_error'));
    }
  };

  const onDelete = async (id) => {
    try {
      await api.delete(`/messages/${id}`);
      setMessages((ms) => ms.filter((m) => m.id !== id));
      setCounts((c) => ({
        ...c,
        total: c.total - 1,
        unread: c.unread - (messages.find((m) => m.id === id && !m.is_read) ? 1 : 0),
        favorite: c.favorite - (messages.find((m) => m.id === id && m.is_favorite) ? 1 : 0),
      }));
    } catch {
      toast.error(t('errors.server_error'));
    }
  };

  const onMarkRead = async (id) => {
    setMessages((ms) => ms.map((m) => (m.id === id ? { ...m, is_read: true } : m)));
    setCounts((c) => ({ ...c, unread: Math.max(0, c.unread - 1) }));
    try {
      await api.patch(`/messages/${id}/read`);
    } catch {
      // silent
    }
  };

  const link = profileUrl(user);
  const displayName = user?.display_name || user?.username || '';
  const avatar = user?.avatar_url;

  const stats = [
    { key: 'statFollowing', value: 0 },
    { key: 'statFollowers', value: 0 },
    { key: 'statPosts', value: 0 },
    { key: 'statMessages', value: counts.total },
  ];

  const sectionTitle = {
    inbox: t('inbox.sectionInbox'),
    sent: t('inbox.sectionSent'),
    favorites: t('inbox.sectionFavorites'),
    public: t('inbox.sectionPublic'),
  }[tab];

  const isReadOnlyTab = tab === 'sent' || tab === 'public';

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 sm:py-8">
      <div className="card overflow-hidden">
        <div className="h-1.5 bg-gradient-to-r from-brand-400 to-brand-600" />
        <div className="px-5 sm:px-8 pt-7 pb-5 text-center">
          <div className="mx-auto w-28 h-28 sm:w-32 sm:h-32 rounded-full overflow-hidden ring-4 ring-white shadow-md bg-gradient-to-br from-brand-400 to-brand-700 grid place-items-center text-white text-4xl font-extrabold">
            {avatar ? (
              <img src={avatar} alt={displayName} className="w-full h-full object-cover" />
            ) : (
              <span>{displayName.charAt(0).toUpperCase()}</span>
            )}
          </div>
          <h1 className="mt-4 text-2xl font-extrabold text-ink">{displayName}</h1>
          <button
            onClick={() => setShareOpen(true)}
            className="mt-1 text-sm text-ink hover:underline break-all"
            dir="ltr"
          >
            {link}
          </button>

          <div className="mt-5 grid grid-cols-4 gap-2 sm:gap-4">
            {stats.map((s) => (
              <div key={s.key} className="text-center">
                <div className="text-xs sm:text-sm text-ink-muted">{t(`inbox.${s.key}`)}</div>
                <div className="mt-1 text-lg sm:text-xl font-extrabold text-ink">{s.value}</div>
              </div>
            ))}
          </div>

          <div className="mt-6 grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => (window.location.href = '/help')}
              className="col-span-1 inline-flex items-center justify-center gap-1.5 rounded-xl bg-accent-yellow text-accent-yellowText font-semibold py-2.5 text-sm hover:brightness-95 transition"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <path d="M9.5 9a2.5 2.5 0 1 1 4.4 1.6c-.7.8-1.4 1.2-1.4 2.4M12 17h.01" />
              </svg>
              {t('inbox.help')}
            </button>
            <button
              type="button"
              onClick={() => setShareOpen(true)}
              className="col-span-2 inline-flex items-center justify-center gap-2 rounded-xl bg-accent-blue text-accent-blueText font-semibold py-2.5 text-sm hover:brightness-95 transition"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="18" cy="5" r="3" />
                <circle cx="6" cy="12" r="3" />
                <circle cx="18" cy="19" r="3" />
                <path d="M8.6 13.5l6.8 4M15.4 6.5l-6.8 4" />
              </svg>
              {t('inbox.share')}
            </button>
          </div>
        </div>

        <div className="px-2 sm:px-4 border-t border-slate-100">
          <div className="grid grid-cols-4 gap-1 p-1">
            {TABS.map((k) => (
              <button
                key={k}
                onClick={() => setTab(k)}
                className={`py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                  tab === k
                    ? 'bg-brand-500 text-white shadow-soft'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                {t(`inbox.tab${k.charAt(0).toUpperCase() + k.slice(1)}`)}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-5 flex items-center justify-between">
        <h2 className="text-base font-bold text-slate-700">{sectionTitle}</h2>
        <button
          onClick={() => setSortNewestFirst((v) => !v)}
          className="p-2 rounded-lg hover:bg-slate-100 text-slate-500"
          aria-label={sortNewestFirst ? t('inbox.sortNewest') : t('inbox.sortOldest')}
          title={sortNewestFirst ? t('inbox.sortNewest') : t('inbox.sortOldest')}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 6h18M6 12h12M10 18h4" />
          </svg>
        </button>
      </div>

      <div className="mt-3 space-y-3">
        {isReadOnlyTab ? (
          <div className="card p-10 text-center text-slate-500">
            <div className="text-3xl mb-2">🚧</div>
            {t('inbox.comingSoon')}
          </div>
        ) : loading ? (
          <div className="text-center text-slate-500 py-12">{t('common.loading')}</div>
        ) : sortedMessages.length === 0 ? (
          <div className="card p-10 text-center text-slate-500">{t('inbox.empty')}</div>
        ) : (
          sortedMessages.map((m) => (
            <MessageCard
              key={m.id}
              message={m}
              onFavorite={onFavorite}
              onDelete={onDelete}
              onMarkRead={onMarkRead}
            />
          ))
        )}
      </div>

      <ShareSheet open={shareOpen} onClose={() => setShareOpen(false)} link={link} />
    </div>
  );
}
