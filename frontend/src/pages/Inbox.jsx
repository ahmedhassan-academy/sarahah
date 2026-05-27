import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import api from '../api/client';
import { useAuth } from '../store/auth';
import MessageCard from '../components/MessageCard';

export default function Inbox() {
  const { t } = useTranslation();
  const user = useAuth((s) => s.user);
  const [filter, setFilter] = useState('all');
  const [messages, setMessages] = useState([]);
  const [counts, setCounts] = useState({ total: 0, unread: 0, favorite: 0 });
  const [loading, setLoading] = useState(true);

  const load = async (f = filter) => {
    setLoading(true);
    try {
      const { data } = await api.get('/messages', { params: { filter: f } });
      setMessages(data.messages);
      setCounts(data.counts);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load(filter);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

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

  const link = `${window.location.origin}/${user?.username || ''}`;
  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(link);
      toast.success(t('inbox.copied'));
    } catch {
      const el = document.createElement('input');
      el.value = link;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      el.remove();
      toast.success(t('inbox.copied'));
    }
  };

  const tab = (key, label, count) => (
    <button
      key={key}
      onClick={() => setFilter(key)}
      className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
        filter === key ? 'bg-brand-600 text-white' : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
      }`}
    >
      {label}
      {count !== undefined && (
        <span className={`ms-2 rounded-full px-2 py-0.5 text-xs ${
          filter === key ? 'bg-brand-700 text-white' : 'bg-slate-100 text-slate-600'
        }`}>{count}</span>
      )}
    </button>
  );

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-extrabold text-slate-900">{t('inbox.title')}</h1>

      <div className="mt-5 card p-4 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
        <div className="text-sm text-slate-600 truncate">
          <span className="font-semibold">{t('inbox.yourLink')}</span>{' '}
          <span className="text-brand-700 break-all">{link}</span>
        </div>
        <button onClick={copyLink} className="btn-primary text-sm whitespace-nowrap">
          {t('inbox.shareLink')}
        </button>
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        {tab('all', t('inbox.filterAll'), counts.total)}
        {tab('unread', t('inbox.filterUnread'), counts.unread)}
        {tab('favorite', t('inbox.filterFavorite'), counts.favorite)}
      </div>

      <div className="mt-5 space-y-3">
        {loading ? (
          <div className="text-center text-slate-500 py-12">{t('common.loading')}</div>
        ) : messages.length === 0 ? (
          <div className="card p-10 text-center text-slate-500">{t('inbox.empty')}</div>
        ) : (
          messages.map((m) => (
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
    </div>
  );
}
