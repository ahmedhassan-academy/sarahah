import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { useAuth } from '../store/auth';

export default function Login() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const loc = useLocation();
  const login = useAuth((s) => s.login);

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      await login(identifier, password);
      navigate(loc.state?.from || '/inbox');
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
          {t('auth.loginTitle')}
        </h1>
        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <div className="floating-field">
            <input
              id="identifier"
              className="input"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              autoComplete="username"
              placeholder=" "
              required
            />
            <label htmlFor="identifier">{t('auth.identifier')}</label>
          </div>

          <div className="floating-field">
            <input
              id="password"
              type="password"
              className="input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              placeholder=" "
              required
            />
            <label htmlFor="password">{t('auth.password')}</label>
          </div>

          <button type="submit" disabled={busy} className="btn-primary w-full disabled:opacity-60">
            {busy ? t('common.loading') : t('auth.submitLogin')}
          </button>
        </form>
        <p className="mt-5 text-center text-sm text-ink-muted">
          {t('auth.noAccount')}{' '}
          <Link to="/register" className="text-brand-600 font-semibold hover:text-brand-700">
            {t('auth.registerHere')}
          </Link>
        </p>
      </div>
    </div>
  );
}
