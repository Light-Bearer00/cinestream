/**
 * Watch Progress Utility
 * Stores progress per user using JWT decode for user-specific keys
 */

function getUserKey() {
  if (typeof window === 'undefined') return 'guest';
  try {
    const token = localStorage.getItem('cinestream_token');
    if (!token) return 'guest';
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.id || 'guest';
  } catch { return 'guest'; }
}

// ── Movies ────────────────────────────────────────────────────────────────────
export function saveMovieProgress(movieId, currentTime, duration, meta = {}) {
  if (typeof window === 'undefined') return;
  const key = `rq_movie_${getUserKey()}_${movieId}`;
  const percent = duration > 0 ? Math.round((currentTime / duration) * 100) : 0;
  localStorage.setItem(key, JSON.stringify({
    movieId, currentTime, duration, percent,
    title: meta.title || '', poster: meta.poster || '',
    updatedAt: Date.now(),
  }));
}

export function getMovieProgress(movieId) {
  if (typeof window === 'undefined') return null;
  try {
    const key = `rq_movie_${getUserKey()}_${movieId}`;
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

// ── TV Episodes ───────────────────────────────────────────────────────────────
export function saveEpisodeProgress(showId, season, episode, currentTime, duration, meta = {}) {
  if (typeof window === 'undefined') return;
  const key = `rq_tv_${getUserKey()}_${showId}_s${season}e${episode}`;
  const percent = duration > 0 ? Math.round((currentTime / duration) * 100) : 0;
  localStorage.setItem(key, JSON.stringify({
    showId, season, episode, currentTime, duration, percent,
    title: meta.title || '', poster: meta.poster || '', showTitle: meta.showTitle || '',
    updatedAt: Date.now(),
  }));
  // Also save last watched for this show
  const showKey = `rq_show_${getUserKey()}_${showId}`;
  localStorage.setItem(showKey, JSON.stringify({ season, episode, currentTime, duration, percent, updatedAt: Date.now() }));
}

export function getEpisodeProgress(showId, season, episode) {
  if (typeof window === 'undefined') return null;
  try {
    const key = `rq_tv_${getUserKey()}_${showId}_s${season}e${episode}`;
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

export function getShowLastWatched(showId) {
  if (typeof window === 'undefined') return null;
  try {
    const key = `rq_show_${getUserKey()}_${showId}`;
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

// ── Get all continue watching items ──────────────────────────────────────────
export function getAllContinueWatching() {
  if (typeof window === 'undefined') return [];
  const userId = getUserKey();
  const items = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (!key.includes(`_${userId}_`)) continue;
    try {
      const data = JSON.parse(localStorage.getItem(key));
      if (!data || data.percent < 2 || data.percent > 95) continue;
      if (key.startsWith('rq_movie_')) items.push({ type: 'movie', ...data });
      else if (key.startsWith('rq_tv_') && !key.startsWith('rq_show_')) items.push({ type: 'tv', ...data });
    } catch {}
  }
  return items.sort((a, b) => b.updatedAt - a.updatedAt).slice(0, 20);
}

export function clearMovieProgress(movieId) {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(`rq_movie_${getUserKey()}_${movieId}`);
}

export function formatTimeRemaining(currentTime, duration) {
  if (!duration || !currentTime) return '';
  const remaining = duration - currentTime;
  if (remaining <= 0) return 'Finished';
  const mins = Math.floor(remaining / 60);
  if (mins < 60) return `${mins}m left`;
  const hrs = Math.floor(mins / 60);
  const rem = mins % 60;
  return rem > 0 ? `${hrs}h ${rem}m left` : `${hrs}h left`;
}