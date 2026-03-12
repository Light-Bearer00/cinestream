/**
 * Search Page
 * Full-text search with genre + year filters.
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { movieApi } from '../../utils/api';
import MovieCard from '../../components/cards/MovieCard';
import { MovieCardSkeleton } from '../../components/ui/Skeleton';
import { FiSearch, FiFilter } from 'react-icons/fi';

const GENRES = ['Action', 'Comedy', 'Drama', 'Horror', 'Sci-Fi', 'Romance', 'Documentary', 'Classic', 'Thriller', 'Western'];
const YEARS = Array.from({ length: 120 }, (_, i) => 2024 - i);

export default function SearchPage() {
  const router = useRouter();
  const { q, genre: qGenre, year: qYear } = router.query;

  const [query, setQuery] = useState('');
  const [genre, setGenre] = useState('');
  const [year, setYear] = useState('');
  const [movies, setMovies] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);

  // Sync from URL params
  useEffect(() => {
    if (q) setQuery(q);
    if (qGenre) setGenre(qGenre);
    if (qYear) setYear(qYear);
  }, [q, qGenre, qYear]);

  useEffect(() => {
    search();
  }, [query, genre, year, page]);

  async function search() {
    setLoading(true);
    try {
      const params = { page, limit: 24 };
      if (query) params.search = query;
      if (genre) params.genre = genre;
      if (year) params.year = year;

      const res = await movieApi.getAll(params);
      setMovies(res.data.movies);
      setTotal(res.data.total);
    } catch (err) {
      console.error('Search error:', err);
    } finally {
      setLoading(false);
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    search();
  };

  const clearFilters = () => {
    setQuery('');
    setGenre('');
    setYear('');
    setPage(1);
  };

  return (
    <>
      <Head>
        <title>Search Movies — CineStream</title>
      </Head>

      <div className="min-h-screen pt-24 pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        {/* Search header */}
        <div className="mb-8 animate-slide-up">
          <h1
            className="text-4xl md:text-5xl text-white mb-6"
            style={{ fontFamily: 'Bebas Neue, serif', letterSpacing: '0.1em' }}
          >
            Browse Movies
          </h1>

          <form onSubmit={handleSubmit} className="flex gap-3 flex-wrap">
            {/* Search input */}
            <div className="flex-1 min-w-64 relative">
              <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-cinema-muted" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by title..."
                className="w-full bg-cinema-card border border-cinema-border rounded-full pl-11 pr-4 py-3 text-cinema-text placeholder-cinema-muted outline-none focus:border-cinema-accent transition-colors"
              />
            </div>

            {/* Filter toggle */}
            <button
              type="button"
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-4 py-3 rounded-full border transition-colors ${
                showFilters || genre || year
                  ? 'border-cinema-accent text-cinema-accent bg-cinema-accent/10'
                  : 'border-cinema-border text-cinema-muted hover:border-cinema-accent hover:text-cinema-accent'
              }`}
            >
              <FiFilter size={16} /> Filters {(genre || year) && '•'}
            </button>

            <button
              type="submit"
              className="bg-cinema-accent hover:bg-red-700 text-white px-6 py-3 rounded-full transition-colors font-medium"
            >
              Search
            </button>
          </form>

          {/* Filter panel */}
          {showFilters && (
            <div className="mt-4 flex flex-wrap gap-4 p-4 bg-cinema-card border border-cinema-border rounded-2xl animate-slide-up">
              {/* Genre filter */}
              <div className="flex-1 min-w-48">
                <label className="text-cinema-muted text-xs block mb-2">Genre</label>
                <select
                  value={genre}
                  onChange={(e) => { setGenre(e.target.value); setPage(1); }}
                  className="w-full bg-cinema-dark border border-cinema-border rounded-lg px-3 py-2 text-cinema-text outline-none focus:border-cinema-accent"
                >
                  <option value="">All Genres</option>
                  {GENRES.map((g) => <option key={g} value={g}>{g}</option>)}
                </select>
              </div>

              {/* Year filter */}
              <div className="flex-1 min-w-48">
                <label className="text-cinema-muted text-xs block mb-2">Year</label>
                <select
                  value={year}
                  onChange={(e) => { setYear(e.target.value); setPage(1); }}
                  className="w-full bg-cinema-dark border border-cinema-border rounded-lg px-3 py-2 text-cinema-text outline-none focus:border-cinema-accent"
                >
                  <option value="">All Years</option>
                  {YEARS.filter(y => y >= 1900).map((y) => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>

              <button
                onClick={clearFilters}
                className="text-cinema-muted hover:text-cinema-accent text-sm self-end pb-2 transition-colors"
              >
                Clear all
              </button>
            </div>
          )}
        </div>

        {/* Results count */}
        <p className="text-cinema-muted text-sm mb-6">
          {loading ? 'Searching...' : `${total} movie${total !== 1 ? 's' : ''} found`}
        </p>

        {/* Movie grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6">
          {loading
            ? Array.from({ length: 18 }).map((_, i) => <MovieCardSkeleton key={i} />)
            : movies.map((movie) => <MovieCard key={movie._id} movie={movie} size="sm" />)
          }
        </div>

        {/* Empty state */}
        {!loading && movies.length === 0 && (
          <div className="text-center py-24">
            <p className="text-6xl mb-4">🎬</p>
            <p className="text-cinema-muted text-xl">No movies found</p>
            <button onClick={clearFilters} className="text-cinema-accent hover:underline mt-2 text-sm">
              Clear filters
            </button>
          </div>
        )}

        {/* Pagination */}
        {!loading && total > 24 && (
          <div className="flex justify-center gap-3 mt-10">
            <button
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1}
              className="px-4 py-2 border border-cinema-border rounded-lg text-cinema-muted hover:border-cinema-accent hover:text-cinema-accent disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              Previous
            </button>
            <span className="px-4 py-2 text-cinema-muted text-sm">
              Page {page} of {Math.ceil(total / 24)}
            </span>
            <button
              onClick={() => setPage(page + 1)}
              disabled={page >= Math.ceil(total / 24)}
              className="px-4 py-2 border border-cinema-border rounded-lg text-cinema-muted hover:border-cinema-accent hover:text-cinema-accent disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </>
  );
}
