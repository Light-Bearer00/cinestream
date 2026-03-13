/**
 * watchProgress.js
 * Saves and loads watch progress to/from localStorage.
 * Works for both movies and TV episodes.
 */

const STORAGE_KEY = 'rq_watch_progress';
const MAX_ITEMS   = 20; // keep last 20 items

function getAll() {
  if (typeof window === 'undefined') return {};
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
  } catch { return {}; }
}

function saveAll(data) {
  if (typeof window === 'undefined') return;
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); } catch {}
}

// ── Movie progress ────────────────────────────────────────────────────────────

export function saveMovieProgress(movieId, currentTime, duration, meta = {}) {
  if (!movieId || !duration || duration < 30) return;
  const all = getAll();
  all[`movie_${movieId}`] = {
    type:        'movie',
    id:          movieId,
    currentTime,
    duration,
    percent:     Math.round((currentTime / duration) * 100),
    title:       meta.title || '',
    poster:      meta.poster || '',
    updatedAt:   Date.now(),
  };
  // Prune to MAX_ITEMS most recent
  const entries = Object.entries(all).sort((a, b) => (b[1].updatedAt || 0) - (a[1].updatedAt || 0));
  const pruned  = Object.fromEntries(entries.slice(0, MAX_ITEMS));
  saveAll(pruned);
}

export function getMovieProgress(movieId) {
  const all = getAll();
  return all[`movie_${movieId}`] || null;
}

// ── TV Episode progress ───────────────────────────────────────────────────────

export function saveEpisodeProgress(showId, season, episode, currentTime, duration, meta = {}) {
  if (!showId || !duration || duration < 30) return;
  const all = getAll();
  // Save per-episode progress
  all[`tv_${showId}_s${season}_e${episode}`] = {
    type:        'episode',
    id:          showId,
    season,
    episode,
    currentTime,
    duration,
    percent:     Math.round((currentTime / duration) * 100),
    title:       meta.title || '',
    poster:      meta.poster || '',
    showTitle:   meta.showTitle || '',
    updatedAt:   Date.now(),
  };
  // Also update "last watched" for the show
  all[`tv_${showId}_last`] = {
    type:        'tv_last',
    id:          showId,
    season,
    episode,
    currentTime,
    duration,
    percent:     Math.round((currentTime / duration) * 100),
    title:       meta.title || '',
    poster:      meta.poster || '',
    showTitle:   meta.showTitle || '',
    updatedAt:   Date.now(),
  };
  const entries = Object.entries(all).sort((a, b) => (b[1].updatedAt || 0) - (a[1].updatedAt || 0));
  saveAll(Object.fromEntries(entries.slice(0, MAX_ITEMS * 3)));
}

export function getEpisodeProgress(showId, season, episode) {
  const all = getAll();
  return all[`tv_${showId}_s${season}_e${episode}`] || null;
}

export function getShowLastWatched(showId) {
  const all = getAll();
  return all[`tv_${showId}_last`] || null;
}

// ── Continue Watching list ────────────────────────────────────────────────────

export function getContinueWatching() {
  const all = getAll();
  return Object.values(all)
    .filter(item =>
      (item.type === 'movie' || item.type === 'tv_last') &&
      item.percent > 2 &&   // started watching
      item.percent < 95     // not finished
    )
    .sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0))
    .slice(0, 12);
}

export function removeFromContinueWatching(key) {
  const all = getAll();
  // Remove movie
  delete all[`movie_${key}`];
  // Remove tv last
  delete all[`tv_${key}_last`];
  saveAll(all);
}

// ── Format helpers ────────────────────────────────────────────────────────────

export function formatTimeRemaining(currentTime, duration) {
  const remaining = Math.max(0, duration - currentTime);
  const mins = Math.floor(remaining / 60);
  const secs = Math.floor(remaining % 60);
  if (mins >= 60) {
    const hrs = Math.floor(mins / 60);
    const m   = mins % 60;
    return `${hrs}h ${m}m left`;
  }
  if (mins > 0) return `${mins}m left`;
  return `${secs}s left`;
}
