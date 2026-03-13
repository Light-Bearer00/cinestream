/**
 * watchProgress.js
 * Per-user watch progress saved to localStorage.
 * Key includes user ID so each account has its own list.
 */

const BASE_KEY  = 'rq_watch_progress';
const MAX_ITEMS = 20;

// ── Get storage key scoped to current user ──────────────────────────────────
function getStorageKey() {
  if (typeof window === 'undefined') return BASE_KEY;
  try {
    // Try to read user from AuthContext stored token
    const token = localStorage.getItem('cinestream_token');
    if (!token) return BASE_KEY;
    // Decode JWT payload (middle part) to get user id — no library needed
    const payload = JSON.parse(atob(token.split('.')[1]));
    const uid = payload?.id || payload?.userId || payload?.sub || '';
    return uid ? `${BASE_KEY}_${uid}` : BASE_KEY;
  } catch {
    return BASE_KEY;
  }
}

function getAll() {
  if (typeof window === 'undefined') return {};
  try { return JSON.parse(localStorage.getItem(getStorageKey()) || '{}'); }
  catch { return {}; }
}

function saveAll(data) {
  if (typeof window === 'undefined') return;
  try { localStorage.setItem(getStorageKey(), JSON.stringify(data)); } catch {}
}

// ── Save movie progress ─────────────────────────────────────────────────────
export function saveMovieProgress(movieId, currentTime, duration, meta = {}) {
  if (!movieId || currentTime < 10) return;
  const all     = getAll();
  const percent = duration > 0 ? Math.round((currentTime / duration) * 100) : 0;
  all[`movie_${movieId}`] = {
    type:        'movie',
    id:          movieId,
    currentTime,
    duration,
    percent:     Math.min(percent, 99),
    title:       meta.title  || '',
    poster:      meta.poster || '',
    updatedAt:   Date.now(),
  };
  const entries = Object.entries(all).sort((a, b) => (b[1].updatedAt || 0) - (a[1].updatedAt || 0));
  saveAll(Object.fromEntries(entries.slice(0, MAX_ITEMS)));
}

export function getMovieProgress(movieId) {
  return getAll()[`movie_${movieId}`] || null;
}

// ── Save episode progress ───────────────────────────────────────────────────
export function saveEpisodeProgress(showId, season, episode, currentTime, duration, meta = {}) {
  if (!showId || currentTime < 10) return;
  const all     = getAll();
  const percent = duration > 0 ? Math.round((currentTime / duration) * 100) : 0;
  const data = {
    type:        'episode',
    id:          showId,
    season,
    episode,
    currentTime,
    duration,
    percent:     Math.min(percent, 99),
    title:       meta.title     || '',
    poster:      meta.poster    || '',
    showTitle:   meta.showTitle || '',
    updatedAt:   Date.now(),
  };
  all[`tv_${showId}_s${season}_e${episode}`] = data;
  // Also save a "last watched" pointer for the show
  all[`tv_${showId}_last`] = { ...data, type: 'tv_last' };
  const entries = Object.entries(all).sort((a, b) => (b[1].updatedAt || 0) - (a[1].updatedAt || 0));
  saveAll(Object.fromEntries(entries.slice(0, MAX_ITEMS * 3)));
}

export function getEpisodeProgress(showId, season, episode) {
  return getAll()[`tv_${showId}_s${season}_e${episode}`] || null;
}

export function getShowLastWatched(showId) {
  return getAll()[`tv_${showId}_last`] || null;
}

// ── Continue watching list ──────────────────────────────────────────────────
export function getContinueWatching() {
  const all = getAll();
  return Object.values(all)
    .filter(item => {
      if (!item || !item.type) return false;
      if (item.type !== 'movie' && item.type !== 'tv_last') return false;
      if (!item.currentTime || item.currentTime < 10) return false;
      // Show items between 2% and 95% watched
      const pct = typeof item.percent === 'number' ? item.percent : (
        item.duration > 0 ? Math.round((item.currentTime / item.duration) * 100) : 0
      );
      return pct >= 2 && pct < 95;
    })
    .sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0))
    .slice(0, 12);
}

export function removeFromContinueWatching(id) {
  const all = getAll();
  delete all[`movie_${id}`];
  delete all[`tv_${id}_last`];
  saveAll(all);
}

// ── Helpers ─────────────────────────────────────────────────────────────────
export function formatTimeRemaining(currentTime, duration) {
  if (!duration || !currentTime) return '';
  const remaining = Math.max(0, duration - currentTime);
  const mins = Math.floor(remaining / 60);
  if (mins <= 0) return 'Almost done';
  if (mins >= 60) {
    const hrs = Math.floor(mins / 60);
    const m   = mins % 60;
    return m > 0 ? `${hrs}h ${m}m left` : `${hrs}h left`;
  }
  return `${mins}m left`;
}

export function formatWatched(currentTime) {
  if (!currentTime || currentTime < 60) return '';
  const mins = Math.floor(currentTime / 60);
  if (mins >= 60) {
    const hrs = Math.floor(mins / 60);
    const m   = mins % 60;
    return m > 0 ? `${hrs}h ${m}m watched` : `${hrs}h watched`;
  }
  return `${mins}m watched`;
}
