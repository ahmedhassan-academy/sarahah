const SUBDOMAIN_HOST = 'saraha.pro';

function matchesSubdomainHost(host) {
  return host === SUBDOMAIN_HOST || host.endsWith(`.${SUBDOMAIN_HOST}`);
}

export function emailHandle(email) {
  if (!email) return null;
  const local = String(email).split('@')[0] || '';
  const clean = local.toLowerCase().replace(/[^a-z0-9]/g, '');
  return clean.slice(0, 63) || null;
}

export function publicHandle(user) {
  if (!user) return '';
  return user.handle || emailHandle(user.email) || user.username || '';
}

export function getSubdomainUsername() {
  if (typeof window === 'undefined') return null;
  const host = window.location.hostname;
  if (!matchesSubdomainHost(host)) return null;
  if (host === SUBDOMAIN_HOST) return null;
  const prefix = host.slice(0, -SUBDOMAIN_HOST.length - 1);
  if (!prefix || prefix === 'www' || prefix.includes('.')) return null;
  return prefix;
}

export function profileUrl(handleOrUser) {
  const handle =
    typeof handleOrUser === 'string' ? handleOrUser : publicHandle(handleOrUser);
  if (!handle) return '';
  if (typeof window === 'undefined') return `/${handle}`;
  const { protocol, host } = window.location;
  if (matchesSubdomainHost(host)) {
    return `${protocol}//${SUBDOMAIN_HOST}/${handle}`;
  }
  return `${protocol}//${host}/${handle}`;
}

// Origin where Google sign-in is allowed to run. Google forbids wildcard
// JavaScript origins, so per-account subdomains can never be registered —
// sign-in always happens on the apex (www) host, which is registered.
export function rootOrigin() {
  if (typeof window === 'undefined') return '';
  const { protocol, hostname } = window.location;
  if (matchesSubdomainHost(hostname)) return `${protocol}//www.${SUBDOMAIN_HOST}`;
  return window.location.origin;
}

// Cookie domain that is shared across every saraha.pro subdomain, so a session
// set on the apex is visible on each profile subdomain. Null in dev (localhost),
// where the default current-host scope is correct.
export function rootCookieDomain() {
  if (typeof window === 'undefined') return null;
  if (matchesSubdomainHost(window.location.hostname)) return `.${SUBDOMAIN_HOST}`;
  return null;
}
