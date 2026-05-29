import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { GoogleLogin } from '@react-oauth/google';
import FingerprintJS from '@fingerprintjs/fingerprintjs';
import api from '../api/client';
import { useAuth } from '../store/auth';
import { profileUrl } from '../lib/host';
import {
  getVisitorProfile,
  getVisitorToken,
  saveVisitorSession,
  clearVisitorSession,
} from '../lib/visitorSession';

const MAX = 1000;

let fpAgentPromise = null;
function getFpAgent() {
  if (!fpAgentPromise) fpAgentPromise = FingerprintJS.load();
  return fpAgentPromise;
}

function relativeTime(iso, t) {
  const diff = Math.max(0, Date.now() - new Date(iso).getTime());
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
  return t('time.yearsAgo', { n: Math.floor(d / 365) });
}

export default function PublicProfile() {
  const { t, i18n } = useTranslation();
  const params = useParams();
  const username = params.username;
  const user = useAuth((s) => s.user);

  const [profile, setProfile] = useState(null);
  const [state, setState] = useState('loading');
  const [body, setBody] = useState('');
  const [busy, setBusy] = useState(false);
  const [googleProfile, setGoogleProfile] = useState(() => getVisitorProfile());
  const [isPrivate, setIsPrivate] = useState(true);
  const [saveToSent, setSaveToSent] = useState(true);
  const [publicMessages, setPublicMessages] = useState([]);
  const fingerprintRef = useRef('');

  useEffect(() => {
    let alive = true;
    setState('loading');
    api
      .get(`/users/u/${encodeURIComponent(username)}`)
      .then(({ data }) => {
        if (!alive) return;
        setProfile(data.user);
        setState('ok');
      })
      .catch(() => {
        if (!alive) return;
        setState('not_found');
      });
    return () => {
      alive = false;
    };
  }, [username]);

  useEffect(() => {
    if (state !== 'ok' || !profile) return;
    let alive = true;
    api
      .get(`/users/u/${encodeURIComponent(username)}/public-messages`)
      .then(({ data }) => {
        if (!alive) return;
        setPublicMessages(data.messages || []);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [state, profile, username]);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const fp = await getFpAgent();
        const r = await fp.get();
        if (alive && r && r.visitorId) fingerprintRef.current = r.visitorId;
      } catch {
        /* ignore */
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    if (user) return;
    if (!googleProfile) return;
    let alive = true;
    api
      .get('/auth/google-me')
      .then(({ data }) => {
        if (!alive) return;
        setGoogleProfile(data.profile);
        const tok = getVisitorToken();
        if (tok) saveVisitorSession(tok, data.profile);
      })
      .catch(() => {
        if (!alive) return;
        setGoogleProfile(null);
      });
    return () => {
      alive = false;
    };
  }, [user]);

  const suggestRandom = () => {
    const list = t('profile.suggestions', { returnObjects: true });
    if (!Array.isArray(list) || list.length === 0) return;
    const pick = list[Math.floor(Math.random() * list.length)];
    setBody((b) => (b && !b.endsWith(' ') ? `${b} ${pick}` : pick));
  };

  const send = async (e) => {
    e.preventDefault();
    if (!body.trim()) return;
    if (!user && !googleProfile) {
      toast.error(t('profile.signInFirst', { defaultValue: 'Please sign in with Google to send a message.' }));
      return;
    }
    setBusy(true);
    try {
      const payload = {
        body,
        is_public: !isPrivate,
        save_to_sent: !!user && saveToSent,
      };
      if (fingerprintRef.current) payload.fingerprint = fingerprintRef.current;
      await api.post(`/messages/to/${encodeURIComponent(username)}`, payload);
      setBody('');
      toast.success(t('profile.sent'));
      if (!isPrivate) {
        api
          .get(`/users/u/${encodeURIComponent(username)}/public-messages`)
          .then(({ data }) => setPublicMessages(data.messages || []))
          .catch(() => {});
      }
    } catch (err) {
      const code = err.response?.data?.error || 'server_error';
      if (err.response?.status === 401) setGoogleProfile(null);
      toast.error(t(`errors.${code}`, { defaultValue: t('errors.server_error') }));
    } finally {
      setBusy(false);
    }
  };

  const onGoogleSuccess = async (cred) => {
    const idToken = cred?.credential || '';
    if (!idToken) return;
    try {
      const { data } = await api.post('/auth/google-session', { id_token: idToken });
      saveVisitorSession(data.token, data.profile);
      setGoogleProfile(data.profile);
    } catch (err) {
      const code = err.response?.data?.error;
      toast.error(
        code === 'account_banned'
          ? t('errors.account_banned', { defaultValue: 'This account is banned.' })
          : t('profile.googleFailed', { defaultValue: 'Google sign-in failed.' })
      );
    }
  };

  const onGoogleError = () =>
    toast.error(t('profile.googleFailed', { defaultValue: 'Google sign-in failed.' }));

  const signOutGoogle = () => {
    setGoogleProfile(null);
    clearVisitorSession();
  };

  const remaining = MAX - body.length;
  const isSelf = user && profile && user.id === profile.id;

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

  const displayName = profile.display_name || profile.username;
  const link = profileUrl(profile);
  const showOnline = true;
  const visitorCount = 735;

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 sm:py-8">
      <div className="card overflow-hidden">
        <div className="h-1.5 bg-gradient-to-r from-brand-400 to-brand-600" />
        <div className="px-5 sm:px-8 pt-7 pb-5 text-center">
          <div className="relative mx-auto w-28 h-28 sm:w-32 sm:h-32">
            <div className="w-full h-full rounded-full overflow-hidden ring-4 ring-white shadow-md bg-gradient-to-br from-brand-400 to-brand-700 grid place-items-center text-white text-4xl font-extrabold">
              {profile.avatar_url ? (
                <img src={profile.avatar_url} alt={displayName} className="w-full h-full object-cover" />
              ) : (
                <span>{displayName.charAt(0).toUpperCase()}</span>
              )}
            </div>
            {showOnline && (
              <span
                className="absolute bottom-1 end-1 w-5 h-5 rounded-full bg-green-500 ring-4 ring-white"
                title={t('profile.online')}
                aria-label={t('profile.online')}
              />
            )}
          </div>

          <h1 className="mt-4 text-2xl font-extrabold text-ink">{displayName}</h1>
          <a
            href={link}
            className="mt-1 inline-block text-sm text-ink underline underline-offset-2 decoration-ink/40 hover:decoration-ink break-all"
            dir="ltr"
          >
            {link}
          </a>

          <div className="mt-4 flex items-center justify-center gap-2 flex-wrap">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-green-50 text-green-700 px-3 py-1 text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-green-500" aria-hidden />
              {t('profile.online')}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-50 text-brand-700 px-3 py-1 text-xs font-semibold">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
              {t('profile.visitors')}: {visitorCount}
            </span>
          </div>

          <div className="mt-5 grid grid-cols-3 gap-2 sm:gap-4">
            <div className="text-center">
              <div className="text-xs sm:text-sm text-ink-muted">{t('inbox.statFollowing')}</div>
              <div className="mt-1 text-lg sm:text-xl font-extrabold text-ink">0</div>
            </div>
            <div className="text-center">
              <div className="text-xs sm:text-sm text-ink-muted">{t('inbox.statFollowers')}</div>
              <div className="mt-1 text-lg sm:text-xl font-extrabold text-ink">0</div>
            </div>
            <div className="text-center">
              <div className="text-xs sm:text-sm text-ink-muted">{t('inbox.statPosts')}</div>
              <div className="mt-1 text-lg sm:text-xl font-extrabold text-ink">{publicMessages.length}</div>
            </div>
          </div>

          {isSelf && (
            <div className="mt-5">
              <Link
                to="/settings"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-50 text-brand-700 font-semibold py-2.5 px-5 text-sm hover:bg-brand-100 transition w-full"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 20h9M16.5 3.5a2.121 2.121 0 1 1 3 3L7 19l-4 1 1-4z" />
                </svg>
                {t('profile.editProfile')}
              </Link>
            </div>
          )}

          {profile.bio && <p className="mt-4 text-slate-700 text-sm leading-relaxed">{profile.bio}</p>}
        </div>
      </div>

      {!profile.allow_messages ? (
        <div className="card mt-16 p-6 text-center text-slate-600">{t('profile.disabled')}</div>
      ) : (
        <form onSubmit={send} className="card mt-16 p-5 sm:p-6">
          {!user && !googleProfile ? (
            <div className="text-center py-2">
              <p className="text-sm text-slate-700 mb-3">
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
            <>
              <div className="rounded-2xl bg-slate-100 p-4">
                <div className="flex items-start gap-3">
                  <div className="shrink-0 w-9 h-9 rounded-full bg-slate-200 grid place-items-center text-slate-400">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M3.5 20a7.5 7.5 0 0 1 17 0" />
                      <circle cx="12" cy="8" r="4.5" />
                    </svg>
                  </div>
                  <textarea
                    className="flex-1 min-h-[120px] resize-none border-0 bg-transparent outline-none placeholder:text-slate-400 text-slate-800"
                    placeholder={t('profile.placeholder')}
                    value={body}
                    onChange={(e) => setBody(e.target.value.slice(0, MAX))}
                    maxLength={MAX}
                    required
                  />
                </div>

                <div className="mt-3 flex items-end justify-between gap-3">
                  <div className="flex items-center gap-3 text-slate-500">
                    <button type="button" className="hover:text-slate-700 transition-colors" aria-label="attach" title="attach">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
                      </svg>
                    </button>
                    <button type="button" className="hover:text-slate-700 transition-colors" aria-label="emoji" title="emoji">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10" />
                        <path d="M8 14s1.5 2 4 2 4-2 4-2" />
                        <line x1="9" y1="9" x2="9.01" y2="9" />
                        <line x1="15" y1="9" x2="15.01" y2="9" />
                      </svg>
                    </button>
                  </div>

                  <div className="flex flex-col gap-1.5 items-end">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <span className="text-sm font-semibold text-slate-700">{t('profile.privateToggle')}</span>
                      <span
                        className={`relative inline-block w-10 h-6 rounded-full transition-colors ${
                          isPrivate ? 'bg-brand-500' : 'bg-slate-300'
                        }`}
                      >
                        <input
                          type="checkbox"
                          className="sr-only"
                          checked={isPrivate}
                          onChange={(e) => setIsPrivate(e.target.checked)}
                        />
                        <span
                          className={`absolute top-0.5 ${isPrivate ? 'end-0.5' : 'start-0.5'} w-5 h-5 rounded-full bg-white shadow transition-all`}
                        />
                      </span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer">
                      <span className="text-sm font-semibold text-slate-700">{t('profile.saveToSent')}</span>
                      <span
                        className={`relative inline-block w-10 h-6 rounded-full transition-colors ${
                          saveToSent ? 'bg-brand-500' : 'bg-slate-300'
                        }`}
                      >
                        <input
                          type="checkbox"
                          className="sr-only"
                          checked={saveToSent}
                          onChange={(e) => setSaveToSent(e.target.checked)}
                        />
                        <span
                          className={`absolute top-0.5 ${saveToSent ? 'end-0.5' : 'start-0.5'} w-5 h-5 rounded-full bg-white shadow transition-all`}
                        />
                      </span>
                    </label>
                  </div>
                </div>
              </div>

              <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
                <button
                  type="button"
                  onClick={suggestRandom}
                  className="inline-flex items-center gap-1 text-brand-700 font-semibold hover:underline"
                  title={t('profile.suggest')}
                >
                  🎲 <span>{t('profile.suggest')}</span>
                </button>
                <span>
                  {t('profile.remaining')} : {remaining}
                </span>
              </div>

              <div className="mt-4">
                <button
                  type="submit"
                  disabled={busy || !body.trim()}
                  className="w-full rounded-xl bg-brand-500 text-white font-bold py-3 hover:bg-brand-600 disabled:opacity-60 transition"
                >
                  {busy ? t('common.loading') : t('profile.send')}
                </button>
              </div>
            </>
          )}
        </form>
      )}

      <div className="mt-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-bold text-slate-700">{t('profile.publicMessages')}</h2>
        </div>
        <div className="space-y-3">
          {publicMessages.length === 0 ? (
            <div className="card p-8 text-center text-slate-500 text-sm">
              {t('profile.noPublicMessages')}
            </div>
          ) : (
            publicMessages.map((m) => (
              <article key={m.id} className="card p-4 sm:p-5">
                <div className="flex items-start gap-3">
                  <div className="shrink-0 w-9 h-9 rounded-full bg-brand-50 grid place-items-center text-brand-600">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M3.5 20a7.5 7.5 0 0 1 17 0" />
                      <circle cx="12" cy="8" r="4.5" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs text-ink-muted">
                      <span className="font-semibold text-slate-700">{t('inbox.anonymous')}</span>
                      <span className="mx-1 text-slate-400">•</span>
                      <span>{relativeTime(m.created_at, t)}</span>
                    </div>
                    <p className="mt-2 text-slate-800 whitespace-pre-wrap leading-relaxed break-words">
                      {m.body}
                    </p>
                  </div>
                </div>
              </article>
            ))
          )}
        </div>
      </div>

      {!user && (
        <div className="card mt-6 p-6 text-center">
          <div className="text-5xl">👋</div>
          <h3 className="mt-3 text-xl font-extrabold text-ink">{t('profile.joinTitle')}</h3>
          <p className="mt-2 text-sm text-slate-600">{t('profile.joinBody')}</p>
          <div className="mt-5 grid grid-cols-2 gap-3">
            <Link
              to="/register"
              className="rounded-xl bg-orange-500 text-white font-bold py-2.5 hover:bg-orange-600 transition"
            >
              {t('profile.joinSignup')}
            </Link>
            <Link
              to="/login"
              className="rounded-xl bg-brand-500 text-white font-bold py-2.5 hover:bg-brand-600 transition"
            >
              {t('profile.joinLogin')}
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
