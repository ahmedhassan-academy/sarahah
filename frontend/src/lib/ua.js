// Lightweight, dependency-free user-agent parser.
// Good enough to turn a raw UA string into friendly "device / OS / browser"
// labels for the admin panel. Not meant to be exhaustive — it covers the
// common desktop and mobile cases and degrades gracefully to "Unknown".

function detectOS(ua) {
  // Windows 11 and 10 both report "Windows NT 10.0" — we can't tell them apart.
  if (/Windows NT 10\.0/.test(ua)) return { name: 'Windows 10/11', key: 'windows' };
  if (/Windows NT 6\.3/.test(ua)) return { name: 'Windows 8.1', key: 'windows' };
  if (/Windows NT 6\.2/.test(ua)) return { name: 'Windows 8', key: 'windows' };
  if (/Windows NT 6\.1/.test(ua)) return { name: 'Windows 7', key: 'windows' };
  if (/Windows/.test(ua)) return { name: 'Windows', key: 'windows' };

  if (/iPhone|iPad|iPod/.test(ua)) {
    const m = ua.match(/OS (\d+)[._](\d+)/);
    const ver = m ? ` ${m[1]}.${m[2]}` : '';
    return { name: `iOS${ver}`, key: 'apple' };
  }
  if (/Mac OS X/.test(ua)) {
    const m = ua.match(/Mac OS X (\d+)[._](\d+)/);
    const ver = m ? ` ${m[1]}.${m[2]}` : '';
    return { name: `macOS${ver}`, key: 'apple' };
  }
  if (/Android/.test(ua)) {
    const m = ua.match(/Android (\d+(?:\.\d+)?)/);
    return { name: m ? `Android ${m[1]}` : 'Android', key: 'android' };
  }
  if (/CrOS/.test(ua)) return { name: 'ChromeOS', key: 'chromeos' };
  if (/Linux/.test(ua)) return { name: 'Linux', key: 'linux' };
  return { name: 'Unknown', key: 'unknown' };
}

function detectBrowser(ua) {
  // Order matters: Edge/Opera/Samsung impersonate Chrome, Chrome impersonates Safari.
  let m;
  if ((m = ua.match(/Edg(?:A|iOS)?\/(\d+)/))) return { name: 'Edge', version: m[1] };
  if ((m = ua.match(/OPR\/(\d+)/)) || (m = ua.match(/Opera\/(\d+)/))) return { name: 'Opera', version: m[1] };
  if ((m = ua.match(/SamsungBrowser\/(\d+)/))) return { name: 'Samsung Internet', version: m[1] };
  if ((m = ua.match(/(?:CriOS|Chrome)\/(\d+)/))) return { name: 'Chrome', version: m[1] };
  if ((m = ua.match(/FxiOS\/(\d+)/)) || (m = ua.match(/Firefox\/(\d+)/))) return { name: 'Firefox', version: m[1] };
  if (/Safari/.test(ua) && (m = ua.match(/Version\/(\d+)/))) return { name: 'Safari', version: m[1] };
  return { name: 'Unknown', version: null };
}

// Type + a friendly "device name" + vendor where we can infer it.
function detectDevice(ua) {
  const isBot = /bot|crawl|spider|slurp|bing|preview|facebookexternalhit|whatsapp|telegram/i.test(ua);
  if (isBot) return { type: 'bot', name: 'Bot / crawler', vendor: null };

  if (/iPhone/.test(ua)) return { type: 'mobile', name: 'iPhone', vendor: 'Apple' };
  if (/iPad/.test(ua)) return { type: 'tablet', name: 'iPad', vendor: 'Apple' };

  if (/Android/.test(ua)) {
    const type = /Mobile/.test(ua) ? 'mobile' : 'tablet';
    // Try to pull the model: "...; SM-G991B Build/..." or "...; Pixel 7)"
    const m = ua.match(/;\s*([^;)]+?)\s*(?:Build\/|\))/);
    let model = m ? m[1].trim() : '';
    model = model.replace(/^wv$/i, '').trim(); // strip Android WebView marker
    let vendor = null;
    if (/^SM-|Samsung/i.test(model)) vendor = 'Samsung';
    else if (/^Pixel/i.test(model)) vendor = 'Google';
    else if (/^Redmi|^Mi |Xiaomi|^M2|^2\d{3}/i.test(model)) vendor = 'Xiaomi';
    else if (/^CPH|OPPO/i.test(model)) vendor = 'OPPO';
    const name = model && model.length <= 32
      ? (vendor ? `${vendor} ${model}` : model)
      : (type === 'tablet' ? 'Android tablet' : 'Android phone');
    return { type, name, vendor };
  }

  if (/Windows/.test(ua)) return { type: 'desktop', name: 'Windows PC', vendor: null };
  if (/Macintosh|Mac OS X/.test(ua)) return { type: 'desktop', name: 'Mac', vendor: 'Apple' };
  if (/CrOS/.test(ua)) return { type: 'desktop', name: 'Chromebook', vendor: 'Google' };
  if (/Linux/.test(ua)) return { type: 'desktop', name: 'Linux computer', vendor: null };
  return { type: 'unknown', name: 'Unknown device', vendor: null };
}

export function parseUserAgent(uaRaw) {
  const ua = String(uaRaw || '').trim();
  if (!ua) return null;
  const os = detectOS(ua);
  const browser = detectBrowser(ua);
  const device = detectDevice(ua);
  return { os, browser, device, raw: ua };
}
