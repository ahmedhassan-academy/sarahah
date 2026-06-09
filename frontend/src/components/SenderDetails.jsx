import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { parseUserAgent } from '../lib/ua';

// Copy text to clipboard with a fallback for older / non-secure contexts.
async function copyText(text) {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch { /* fall through to legacy path */ }
  try {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.focus();
    ta.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(ta);
    return ok;
  } catch {
    return false;
  }
}

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

  // Internet channel from the sender IP's network: a mobile-carrier IP means
  // mobile data; a fixed/broadband IP means Wi-Fi or home/office internet.
  const conn = (() => {
    const net = m.net;
    if (!net) return null;
    if (net.status === 'private') return { icon: '🏠', label: t('admin.sd.connLocal') };
    if (net.status !== 'ok') return null;
    if (net.is_proxy) return { icon: '🛡️', label: t('admin.sd.connVpn'), accent: 'text-amber-700' };
    if (net.is_mobile) return { icon: '📶', label: t('admin.sd.connMobile') };
    return { icon: '🛜', label: t('admin.sd.connWifi') };
  })();

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
        {conn && (
          <Fact icon={conn.icon} label={t('admin.sd.connection')} accent={conn.accent}>
            {conn.label}
          </Fact>
        )}
        {m.net?.status === 'ok' && (m.net.isp || m.net.org) && (
          <Fact icon="🏢" label={t('admin.sd.company')}>
            <span dir="ltr">{m.net.isp || m.net.org}</span>
          </Fact>
        )}
        {m.sender_email && (
          <Fact icon="✉️" label={t('admin.sd.email')}>
            <span dir="ltr">{m.sender_email}</span>
          </Fact>
        )}
        {fp && (
          <div className="col-span-2 sm:col-span-3 rounded-xl border border-slate-200 bg-white px-3 py-2">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[10px] font-semibold uppercase tracking-wide text-ink-muted">
                🔑 {t('admin.sd.deviceId')}
                {m.fingerprint_banned && (
                  <span className="ms-1 text-red-600">· {t('admin.sd.banned')}</span>
                )}
              </span>
              <button
                type="button"
                onClick={() => onFilterFingerprint?.(fp)}
                className="text-[10px] font-semibold text-ink-muted hover:text-ink underline-offset-2 hover:underline"
              >
                {t('admin.sd.filterDevice')}
              </button>
            </div>
            <button
              type="button"
              onClick={async () => {
                const ok = await copyText(fp);
                if (ok) toast.success(t('admin.sd.copied'));
                else toast.error(t('errors.server_error'));
              }}
              title={t('admin.sd.copyHint')}
              dir="ltr"
              className={`mt-1 w-full text-start text-sm font-semibold break-all underline-offset-2 hover:underline ${
                m.fingerprint_banned ? 'text-red-600' : 'text-brand-700'
              }`}
            >
              {fp}
            </button>
          </div>
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
