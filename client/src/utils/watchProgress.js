/**
 * watchProgress.js
 * Saves and loads watch progress to/from localStorage.
 * Works for both movies (native + iframe) and TV episodes.
 *
 * For native video: currentTime/duration are real seconds.
 * For iframes: currentTime = elapsed watch time, duration = movie.duration*60 or 7200s default.
 */

const STORAGE_KEY = 'rq_watch_progress';
const MAX_ITEMS   = 20;

function getAll() {
  if (typeof window === 'undefined') return {};
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}'); }
  catch { return {}; }
}

function saveAll(data) {
  if (typeof window === 'undefined') return;
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); } catch {}
}

export function saveMovieProgress(movieId, currentTime, duration, meta = {}) {
  if (!movieId || currentTime < 10) return;
  const all = getAll();
  const percent = duration > 0 ? Math.round((currentTime / duration) * 100) : 0;
  all[`movie_${movieId}`] = {
    type:      'movie',
    id:        movieId,
    currentTime,
    duration,
    percent:   Math.min(percent, 99),
    title:     meta.title  || '',
    poster:    meta.poster || '',
    updatedAt: Date.now(),
  };
  const entries = Object.entries(all).sort((a, b) => (b[1].updatedAt||0) - (a[1].updatedAt||0));
  saveAll(Object.fromEntries(entries.slice(0, MAX_ITEMS)));
}

export function getMovieProgress(movieId) {
  return getAll()[`movie_${movieId}`] || null;
}

export function saveEpisodeProgress(showId, season, episode, currentTime, duration, meta = {}) {
  if (!showId || currentTime < 10) return;
  const all = getAll();
  const percent = duration > 0 ? Math.round((currentTime / duration) * 100) : 0;
  const data = {
    type:      'episode',
    id:        showId,
    season,
    episode,
    currentTime,
    duration,
    percent:   Math.min(percent, 99),
    title:     meta.title     || '',
    poster:    meta.poster    || '',
    showTitle: meta.showTitle || '',
    updatedAt: Date.now(),
  };
  all[`tv_${showId}_s${season}_e${episode}`] = data;
  all[`tv_${showId}_last`] = { ...data, type: 'tv_last' };
  const entries = Object.entries(all).sort((a, b) => (b[1].updatedAt||0) - (a[1].updatedAt||0));
  saveAll(Object.fromEntries(entries.slice(0, MAX_ITEMS * 3)));
}

export function getEpisodeProgress(showId, season, episode) {
  return getAll()[`tv_${showId}_s${season}_e${episode}`] || null;
}

export function getShowLastWatched(showId) {
  return getAll()[`tv_${showId}_last`] || null;
}

export function getContinueWatching() {
  const all = getAll();
  return Object.values(all)
    .filter(item =>
      (item.type === 'movie' || item.type === 'tv_last') &&
      item.currentTime > 10 &&
      item.percent < 95
    )
    .sort((a, b) => (b.updatedAt||0) - (a.updatedAt||0))
    .slice(0, 12);
}

export function removeFromContinueWatching(id) {
  const all = getAll();
  delete all[`movie_${id}`];
  delete all[`tv_${id}_last`];
  saveAll(all);
}

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
