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

function fmtDate(iso, lang) {
  if (!iso) return null;
  try {
    return new Date(iso).toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-US', {
      year: 'numeric', month: 'short', day: 'numeric',
    });
  } catch { return null; }
}

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

export default function SenderDetails({ m, onFilterFingerprint, onFilterGoogleSub }) {
  const { t, i18n } = useTranslation();
  const [showRaw, setShowRaw] = useState(false);

  const ua = parseUserAgent(m.sender_user_agent);
  const fp = m.sender_fingerprint;
  const acct = m.google_account;
  const dev = m.device;

  const hasAnything = m.sender_email || fp || ua || m.sender_google_sub;
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

      {/* Google account — profile photo + name + verified badge + history */}
      {m.sender_google_sub && (
        <div className="rounded-xl border border-brand-200 bg-brand-50/60 px-3 py-2.5 mb-2">
          <div className="flex items-center gap-3">
            {m.sender_picture ? (
              <img
                src={m.sender_picture}
                alt=""
                referrerPolicy="no-referrer"
                className="w-10 h-10 rounded-full border border-white shadow-sm object-cover"
              />
            ) : (
              <span className="text-2xl leading-none" aria-hidden>👤</span>
            )}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-bold text-ink truncate" dir="ltr">
                  {m.sender_name || m.sender_email}
                </span>
                <span className="inline-flex items-center gap-1 text-[10px] font-semibold rounded-full bg-emerald-100 text-emerald-700 px-2 py-0.5">
                  ✓ {t('admin.sd.gVerified')}
                </span>
              </div>
              {m.sender_email && (
                <div className="text-xs text-ink-muted truncate" dir="ltr">{m.sender_email}</div>
              )}
            </div>
            <button
              type="button"
              onClick={() => onFilterGoogleSub?.(m.sender_google_sub, m.sender_email || m.sender_name || m.sender_google_sub)}
              className="shrink-0 inline-flex items-center gap-1 rounded-lg border border-brand-300 bg-white text-brand-700 hover:bg-brand-100 text-[11px] font-semibold px-2 py-1"
            >
              <span aria-hidden>🔍</span>
              {t('admin.sd.filterGoogle')}
            </button>
          </div>
          {acct && (
            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-ink-muted">
              {typeof acct.total_messages === 'number' && (
                <span>📨 {t('admin.sd.gMessages', { n: acct.total_messages })}</span>
              )}
              {typeof acct.total_recipients === 'number' && (
                <span>👥 {t('admin.sd.gRecipients', { n: acct.total_recipients })}</span>
              )}
              {acct.first_seen && (
                <span>🗓️ {t('admin.sd.gFirstSeen')}: {fmtDate(acct.first_seen, i18n.language)}</span>
              )}
              {acct.last_seen && (
                <span>🕐 {t('admin.sd.gLastSeen')}: {fmtDate(acct.last_seen, i18n.language)}</span>
              )}
            </div>
          )}
        </div>
      )}

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
        {m.sender_email && !m.sender_google_sub && (
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
                className="shrink-0 inline-flex items-center gap-1 rounded-lg border border-brand-200 bg-brand-50 text-brand-700 hover:bg-brand-100 text-[11px] font-semibold px-2 py-1"
              >
                <span aria-hidden>🔍</span>
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

            {/* Auto-flag: one device used by multiple accounts = evasion attempt */}
            {dev && dev.account_count > 1 ? (
              <div className="mt-2 rounded-lg bg-red-50 border border-red-200 px-2.5 py-2">
                <div className="text-xs font-bold text-red-700">
                  ⚠️ {t('admin.sd.multiAccountWarn', { n: dev.account_count })}
                </div>
                {dev.emails?.length > 0 && (
                  <div className="mt-1 flex flex-col gap-0.5 text-[11px] text-red-800" dir="ltr">
                    {dev.emails.map((e) => (
                      <span key={e} className="truncate">• {e}</span>
                    ))}
                  </div>
                )}
                <div className="mt-1 text-[11px] text-red-700/80">
                  {t('admin.sd.deviceTotals', { msgs: dev.message_count, ppl: dev.recipient_count })}
                </div>
              </div>
            ) : dev && dev.message_count > 1 ? (
              <div className="mt-2 text-[11px] text-ink-muted">
                {t('admin.sd.deviceTotals', { msgs: dev.message_count, ppl: dev.recipient_count })}
              </div>
            ) : null}
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
