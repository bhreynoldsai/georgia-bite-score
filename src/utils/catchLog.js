// Local, on-device catch log. This is what turns the app from a read-only
// dashboard into a tool anglers actually use trip after trip.
const KEY = 'georgia-bites-catch-log';

export function loadCatches() {
  try {
    const raw = localStorage.getItem(KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function save(catches) {
  try { localStorage.setItem(KEY, JSON.stringify(catches)); } catch { /* storage unavailable */ }
}

export function addCatch(entry) {
  const id = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : String(Date.now());
  const next = [{ id, ...entry }, ...loadCatches()];
  save(next);
  return next;
}

export function deleteCatch(id) {
  const next = loadCatches().filter((c) => c.id !== id);
  save(next);
  return next;
}
