// Request the sender's precise location through the browser Geolocation API.
//
// This always triggers the browser's native permission prompt — there is no way
// (and no intent) to obtain GPS-grade location without the sender's consent.
// Returns { lat, lon, accuracy } in degrees / metres when the sender allows it,
// or null when permission is denied, the API is unavailable, or it times out.
// Callers must treat null as "no location" and never block their flow on it.
export function requestGeolocation({ timeout = 8000 } = {}) {
  return new Promise((resolve) => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      resolve(null);
      return;
    }

    let settled = false;
    const done = (value) => {
      if (settled) return;
      settled = true;
      resolve(value);
    };

    try {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const c = pos && pos.coords;
          if (!c || !Number.isFinite(c.latitude) || !Number.isFinite(c.longitude)) {
            done(null);
            return;
          }
          done({
            lat: c.latitude,
            lon: c.longitude,
            accuracy: Number.isFinite(c.accuracy) ? c.accuracy : null,
          });
        },
        () => done(null), // denied / unavailable / timeout
        { enableHighAccuracy: true, timeout, maximumAge: 60000 }
      );
    } catch {
      done(null);
    }
  });
}
