import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import api from '../api/client';
import { useAuth } from '../store/auth';
import SenderDetails from '../components/SenderDetails';

function StatCard({ label, value, tint = 'brand' }) {
  const tints = {
    brand: 'from-brand-50 to-white border-brand-100 text-brand-700',
    red: 'from-red-50 to-white border-red-100 text-red-700',
    amber: 'from-amber-50 to-white border-amber-100 text-amber-700',
    slate: 'from-slate-50 to-white border-slate-200 text-slate-700',
  };
  return (
    <div className={`card bg-gradient-to-br ${tints[tint]} p-5`}>
      <div className="text-xs font-semibold uppercase tracking-wide opacity-80">{label}</div>
      <div className="mt-1 text-3xl font-extrabold text-ink">{value ?? '—'}</div>
    </div>
  );
}

function formatDate(iso, lang) {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleString(lang === 'ar' ? 'ar-EG' : 'en-US', {
    year: 'numeric', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true,
  });
}

function Overview({ stats }) {
  const { t } = useTranslation();
  if (!stats) return <div className="text-ink-muted">{t('common.loading')}</div>;
  return (
    <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-3">
      <StatCard label={t('admin.statUsers')} value={stats.users_total} tint="brand" />
      <StatCard label={t('admin.statMessages')} value={stats.messages_total} tint="slate" />
      <StatCard label={t('admin.statBanned')} value={stats.users_banned} tint="red" />
      <StatCard label={t('admin.statAdmins')} value={stats.users_admin} tint="amber" />
      <StatCard label={`${t('admin.statRecent7d')} · ${t('admin.statUsers')}`} value={stats.users_last_7d} tint="brand" />
      <StatCard label={`${t('admin.statRecent7d')} · ${t('admin.statMessages')}`} value={stats.messages_last_7d} tint="slate" />
    </div>
  );
}

function UsersTab({ me }) {
  const { t, i18n } = useTranslation();
  const [q, setQ] = useState('');
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async (query = q) => {
    setLoading(true);
    try {
      const { data } = await api.get('/admin/users', { params: { q: query, limit: 100 } });
      setUsers(data.users);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const id = setTimeout(load, 250);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  const ban = async (id) => {
    if (!confirm(t('admin.confirmBan'))) return;
    try {
      await api.patch(`/admin/users/${id}/ban`);
      setUsers((us) => us.map((u) => (u.id === id ? { ...u, is_banned: true, banned_at: new Date().toISOString() } : u)));
    } catch { toast.error(t('errors.server_error')); }
  };
  const unban = async (id) => {
    if (!confirm(t('admin.confirmUnban'))) return;
    try {
      await api.patch(`/admin/users/${id}/unban`);
      setUsers((us) => us.map((u) => (u.id === id ? { ...u, is_banned: false, banned_at: null } : u)));
    } catch { toast.error(t('errors.server_error')); }
  };
  const setAdmin = async (id, value) => {
    try {
      await api.patch(`/admin/users/${id}/admin`, { is_admin: value });
      setUsers((us) => us.map((u) => (u.id === id ? { ...u, is_admin: value } : u)));
    } catch { toast.error(t('errors.server_error')); }
  };

  return (
    <div>
      <input
        className="input mb-4"
        placeholder={t('admin.searchUsers')}
        value={q}
        onChange={(e) => setQ(e.target.value)}
      />
      {loading ? (
        <div className="text-center text-ink-muted py-10">{t('common.loading')}</div>
      ) : users.length === 0 ? (
        <div className="text-center text-ink-muted py-10">{t('admin.noResults')}</div>
      ) : (
        <div className="space-y-2">
          {users.map((u) => (
            <div key={u.id} className="card p-4 flex flex-wrap items-center gap-3 justify-between">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-bold text-ink" dir="ltr">@{u.username}</span>
                  {u.is_admin && (
                    <span className="text-xs font-semibold rounded-full bg-amber-100 text-amber-800 px-2 py-0.5">
                      {t('admin.adminBadge')}
                    </span>
                  )}
                  {u.is_banned && (
                    <span className="text-xs font-semibold rounded-full bg-red-100 text-red-700 px-2 py-0.5">
                      {t('admin.banned')}
                    </span>
                  )}
                </div>
                <div className="mt-1 text-xs text-ink-muted truncate" dir="ltr">{u.email}</div>
                <div className="mt-1 text-xs text-ink-muted">
                  {t('admin.joined')} {formatDate(u.created_at, i18n.language)}
                  {' · '}{t('admin.received')}: {u.msgs_received}
                  {' · '}{t('admin.sent')}: {u.msgs_sent}
                </div>
              </div>
              <div className="flex items-center gap-2">
                {u.id !== me.id && (
                  u.is_banned ? (
                    <button onClick={() => unban(u.id)} className="btn-outline text-xs">
                      {t('admin.unban')}
                    </button>
                  ) : (
                    <button onClick={() => ban(u.id)} className="btn text-xs bg-red-600 text-white hover:bg-red-700">
                      {t('admin.ban')}
                    </button>
                  )
                )}
                {u.id !== me.id && (
                  <button onClick={() => setAdmin(u.id, !u.is_admin)} className="btn-outline text-xs">
                    {u.is_admin ? t('admin.removeAdmin') : t('admin.makeAdmin')}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function MessagesTab() {
  const { t, i18n } = useTranslation();
  const [q, setQ] = useState('');
  const [fingerprintFilter, setFingerprintFilter] = useState('');
  const [googleFilter, setGoogleFilter] = useState(null); // { sub, label }
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async (query = q, fp = fingerprintFilter, gf = googleFilter) => {
    setLoading(true);
    try {
      const params = { q: query, limit: 100 };
      if (fp) params.fingerprint = fp;
      if (gf?.sub) params.google_sub = gf.sub;
      const { data } = await api.get('/admin/messages', { params });
      setMessages(data.messages);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const id = setTimeout(() => load(q, fingerprintFilter, googleFilter), 250);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, fingerprintFilter, googleFilter]);

  const remove = async (id) => {
    if (!confirm(t('admin.confirmDeleteMsg'))) return;
    try {
      await api.delete(`/admin/messages/${id}`);
      setMessages((ms) => ms.filter((m) => m.id !== id));
    } catch { toast.error(t('errors.server_error')); }
  };
  const hideToggle = async (id) => {
    try {
      const { data } = await api.patch(`/admin/messages/${id}/hide`);
      setMessages((ms) => ms.map((m) => (m.id === id ? { ...m, is_hidden: data.is_hidden } : m)));
    } catch { toast.error(t('errors.server_error')); }
  };
  const banDevice = async (fp) => {
    if (!fp) return;
    if (!confirm(t('admin.confirmBanDevice', {
      defaultValue: 'Ban this device fingerprint? Future messages from this device will be rejected.',
    }))) return;
    try {
      await api.post(`/admin/fingerprints/${encodeURIComponent(fp)}/ban`);
      setMessages((ms) => ms.map((m) => (m.sender_fingerprint === fp ? { ...m, fingerprint_banned: true } : m)));
      toast.success(t('admin.deviceBanned', { defaultValue: 'Device banned.' }));
    } catch { toast.error(t('errors.server_error')); }
  };
  const unbanDevice = async (fp) => {
    if (!fp) return;
    try {
      await api.delete(`/admin/fingerprints/${encodeURIComponent(fp)}/ban`);
      setMessages((ms) => ms.map((m) => (m.sender_fingerprint === fp ? { ...m, fingerprint_banned: false } : m)));
      toast.success(t('admin.deviceUnbanned', { defaultValue: 'Device unbanned.' }));
    } catch { toast.error(t('errors.server_error')); }
  };

  return (
    <div>
      <input
        className="input mb-4"
        placeholder={t('admin.searchMessages')}
        value={q}
        onChange={(e) => setQ(e.target.value)}
      />
      {fingerprintFilter && (
        <div className="mb-4 flex items-center gap-2 text-xs bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
          <span className="text-amber-800">
            {t('admin.filteringByDevice', { defaultValue: 'Filtering by device:' })}{' '}
            <code dir="ltr" className="font-semibold">{fingerprintFilter.slice(0, 12)}…</code>
          </span>
          <button
            onClick={() => setFingerprintFilter('')}
            className="ms-auto text-amber-900 font-semibold hover:underline"
          >
            {t('admin.clearFilter', { defaultValue: 'Clear filter' })}
          </button>
        </div>
      )}
      {googleFilter && (
        <div className="mb-4 flex items-center gap-2 text-xs bg-brand-50 border border-brand-200 rounded-lg px-3 py-2">
          <span className="text-brand-800">
            {t('admin.sd.filteringByGoogle')}{' '}
            <b dir="ltr" className="font-semibold">{googleFilter.label}</b>
          </span>
          <button
            onClick={() => setGoogleFilter(null)}
            className="ms-auto text-brand-900 font-semibold hover:underline"
          >
            {t('admin.clearFilter', { defaultValue: 'Clear filter' })}
          </button>
        </div>
      )}
      {loading ? (
        <div className="text-center text-ink-muted py-10">{t('common.loading')}</div>
      ) : messages.length === 0 ? (
        <div className="text-center text-ink-muted py-10">{t('admin.noResults')}</div>
      ) : (
        <div className="space-y-2">
          {messages.map((m) => {
            const senderLabel = m.sender_username
              ? `@${m.sender_username}`
              : m.sender_email
              ? m.sender_name
                ? `${m.sender_name} (Google)`
                : `${m.sender_email} (Google)`
              : '?';
            return (
              <div key={m.id} className={`card p-4 ${m.is_hidden ? 'opacity-60' : ''}`}>
                <div className="flex items-center justify-between gap-2 text-xs text-ink-muted">
                  <div className="flex items-center gap-2 flex-wrap">
                    {m.sender_picture && (
                      <img src={m.sender_picture} alt="" className="w-5 h-5 rounded-full" />
                    )}
                    <span>{t('admin.sender')}: <b className="text-ink" dir="ltr">{senderLabel}</b></span>
                    <span>→</span>
                    <span>{t('admin.recipient')}: <b className="text-ink" dir="ltr">@{m.recipient_username}</b></span>
                  </div>
                  <span>{formatDate(m.created_at, i18n.language)}</span>
                </div>
                <SenderDetails
                  m={m}
                  onFilterFingerprint={setFingerprintFilter}
                  onFilterGoogleSub={(sub, label) => setGoogleFilter({ sub, label })}
                />
                <p className="mt-2 text-ink whitespace-pre-wrap leading-relaxed">{m.body}</p>
                <div className="mt-3 flex items-center gap-2 flex-wrap">
                  <button onClick={() => hideToggle(m.id)} className="btn-outline text-xs">
                    {m.is_hidden ? t('admin.unhide') : t('admin.hide')}
                  </button>
                  <button onClick={() => remove(m.id)} className="btn text-xs bg-red-600 text-white hover:bg-red-700">
                    {t('admin.deleteMsg')}
                  </button>
                  {m.sender_fingerprint && (
                    m.fingerprint_banned ? (
                      <button
                        onClick={() => unbanDevice(m.sender_fingerprint)}
                        className="btn-outline text-xs"
                      >
                        {t('admin.unbanDevice', { defaultValue: 'Unban device' })}
                      </button>
                    ) : (
                      <button
                        onClick={() => banDevice(m.sender_fingerprint)}
                        className="btn text-xs bg-amber-600 text-white hover:bg-amber-700"
                      >
                        {t('admin.banDevice', { defaultValue: 'Ban device' })}
                      </button>
                    )
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function Admin() {
  const { t } = useTranslation();
  const me = useAuth((s) => s.user);
  const [tab, setTab] = useState('overview');
  const [stats, setStats] = useState(null);

  useEffect(() => {
    if (tab === 'overview') {
      api.get('/admin/stats').then(({ data }) => setStats(data.stats)).catch(() => {});
    }
  }, [tab]);

  const tabBtn = (key, label) => (
    <button
      key={key}
      onClick={() => setTab(key)}
      className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
        tab === key
          ? 'bg-brand-500 text-white shadow-soft'
          : 'bg-white text-ink-muted hover:bg-slate-100 border border-slate-200'
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-extrabold text-ink">{t('admin.title')}</h1>
      <div className="mt-5 flex flex-wrap gap-2">
        {tabBtn('overview', t('admin.tabOverview'))}
        {tabBtn('users', t('admin.tabUsers'))}
        {tabBtn('messages', t('admin.tabMessages'))}
      </div>
      <div className="mt-6">
        {tab === 'overview' && <Overview stats={stats} />}
        {tab === 'users' && <UsersTab me={me} />}
        {tab === 'messages' && <MessagesTab />}
      </div>
    </div>
  );
}
