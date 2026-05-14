/**
 * Watch Progress Utility - RoyalQueen
 */

function getUserKey() {
  if (typeof window === 'undefined') return 'guest';
  try {
    const token = localStorage.getItem('cinestream_token');
    if (!token) return 'guest';
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.id || 'guest';
  } catch (e) { return 'guest'; }
}

export function saveMovieProgress(movieId, currentTime, duration, meta) {
  if (typeof window === 'undefined') return;
  if (!meta) meta = {};
  var userId = getUserKey();
  var percent = duration > 0 ? Math.round((currentTime / duration) * 100) : 0;
  var data = JSON.stringify({
    movieId: movieId,
    currentTime: currentTime,
    duration: duration,
    percent: percent,
    title: meta.title || '',
    poster: meta.poster || '',
    updatedAt: Date.now(),
  });
  localStorage.setItem('rq_movie_' + userId + '_' + movieId, data);
}

export function getMovieProgress(movieId) {
  if (typeof window === 'undefined') return null;
  try {
    var userId = getUserKey();
    var raw = localStorage.getItem('rq_movie_' + userId + '_' + movieId);
    return raw ? JSON.parse(raw) : null;
  } catch (e) { return null; }
}

export function clearMovieProgress(movieId) {
  if (typeof window === 'undefined') return;
  var userId = getUserKey();
  localStorage.removeItem('rq_movie_' + userId + '_' + movieId);
}

export function saveEpisodeProgress(showId, season, episode, currentTime, duration, meta) {
  if (typeof window === 'undefined') return;
  if (!meta) meta = {};
  var userId = getUserKey();
  var percent = duration > 0 ? Math.round((currentTime / duration) * 100) : 0;
  var data = JSON.stringify({
    showId: showId,
    season: season,
    episode: episode,
    currentTime: currentTime,
    duration: duration,
    percent: percent,
    title: meta.title || '',
    poster: meta.poster || '',
    showTitle: meta.showTitle || '',
    updatedAt: Date.now(),
  });
  localStorage.setItem('rq_tv_' + userId + '_' + showId + '_s' + season + 'e' + episode, data);
  localStorage.setItem('rq_show_' + userId + '_' + showId, JSON.stringify({
    season: season,
    episode: episode,
    currentTime: currentTime,
    duration: duration,
    percent: percent,
    updatedAt: Date.now(),
  }));
}

export function getEpisodeProgress(showId, season, episode) {
  if (typeof window === 'undefined') return null;
  try {
    var userId = getUserKey();
    var raw = localStorage.getItem('rq_tv_' + userId + '_' + showId + '_s' + season + 'e' + episode);
    return raw ? JSON.parse(raw) : null;
  } catch (e) { return null; }
}

export function getShowLastWatched(showId) {
  if (typeof window === 'undefined') return null;
  try {
    var userId = getUserKey();
    var raw = localStorage.getItem('rq_show_' + userId + '_' + showId);
    return raw ? JSON.parse(raw) : null;
  } catch (e) { return null; }
}

export function getAllContinueWatching() {
  if (typeof window === 'undefined') return [];
  try {
    var userId = getUserKey();
    var items = [];
    for (var i = 0; i < localStorage.length; i++) {
      var key = localStorage.key(i);
      if (!key) continue;
      try {
        var isMovie = key.indexOf('rq_movie_' + userId + '_') === 0;
        var isTv = key.indexOf('rq_tv_' + userId + '_') === 0;
        if (!isMovie && !isTv) continue;
        var data = JSON.parse(localStorage.getItem(key));
        if (!data || data.percent < 2 || data.percent > 95) continue;
        if (isMovie) items.push({ type: 'movie', movieId: data.movieId, currentTime: data.currentTime, duration: data.duration, percent: data.percent, title: data.title, poster: data.poster, updatedAt: data.updatedAt });
        else items.push({ type: 'tv', showId: data.showId, season: data.season, episode: data.episode, currentTime: data.currentTime, duration: data.duration, percent: data.percent, title: data.title, poster: data.poster, showTitle: data.showTitle, updatedAt: data.updatedAt });
      } catch (e) {}
    }
    return items.sort(function(a, b) { return (b.updatedAt || 0) - (a.updatedAt || 0); }).slice(0, 20);
  } catch (e) { return []; }
}

export function formatTimeRemaining(currentTime, duration) {
  if (!duration || !currentTime) return '';
  var remaining = duration - currentTime;
  if (remaining <= 0) return 'Finished';
  var mins = Math.floor(remaining / 60);
  if (mins < 60) return mins + 'm left';
  var hrs = Math.floor(mins / 60);
  var rem = mins % 60;
  return rem > 0 ? hrs + 'h ' + rem + 'm left' : hrs + 'h left';
}