import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { useAuth } from '../store/auth';

export default function Register() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const register = useAuth((s) => s.register);

  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [display_name, setDisplay] = useState('');
  const [busy, setBusy] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      await register({ username, email, password, display_name });
      toast.success('✓');
      navigate('/inbox');
    } catch (err) {
      const code = err.response?.data?.error || 'server_error';
      toast.error(t(`errors.${code}`, { defaultValue: t('errors.server_error') }));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-12">
      <div className="card p-8">
        <div className="brand-mark">S</div>
        <h1 className="mt-4 text-2xl font-extrabold text-ink text-center">
          {t('auth.registerTitle')}
        </h1>
        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <div className="floating-field">
            <input
              id="username"
              className="input"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              placeholder=" "
              required
            />
            <label htmlFor="username">{t('auth.username')}</label>
          </div>
          <p className="text-xs text-ink-muted -mt-2">{t('auth.usernameHint')}</p>

          <div className="floating-field">
            <input
              id="email"
              type="email"
              className="input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              placeholder=" "
              required
            />
            <label htmlFor="email">{t('auth.email')}</label>
          </div>

          <div className="floating-field">
            <input
              id="display_name"
              className="input"
              value={display_name}
              onChange={(e) => setDisplay(e.target.value)}
              placeholder=" "
            />
            <label htmlFor="display_name">{t('auth.displayName')}</label>
          </div>

          <div className="floating-field">
            <input
              id="password"
              type="password"
              className="input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
              placeholder=" "
              required
            />
            <label htmlFor="password">{t('auth.password')}</label>
          </div>
          <p className="text-xs text-ink-muted -mt-2">{t('auth.passwordHint')}</p>

          <button type="submit" disabled={busy} className="btn-primary w-full disabled:opacity-60">
            {busy ? t('common.loading') : t('auth.submitRegister')}
          </button>
        </form>
        <p className="mt-5 text-center text-sm text-ink-muted">
          {t('auth.haveAccount')}{' '}
          <Link to="/login" className="text-brand-600 font-semibold hover:text-brand-700">
            {t('auth.loginHere')}
          </Link>
        </p>
      </div>
    </div>
  );
}
