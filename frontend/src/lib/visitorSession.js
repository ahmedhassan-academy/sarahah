import { rootCookieDomain } from './host';

// Visitor (Google) session shared across every saraha.pro subdomain via a
// cookie scoped to `.saraha.pro`. localStorage is read only as a legacy
// fallback for visitors signed in before this change.
const TOKEN_KEY = 'sarahah_google_token';
const PROFILE_KEY = 'sarahah_google_profile';
const LEGACY_KEY = 'sarahah:googleAuth';
const MAX_AGE = 60 * 60 * 24 * 30; // 30 days

function writeCookie(name, value) {
  let cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${MAX_AGE}; samesite=Lax`;
  const domain = rootCookieDomain();
  if (domain) cookie += `; domain=${domain}`;
  if (window.location.protocol === 'https:') cookie += '; secure';
  document.cookie = cookie;
}

function deleteCookie(name) {
  const domain = rootCookieDomain();
  const dom = domain ? `; domain=${domain}` : '';
  document.cookie = `${name}=; path=/; max-age=0${dom}`;
}

function readCookie(name) {
  const prefix = `${name}=`;
  const parts = document.cookie ? document.cookie.split('; ') : [];
  for (const part of parts) {
    if (part.startsWith(prefix)) return decodeURIComponent(part.slice(prefix.length));
  }
  return null;
}

export function getVisitorToken() {
  return readCookie(TOKEN_KEY) || localStorage.getItem(TOKEN_KEY) || null;
}

export function getVisitorProfile() {
  try {
    localStorage.removeItem(LEGACY_KEY);
  } catch {
    /* ignore */
  }
  if (!getVisitorToken()) return null;
  const raw = readCookie(PROFILE_KEY) || localStorage.getItem(PROFILE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function saveVisitorSession(token, profile) {
  writeCookie(TOKEN_KEY, token);
  writeCookie(PROFILE_KEY, JSON.stringify(profile));
}

export function clearVisitorSession() {
  deleteCookie(TOKEN_KEY);
  deleteCookie(PROFILE_KEY);
  try {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(PROFILE_KEY);
  } catch {
    /* ignore */
  }
}
