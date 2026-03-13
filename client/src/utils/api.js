/**
 * API Utility
 * Axios instance + helper functions for all API calls.
 */

import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

// Create axios instance
const api = axios.create({
  baseURL: `${API_URL}/api`,
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT token to every request if available
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('cinestream_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ─── Movie API ────────────────────────────────────────────────────────────────
export const movieApi = {
  getAll: (params = {}) => api.get('/movies', { params }),
  getById: (id) => api.get(`/movies/${id}`),
  getRelated: (id) => api.get(`/movies/${id}/related`),
  getGenres: () => api.get('/movies/genres'),
  search: (query, filters = {}) =>
    api.get('/movies', { params: { search: query, ...filters } }),
  incrementView: (id) => api.post(`/movies/${id}/view`),
};

// ─── Auth API ─────────────────────────────────────────────────────────────────
export const authApi = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  getMe: () => api.get('/auth/me'),
};

// ─── User API ─────────────────────────────────────────────────────────────────
export const userApi = {
  getFavorites: () => api.get('/users/favorites'),
  toggleFavorite: (movieId) => api.post(`/users/favorites/${movieId}`),
  getHistory: () => api.get('/users/history'),
  addToHistory: (movieId, progress) =>
    api.post(`/users/history/${movieId}`, { progress }),
};

// ─── Admin API ────────────────────────────────────────────────────────────────
export const adminApi = {
  getMovies: () => api.get('/admin/movies'),
  fetchMovieInfo: (title, year) =>
    api.get('/admin/fetch-movie-info', { params: { title, year } }),
  createMovie: (formData) =>
    api.post('/admin/movies', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  updateMovie: (id, formData) =>
    api.put(`/admin/movies/${id}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  deleteMovie: (id) => api.delete(`/admin/movies/${id}`),
  getStats: () => api.get('/admin/stats'),
  getUsers: () => api.get('/admin/users'),
};

// ─── TV API ───────────────────────────────────────────────────────────────────
export const tvApi = {
  getAll:     (params = {}) => api.get('/tv', { params }),
  getById:    (id)          => api.get(`/tv/${id}`),
  getSeason:  (id, season)  => api.get(`/tv/${id}/season/${season}`),
  getEpisode: (id, s, e)    => api.get(`/tv/${id}/season/${s}/episode/${e}`),
  getGenres:  ()                => api.get('/tv/genres'),
};

// ─── TV Scraper API ───────────────────────────────────────────────────────────
export const tvScraperApi = {
  search:    (q, page = 1)                  => api.get('/tv-scraper/search',  { params: { q, page } }),
  popular:   (category = 'popular', page=1) => api.get('/tv-scraper/popular', { params: { category, page } }),
  details:   (tmdbId, seasons = false)      => api.get(`/tv-scraper/details/${tmdbId}`, { params: { seasons } }),
  import:    (shows)                        => api.post('/tv-scraper/import',  { shows }),
  deleteAll: ()                             => api.delete('/tv-scraper/delete-all', { data: { confirm: 'DELETE_ALL_SHOWS' } }),
};

// ─── Scraper API ──────────────────────────────────────────────────────────────
export const scraperApi = {
  search:    (q, page = 1)             => api.get('/scraper/search',   { params: { q, page } }),
  popular:   (category = 'popular', page = 1) => api.get('/scraper/popular', { params: { category, page } }),
  byGenre:   (genre, page = 1)         => api.get('/scraper/by-genre', { params: { genre, page } }),
  details:   (tmdbId)                  => api.get(`/scraper/details/${tmdbId}`),
  import:    (movies)                  => api.post('/scraper/import',   { movies }),
  deleteAll: ()                        => api.delete('/scraper/delete-all', { data: { confirm: 'DELETE_ALL_MOVIES' } }),
  genres:    ()                        => api.get('/scraper/genres'),
};

export default api;
