import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import api from '../api/client';
import { useAuth } from '../store/auth';

const MAX = 1000;

export default function PublicProfile() {
  const { t, i18n } = useTranslation();
  const { username } = useParams();
  const user = useAuth((s) => s.user);

  const [profile, setProfile] = useState(null);
  const [state, setState] = useState('loading'); // loading | ok | not_found
  const [body, setBody] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let alive = true;
    setState('loading');
    api.get(`/users/u/${encodeURIComponent(username)}`)
      .then(({ data }) => {
        if (!alive) return;
        setProfile(data.user);
        setState('ok');
      })
      .catch(() => {
        if (!alive) return;
        setState('not_found');
      });
    return () => { alive = false; };
  }, [username]);

  const send = async (e) => {
    e.preventDefault();
    if (!body.trim()) return;
    setBusy(true);
    try {
      await api.post(`/messages/to/${encodeURIComponent(username)}`, { body });
      setBody('');
      toast.success(t('profile.sent'));
    } catch (err) {
      const code = err.response?.data?.error || 'server_error';
      toast.error(t(`errors.${code}`, { defaultValue: t('errors.server_error') }));
    } finally {
      setBusy(false);
    }
  };

  if (state === 'loading') {
    return <div className="py-24 text-center text-slate-500">{t('common.loading')}</div>;
  }

  if (state === 'not_found') {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center">
        <div className="text-6xl">🙈</div>
        <h1 className="mt-4 text-2xl font-extrabold text-slate-900">{t('profile.notFound')}</h1>
        <p className="mt-2 text-slate-600">{t('profile.notFoundBody')}</p>
        <Link to="/" className="btn-primary mt-6">{t('profile.backHome')}</Link>
      </div>
    );
  }

  const joined = new Date(profile.created_at).toLocaleDateString(
    i18n.language === 'ar' ? 'ar-EG' : 'en-US',
    { year: 'numeric', month: 'long' }
  );

  const remaining = MAX - body.length;
  const isSelf = user && user.id === profile.id;

  return (
    <div className="max-w-md mx-auto px-4 py-10">
      <div className="card p-6 text-center">
        <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-brand-400 to-brand-700 grid place-items-center text-white text-3xl font-extrabold">
          {(profile.display_name || profile.username).charAt(0).toUpperCase()}
        </div>
        <h1 className="mt-4 text-xl font-extrabold text-slate-900">
          {profile.display_name || profile.username}
        </h1>
        <div className="text-slate-500 text-sm" dir="ltr">@{profile.username}</div>
        {profile.bio && <p className="mt-3 text-slate-700 text-sm leading-relaxed">{profile.bio}</p>}
        <div className="mt-2 text-xs text-slate-400">{t('profile.joined')} {joined}</div>
      </div>

      {!profile.allow_messages ? (
        <div className="card mt-5 p-6 text-center text-slate-600">
          {t('profile.disabled')}
        </div>
      ) : isSelf ? (
        <div className="card mt-5 p-6 text-center">
          <p className="text-slate-600 text-sm">{t('inbox.yourLink')}</p>
          <code className="mt-2 inline-block bg-slate-100 px-3 py-1.5 rounded-lg text-brand-700 font-semibold">
            {window.location.origin}/{profile.username}
          </code>
          <div className="mt-4">
            <Link to="/inbox" className="btn-primary">{t('nav.inbox')}</Link>
          </div>
        </div>
      ) : !user ? (
        <div className="card mt-5 p-6 text-center">
          <p className="text-slate-600 text-sm mb-4">
            {t('profile.sendMessageTo')} <span className="font-bold" dir="ltr">@{profile.username}</span>
          </p>
          <Link to="/login" state={{ from: `/${profile.username}` }} className="btn-primary">
            {t('nav.login')}
          </Link>
        </div>
      ) : (
        <form onSubmit={send} className="card mt-5 p-6">
          <label className="block text-sm font-semibold text-slate-700 mb-2">
            {t('profile.sendMessageTo')} <span className="text-brand-700" dir="ltr">@{profile.username}</span>
          </label>
          <textarea
            className="input min-h-[140px]"
            placeholder={t('profile.placeholder')}
            value={body}
            onChange={(e) => setBody(e.target.value.slice(0, MAX))}
            maxLength={MAX}
            required
          />
          <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
            <span>{remaining} {t('profile.remaining')}</span>
            <button type="submit" disabled={busy || !body.trim()} className="btn-primary text-sm disabled:opacity-60">
              {busy ? t('common.loading') : t('profile.send')}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
