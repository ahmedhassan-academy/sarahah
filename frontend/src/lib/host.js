const SUBDOMAIN_HOST = 'saraha.pro';

function matchesSubdomainHost(host) {
  return host === SUBDOMAIN_HOST || host.endsWith(`.${SUBDOMAIN_HOST}`);
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

export function profileUrl(username) {
  if (!username) return '';
  if (typeof window === 'undefined') return `/${username}`;
  const { protocol, host } = window.location;
  if (matchesSubdomainHost(host)) {
    return `${protocol}//${username}.${SUBDOMAIN_HOST}`;
  }
  return `${protocol}//${host}/${username}`;
}
