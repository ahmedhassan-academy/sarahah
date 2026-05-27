import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import api from '../api/client';
import { useAuth } from '../store/auth';

export default function Settings() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const user = useAuth((s) => s.user);
  const setUser = useAuth((s) => s.setUser);
  const logout = useAuth((s) => s.logout);

  const [display_name, setDisplay] = useState(user.display_name || '');
  const [bio, setBio] = useState(user.bio || '');
  const [avatar_url, setAvatar] = useState(user.avatar_url || '');
  const [allow_messages, setAllow] = useState(user.allow_messages);
  const [savingProfile, setSavingProfile] = useState(false);

  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [changingPwd, setChangingPwd] = useState(false);

  const saveProfile = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      const { data } = await api.patch('/users/me', { display_name, bio, avatar_url, allow_messages });
      setUser(data.user);
      toast.success(t('settings.saved'));
    } catch {
      toast.error(t('errors.server_error'));
    } finally {
      setSavingProfile(false);
    }
  };

  const changePwd = async (e) => {
    e.preventDefault();
    setChangingPwd(true);
    try {
      await api.post('/users/me/password', { current, next });
      setCurrent('');
      setNext('');
      toast.success(t('settings.passwordChanged'));
    } catch (err) {
      const code = err.response?.data?.error || 'server_error';
      toast.error(t(`errors.${code}`, { defaultValue: t('errors.server_error') }));
    } finally {
      setChangingPwd(false);
    }
  };

  const deleteAccount = async () => {
    if (!confirm(t('settings.deleteConfirm'))) return;
    try {
      await api.delete('/users/me');
      logout();
      toast.success(t('settings.deleted'));
      navigate('/');
    } catch {
      toast.error(t('errors.server_error'));
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
      <h1 className="text-2xl font-extrabold text-slate-900">{t('settings.title')}</h1>

      <form onSubmit={saveProfile} className="card p-6">
        <h2 className="font-bold text-lg text-slate-900">{t('settings.profile')}</h2>
        <div className="mt-4 space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">
              {t('settings.displayName')}
            </label>
            <input className="input" value={display_name} onChange={(e) => setDisplay(e.target.value)} maxLength={60} />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">
              {t('settings.bio')}
            </label>
            <textarea className="input min-h-[80px]" value={bio} onChange={(e) => setBio(e.target.value)} maxLength={200} />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">
              {t('settings.avatar')}
            </label>
            <input className="input" value={avatar_url} onChange={(e) => setAvatar(e.target.value)} placeholder="https://…" />
          </div>
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={allow_messages}
              onChange={(e) => setAllow(e.target.checked)}
              className="w-5 h-5 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
            />
            <span className="font-semibold text-slate-700">{t('settings.allowMessages')}</span>
          </label>
        </div>
        <div className="mt-5">
          <button type="submit" disabled={savingProfile} className="btn-primary disabled:opacity-60">
            {savingProfile ? t('common.loading') : t('settings.save')}
          </button>
        </div>
      </form>

      <div className="card p-6">
        <h2 className="font-bold text-lg text-slate-900">{t('settings.language')}</h2>
        <div className="mt-3 flex gap-2">
          {['ar', 'en'].map((lng) => (
            <button
              key={lng}
              onClick={() => i18n.changeLanguage(lng)}
              className={`px-4 py-2 rounded-xl text-sm font-semibold border ${
                i18n.language === lng
                  ? 'bg-brand-600 text-white border-brand-600'
                  : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
              }`}
            >
              {lng === 'ar' ? 'العربية' : 'English'}
            </button>
          ))}
        </div>
      </div>

      <form onSubmit={changePwd} className="card p-6">
        <h2 className="font-bold text-lg text-slate-900">{t('settings.password')}</h2>
        <div className="mt-4 space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">
              {t('settings.currentPassword')}
            </label>
            <input type="password" className="input" value={current} onChange={(e) => setCurrent(e.target.value)} required />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">
              {t('settings.newPassword')}
            </label>
            <input type="password" className="input" value={next} onChange={(e) => setNext(e.target.value)} required />
          </div>
        </div>
        <div className="mt-5">
          <button type="submit" disabled={changingPwd} className="btn-primary disabled:opacity-60">
            {changingPwd ? t('common.loading') : t('settings.changePassword')}
          </button>
        </div>
      </form>

      <div className="card p-6 border-red-200 bg-red-50">
        <h2 className="font-bold text-lg text-red-700">{t('settings.danger')}</h2>
        <p className="mt-2 text-sm text-red-700/80">{t('settings.deleteConfirm')}</p>
        <div className="mt-4">
          <button onClick={deleteAccount} className="btn bg-red-600 text-white hover:bg-red-700">
            {t('settings.deleteAccount')}
          </button>
        </div>
      </div>
    </div>
  );
}
