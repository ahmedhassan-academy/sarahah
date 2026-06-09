const pool = require('../config/db');

// Free, no-key network lookup. ip-api.com returns the ISP/company plus a
// `mobile` flag (cellular network = mobile data) and `proxy`/`hosting` flags.
// HTTP is fine here because the call is server-to-server, and every result is
// cached in the `ip_net` table so we stay well under the 45 req/min free limit.
const ENDPOINT = 'http://ip-api.com/json';
const FIELDS = 'status,message,isp,org,mobile,proxy,hosting,query';

const MAX_LOOKUPS_PER_REQUEST = 20;
const FETCH_TIMEOUT_MS = 2500;

function shape(row) {
  if (!row) return null;
  return {
    status: row.status,
    isp: row.isp || null,
    org: row.org || null,
    is_mobile: row.is_mobile ?? null,
    is_proxy: row.is_proxy ?? null,
    is_hosting: row.is_hosting ?? null,
  };
}

function isPrivateIp(ip) {
  if (!ip) return true;
  if (ip === '::1' || ip === '127.0.0.1' || ip === 'localhost') return true;
  if (ip.startsWith('::ffff:')) ip = ip.slice(7); // IPv4-mapped IPv6
  if (/^10\./.test(ip)) return true;
  if (/^192\.168\./.test(ip)) return true;
  if (/^172\.(1[6-9]|2\d|3[01])\./.test(ip)) return true;
  if (/^169\.254\./.test(ip)) return true; // link-local
  if (/^(fc|fd)/i.test(ip)) return true; // unique local IPv6
  if (/^fe80:/i.test(ip)) return true; // link-local IPv6
  return false;
}

async function upsert(ip, data) {
  await pool.query(
    `INSERT INTO ip_net (ip, status, isp, org, is_mobile, is_proxy, is_hosting, looked_up_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
     ON CONFLICT (ip) DO UPDATE SET
       status = EXCLUDED.status, isp = EXCLUDED.isp, org = EXCLUDED.org,
       is_mobile = EXCLUDED.is_mobile, is_proxy = EXCLUDED.is_proxy,
       is_hosting = EXCLUDED.is_hosting, looked_up_at = NOW()`,
    [ip, data.status, data.isp, data.org, data.is_mobile, data.is_proxy, data.is_hosting]
  );
}

async function lookupAndCache(ip) {
  if (isPrivateIp(ip)) {
    const row = { status: 'private', isp: null, org: null, is_mobile: null, is_proxy: null, is_hosting: null };
    await upsert(ip, row).catch(() => {});
    return shape(row);
  }

  let data = { status: 'fail', isp: null, org: null, is_mobile: null, is_proxy: null, is_hosting: null };
  try {
    if (typeof fetch !== 'function') throw new Error('fetch unavailable');
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
    const resp = await fetch(`${ENDPOINT}/${encodeURIComponent(ip)}?fields=${FIELDS}`, {
      signal: controller.signal,
    });
    clearTimeout(timer);
    const json = await resp.json();
    if (json && json.status === 'success') {
      data = {
        status: 'ok',
        isp: json.isp || null,
        org: json.org || null,
        is_mobile: Boolean(json.mobile),
        is_proxy: Boolean(json.proxy),
        is_hosting: Boolean(json.hosting),
      };
    }
  } catch (err) {
    console.warn('[ipNet] lookup failed for', ip, '-', err.message);
  }
  await upsert(ip, data).catch(() => {});
  return shape(data);
}

// Resolve network info for a list of IPs. Reads everything cached in one query,
// then fetches a bounded number of the still-unknown IPs. Returns Map<ip, net>.
async function getNetForIps(ips) {
  const unique = [...new Set((ips || []).filter(Boolean))];
  const result = new Map();
  if (!unique.length) return result;

  try {
    const { rows } = await pool.query(
      `SELECT ip, status, isp, org, is_mobile, is_proxy, is_hosting
         FROM ip_net WHERE ip = ANY($1::text[])`,
      [unique]
    );
    for (const r of rows) result.set(r.ip, shape(r));
  } catch (err) {
    console.warn('[ipNet] cache read failed -', err.message);
  }

  const missing = unique.filter((ip) => !result.has(ip)).slice(0, MAX_LOOKUPS_PER_REQUEST);
  await Promise.all(
    missing.map(async (ip) => {
      const net = await lookupAndCache(ip);
      if (net) result.set(ip, net);
    })
  );
  return result;
}

module.exports = { getNetForIps, isPrivateIp };
