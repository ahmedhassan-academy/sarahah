import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { parseUserAgent } from '../lib/ua';

const OS_ICON = {
  windows: '🪟',
  apple: '',
  android: '🤖',
  linux: '🐧',
  chromeos: '🌈',
  unknown: '💻',
};

const DEVICE_ICON = {
  desktop: '💻',
  mobile: '📱',
  tablet: '📔',
  bot: '🤖',
  unknown: '❓',
};

// Form-factor badge colour per device type.
const FORM_TINT = {
  desktop: 'bg-slate-100 text-slate-700',
  mobile: 'bg-brand-100 text-brand-700',
  tablet: 'bg-amber-100 text-amber-800',
  bot: 'bg-red-100 text-red-700',
  unknown: 'bg-slate-100 text-slate-600',
};

// One labelled fact: icon, small caption, the human-readable value.
function Fact({ icon, label, children, accent }) {
  return (
    <div className="flex items-start gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2">
      <span className="text-lg leading-none mt-0.5" aria-hidden>{icon}</span>
      <div className="min-w-0">
        <div className="text-[10px] font-semibold uppercase tracking-wide text-ink-muted">{label}</div>
        <div className={`text-sm font-semibold truncate ${accent || 'text-ink'}`}>{children}</div>
      </div>
    </div>
  );
}

export default function SenderDetails({ m, onFilterFingerprint }) {
  const { t } = useTranslation();
  const [showRaw, setShowRaw] = useState(false);

  const ua = parseUserAgent(m.sender_user_agent);
  const fp = m.sender_fingerprint;

  const hasAnything = m.sender_email || fp || ua;
  if (!hasAnything) return null;

  const formFactor = ua ? t(`admin.sd.form.${ua.device.type}`) : null;

  return (
    <div className="mt-3 rounded-2xl bg-slate-50 border border-slate-200 p-3">
      <div className="text-[11px] font-bold uppercase tracking-wide text-ink-muted mb-2">
        {t('admin.sd.title')}
      </div>

      {/* Device hero — big icon, device name, and a clear "phone vs computer" badge */}
      {ua && (
        <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2.5 mb-2">
          <span className="text-3xl leading-none" aria-hidden>
            {DEVICE_ICON[ua.device.type] || '💻'}
          </span>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-base font-bold text-ink truncate" dir="ltr">
                {ua.device.name}
              </span>
              {formFactor && (
                <span className={`text-[11px] font-semibold rounded-full px-2 py-0.5 ${FORM_TINT[ua.device.type] || FORM_TINT.unknown}`}>
                  {formFactor}
                </span>
              )}
            </div>
            <div className="text-xs text-ink-muted mt-0.5">{t('admin.sd.deviceCaption')}</div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {ua && (
          <Fact icon={OS_ICON[ua.os.key] || '💻'} label={t('admin.sd.os')}>
            <span dir="ltr">{ua.os.name}</span>
          </Fact>
        )}
        {ua && (
          <Fact icon="🌐" label={t('admin.sd.browser')}>
            <span dir="ltr">
              {ua.browser.name}
              {ua.browser.version ? ` ${ua.browser.version}` : ''}
            </span>
          </Fact>
        )}
        {m.sender_email && (
          <Fact icon="✉️" label={t('admin.sd.email')}>
            <span dir="ltr">{m.sender_email}</span>
          </Fact>
        )}
        {fp && (
          <button
            type="button"
            onClick={() => onFilterFingerprint?.(fp)}
            title={t('admin.sd.deviceIdHint')}
            className="text-start"
          >
            <Fact
              icon="🔑"
              label={t('admin.sd.deviceId')}
              accent={m.fingerprint_banned ? 'text-red-600' : 'text-brand-700'}
            >
              <span dir="ltr" className="underline-offset-2 hover:underline">
                {fp.slice(0, 8)}…{m.fingerprint_banned ? ` · ${t('admin.sd.banned')}` : ''}
              </span>
            </Fact>
          </button>
        )}
      </div>

      <button
        type="button"
        onClick={() => setShowRaw((v) => !v)}
        className="mt-2 text-[11px] font-semibold text-ink-muted hover:text-ink"
      >
        {showRaw ? t('admin.sd.hideRaw') : t('admin.sd.showRaw')}
      </button>
      {showRaw && (
        <div className="mt-2 space-y-1 text-[11px] text-ink-muted break-all" dir="ltr">
          {m.sender_ip && <div>IP: {m.sender_ip}</div>}
          {fp && <div>device: {fp}</div>}
          {m.sender_google_sub && <div>google id: {m.sender_google_sub}</div>}
          {m.sender_user_agent && <div>UA: {m.sender_user_agent}</div>}
        </div>
      )}
    </div>
  );
}
