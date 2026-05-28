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
    return `${protocol}//${handle}.${SUBDOMAIN_HOST}`;
  }
  return `${protocol}//${host}/${handle}`;
}
