import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { GoogleLogin } from '@react-oauth/google';
import api from '../api/client';
import { saveVisitorSession } from '../lib/visitorSession';
import { rootOrigin } from '../lib/host';

// Only ever return to our own domain — never an attacker-supplied URL.
function safeReturnUrl() {
  const raw = new URLSearchParams(window.location.search).get('return') || '';
  try {
    const url = new URL(raw);
    if (url.hostname === 'saraha.pro' || url.hostname.endsWith('.saraha.pro')) return url.href;
    if (url.origin === window.location.origin) return url.href;
  } catch {
    /* ignore */
  }
  return rootOrigin() || '/';
}

export default function VisitorSignIn() {
  const { t } = useTranslation();
  const back = safeReturnUrl();

  const onSuccess = async (cred) => {
    const idToken = cred?.credential || '';
    if (!idToken) return;
    try {
      const { data } = await api.post('/auth/google-session', { id_token: idToken });
      saveVisitorSession(data.token, data.profile);
      window.location.href = back;
    } catch (err) {
      const code = err.response?.data?.error;
      toast.error(
        code === 'account_banned'
          ? t('errors.account_banned', { defaultValue: 'This account is banned.' })
          : t('profile.googleFailed', { defaultValue: 'Google sign-in failed.' })
      );
    }
  };

  const onError = () =>
    toast.error(t('profile.googleFailed', { defaultValue: 'Google sign-in failed.' }));

  return (
    <div className="max-w-md mx-auto px-4 py-20">
      <div className="card p-8 text-center">
        <h1 className="text-xl font-extrabold text-ink">
          {t('signin.title', { defaultValue: 'Sign in to send your message' })}
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          {t('profile.signInRequired', {
            defaultValue:
              'Sign in with Google to send. The recipient never sees who you are.',
          })}
        </p>
        <div className="mt-6 flex justify-center">
          <GoogleLogin
            onSuccess={onSuccess}
            onError={onError}
            theme="filled_blue"
            shape="pill"
            text="signin_with"
            useOneTap={false}
          />
        </div>
        <a href={back} className="mt-6 inline-block text-sm text-slate-500 hover:text-slate-700 underline">
          {t('common.cancel', { defaultValue: 'Cancel' })}
        </a>
      </div>
    </div>
  );
}
