/**
 * Watch Progress Utility
 * Compatible with all key formats
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
  const userId = getUserKey();
  const percent = duration > 0 ? Math.round((currentTime / duration) * 100) : 0;
  const data = {
    movieId, currentTime, duration, percent,
    title: meta.title || '', poster: meta.poster || '',
    updatedAt: Date.now(),
  };
  // Save with both key formats for compatibility
  localStorage.setItem(`rq_movie_${userId}_${movieId}`, JSON.stringify(data));
  localStorage.setItem(`movie_progress_${movieId}`, JSON.stringify(data));
}

export function getMovieProgress(movieId) {
  if (typeof window === 'undefined') return null;
  try {
    const userId = getUserKey();
    // Try new key first, then old key
    const raw = localStorage.getItem(`rq_movie_${userId}_${movieId}`)
      || localStorage.getItem(`movie_progress_${movieId}`);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

export function clearMovieProgress(movieId) {
  if (typeof window === 'undefined') return;
  const userId = getUserKey();
  localStorage.removeItem(`rq_movie_${userId}_${movieId}`);
  localStorage.removeItem(`movie_progress_${movieId}`);
}

// ── TV Episodes ───────────────────────────────────────────────────────────────
export function saveEpisodeProgress(showId, season, episode, currentTime, duration, meta = {}) {
  if (typeof window === 'undefined') return;
  const userId = getUserKey();
  const percent = duration > 0 ? Math.round((currentTime / duration) * 100) : 0;
  const data = {
    showId, season, episode, currentTime, duration, percent,
    title: meta.title || '', poster: meta.poster || '', showTitle: meta.showTitle || '',
    updatedAt: Date.now(),
  };
  // Save with both key formats
  localStorage.setItem(`rq_tv_${userId}_${showId}_s${season}e${episode}`, JSON.stringify(data));
  localStorage.setItem(`tv_progress_${showId}_${season}_${episode}`, JSON.stringify(data));

  // Save last watched for show
  const showData = { season, episode, currentTime, duration, percent, updatedAt: Date.now() };
  localStorage.setItem(`rq_show_${userId}_${showId}`, JSON.stringify(showData));
  localStorage.setItem(`show_last_${showId}`, JSON.stringify(showData));
}

export function getEpisodeProgress(showId, season, episode) {
  if (typeof window === 'undefined') return null;
  try {
    const userId = getUserKey();
    const raw = localStorage.getItem(`rq_tv_${userId}_${showId}_s${season}e${episode}`)
      || localStorage.getItem(`tv_progress_${showId}_${season}_${episode}`);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

export function getShowLastWatched(showId) {
  if (typeof window === 'undefined') return null;
  try {
    const userId = getUserKey();
    const raw = localStorage.getItem(`rq_show_${userId}_${showId}`)
      || localStorage.getItem(`show_last_${showId}`);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

// ── Get all continue watching items ──────────────────────────────────────────
export function getAllContinueWatching() {
  if (typeof window === 'undefined') return [];
  try {
    const userId = getUserKey();
    const items = [];
    const seen = new Set();

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key) continue;
      try {
        // Match both new and old key formats
        const isNewMovie = key.startsWith(`rq_movie_${userId}_`);
        const isOldMovie = key.startsWith('movie_progress_');
        const isNewTv = key.startsWith(`rq_tv_${userId}_`) && !key.startsWith(`rq_show_`);
        const isOldTv = key.startsWith('tv_progress_');

        if (!isNewMovie && !isOldMovie && !isNewTv && !isOldTv) continue;

        const data = JSON.parse(localStorage.getItem(key));
        if (!data || data.percent < 2 || data.percent > 95) continue;

        // Dedup by id
        const dedupKey = isNewMovie || isOldMovie
          ? `movie_${data.movieId}`
          : `tv_${data.showId}_${data.season}_${data.episode}`;
        if (seen.has(dedupKey)) continue;
        seen.add(dedupKey);

        if (isNewMovie || isOldMovie) items.push({ type: 'movie', ...data });
        else items.push({ type: 'tv', ...data });
      } catch {}
    }
    return items.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0)).slice(0, 20);
  } catch { return []; }
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
