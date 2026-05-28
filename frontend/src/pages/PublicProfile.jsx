import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { GoogleLogin } from '@react-oauth/google';
import api from '../api/client';
import { useAuth } from '../store/auth';

const MAX = 1000;

function decodeJwtPayload(jwt) {
  try {
    const part = jwt.split('.')[1];
    const json = atob(part.replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(decodeURIComponent(escape(json)));
  } catch {
    return null;
  }
}

export default function PublicProfile() {
  const { t, i18n } = useTranslation();
  const { username } = useParams();
  const user = useAuth((s) => s.user);

  const [profile, setProfile] = useState(null);
  const [state, setState] = useState('loading'); // loading | ok | not_found
  const [body, setBody] = useState('');
  const [busy, setBusy] = useState(false);
  const [googleIdToken, setGoogleIdToken] = useState('');
  const [googleProfile, setGoogleProfile] = useState(null); // { name, picture, email }

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
    if (!user && !googleIdToken) {
      toast.error(t('profile.signInFirst', { defaultValue: 'Please sign in with Google to send a message.' }));
      return;
    }
    setBusy(true);
    try {
      const payload = { body };
      if (!user && googleIdToken) payload.google_id_token = googleIdToken;
      await api.post(`/messages/to/${encodeURIComponent(username)}`, payload);
      setBody('');
      toast.success(t('profile.sent'));
    } catch (err) {
      const code = err.response?.data?.error || 'server_error';
      toast.error(t(`errors.${code}`, { defaultValue: t('errors.server_error') }));
    } finally {
      setBusy(false);
    }
  };

  const onGoogleSuccess = (credentialResponse) => {
    const idToken = credentialResponse?.credential || '';
    if (!idToken) return;
    const payload = decodeJwtPayload(idToken);
    setGoogleIdToken(idToken);
    setGoogleProfile({
      name: payload?.name || '',
      picture: payload?.picture || '',
      email: payload?.email || '',
    });
  };

  const onGoogleError = () => {
    toast.error(t('profile.googleFailed', { defaultValue: 'Google sign-in failed. Please try again.' }));
  };

  const signOutGoogle = () => {
    setGoogleIdToken('');
    setGoogleProfile(null);
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
      ) : !user && !googleIdToken ? (
        <div className="card mt-5 p-6 text-center">
          <p className="text-slate-700 text-sm mb-3">
            {t('profile.sendMessageTo')}{' '}
            <span className="font-bold text-brand-700" dir="ltr">@{profile.username}</span>
          </p>
          <p className="text-xs text-slate-500 mb-4">
            {t('profile.signInRequired', {
              defaultValue:
                'Sign in with Google to send. The recipient never sees who you are — but admins can review for safety.',
            })}
          </p>
          <div className="flex justify-center">
            <GoogleLogin
              onSuccess={onGoogleSuccess}
              onError={onGoogleError}
              theme="filled_blue"
              shape="pill"
              text="signin_with"
              useOneTap={false}
            />
          </div>
        </div>
      ) : (
        <form onSubmit={send} className="card mt-5 p-6">
          {googleProfile && (
            <div className="mb-3 flex items-center gap-2 text-xs text-slate-500 bg-slate-50 rounded-lg p-2">
              {googleProfile.picture && (
                <img src={googleProfile.picture} alt="" className="w-6 h-6 rounded-full" />
              )}
              <span className="flex-1 truncate" dir="ltr">{googleProfile.email}</span>
              <button
                type="button"
                onClick={signOutGoogle}
                className="text-brand-700 font-semibold hover:underline"
              >
                {t('profile.signOut', { defaultValue: 'Sign out' })}
              </button>
            </div>
          )}
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
