/**
 * Search Page with Advanced Filters
 * client/src/pages/search.jsx
 */
import { useState, useEffect, useCallback } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { movieApi, tvApi } from '../utils/api';
import MovieCard from '../components/cards/MovieCard';
import { FiSearch, FiFilter, FiX, FiFilm, FiTv } from 'react-icons/fi';

const GENRES = ['Action','Adventure','Animation','Comedy','Crime','Documentary','Drama','Family','Fantasy','History','Horror','Musical','Mystery','Romance','Sci-Fi','Thriller','War','Western'];
const YEARS  = Array.from({ length: 35 }, (_, i) => 2024 - i);
const SORTS  = [
  { label: 'Newest',     value: 'createdAt' },
  { label: 'Rating',     value: 'rating' },
  { label: 'Year',       value: 'year' },
  { label: 'Most Viewed',value: 'views' },
  { label: 'Title A-Z',  value: 'title' },
];

export default function SearchPage() {
  const router = useRouter();
  const { q: initialQ } = router.query;

  const [query,     setQuery]     = useState(initialQ || '');
  const [type,      setType]      = useState('movies'); // movies | tv
  const [genre,     setGenre]     = useState('');
  const [sort,      setSort]      = useState('rating');
  const [results,   setResults]   = useState([]);
  const [loading,   setLoading]   = useState(false);
  const [showFilter,setShowFilter] = useState(false);
  const [page,      setPage]      = useState(1);
  const [hasMore,   setHasMore]   = useState(false);

  const search = useCallback(async (reset = true) => {
    setLoading(true);
    const currentPage = reset ? 1 : page;
    try {
      const params = { search: query, sort, limit: 20, page: currentPage };
      if (genre) params.genre = genre;
      const res = type === 'movies'
        ? await movieApi.getAll(params)
        : await tvApi.getAll(params);
      const items = res.data.movies || res.data.shows || [];
      setResults(prev => reset ? items : [...prev, ...items]);
      setHasMore(items.length === 20);
      if (reset) setPage(1);
    } catch {}
    setLoading(false);
  }, [query, type, genre, sort, page]);

  useEffect(() => { search(true); }, [type, genre, sort]);
  useEffect(() => { if (initialQ) { setQuery(initialQ); } }, [initialQ]);

  const handleSearch = (e) => {
    e.preventDefault();
    search(true);
  };

  return (
    <>
      <Head><title>Search — RoyalQueen</title></Head>
      <div className="min-h-screen pt-24 pb-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Search Bar */}
        <form onSubmit={handleSearch} className="flex gap-3 mb-6">
          <div className="relative flex-1">
            <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-cinema-muted" size={18} />
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search movies, TV shows..."
              className="w-full bg-cinema-card border border-cinema-border rounded-2xl pl-11 pr-4 py-3.5 text-white placeholder-cinema-muted focus:outline-none focus:border-cinema-accent transition-colors"
            />
            {query && (
              <button type="button" onClick={() => { setQuery(''); search(true); }}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-cinema-muted hover:text-white">
                <FiX size={16} />
              </button>
            )}
          </div>
          <button type="submit"
            className="bg-cinema-accent hover:bg-red-700 text-white px-6 py-3 rounded-2xl font-semibold transition-colors">
            Search
          </button>
          <button type="button" onClick={() => setShowFilter(!showFilter)}
            className={`flex items-center gap-2 px-5 py-3 rounded-2xl border transition-colors ${
              showFilter || genre ? 'border-cinema-accent text-cinema-accent' : 'border-cinema-border text-cinema-muted hover:border-cinema-accent hover:text-white'
            }`}>
            <FiFilter size={16} />
            Filters {genre && '•'}
          </button>
        </form>

        {/* Type Toggle */}
        <div className="flex gap-2 mb-5">
          {[['movies', FiFilm, 'Movies'], ['tv', FiTv, 'TV Shows']].map(([val, Icon, label]) => (
            <button key={val} onClick={() => { setType(val); setResults([]); }}
              className={`flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-medium transition-all ${
                type === val ? 'bg-cinema-accent text-white' : 'bg-cinema-card border border-cinema-border text-cinema-muted hover:text-white'
              }`}>
              <Icon size={15} /> {label}
            </button>
          ))}
        </div>

        {/* Filters Panel */}
        {showFilter && (
          <div className="bg-cinema-card border border-cinema-border rounded-2xl p-5 mb-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {/* Genre */}
              <div>
                <label className="text-cinema-muted text-xs mb-2 block">Genre</label>
                <div className="flex flex-wrap gap-2">
                  <button onClick={() => setGenre('')}
                    className={`text-xs px-3 py-1.5 rounded-full border transition-all ${
                      !genre ? 'bg-cinema-accent border-cinema-accent text-white' : 'border-cinema-border text-cinema-muted hover:border-cinema-accent hover:text-white'
                    }`}>All</button>
                  {GENRES.map(g => (
                    <button key={g} onClick={() => setGenre(g === genre ? '' : g)}
                      className={`text-xs px-3 py-1.5 rounded-full border transition-all ${
                        genre === g ? 'bg-cinema-accent border-cinema-accent text-white' : 'border-cinema-border text-cinema-muted hover:border-cinema-accent hover:text-white'
                      }`}>{g}</button>
                  ))}
                </div>
              </div>
              {/* Sort */}
              <div>
                <label className="text-cinema-muted text-xs mb-2 block">Sort By</label>
                <div className="flex flex-wrap gap-2">
                  {SORTS.map(s => (
                    <button key={s.value} onClick={() => setSort(s.value)}
                      className={`text-xs px-3 py-1.5 rounded-full border transition-all ${
                        sort === s.value ? 'bg-cinema-accent border-cinema-accent text-white' : 'border-cinema-border text-cinema-muted hover:border-cinema-accent hover:text-white'
                      }`}>{s.label}</button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Results */}
        {loading && results.length === 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {Array(10).fill(0).map((_, i) => <div key={i} className="aspect-[2/3] shimmer rounded-xl" />)}
          </div>
        ) : results.length > 0 ? (
          <>
            <p className="text-cinema-muted text-sm mb-4">{results.length} results {query && `for "${query}"`}</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {results.map(item => <MovieCard key={item._id} movie={item} size="sm" />)}
            </div>
            {hasMore && (
              <div className="text-center mt-8">
                <button onClick={() => { setPage(p => p + 1); search(false); }}
                  disabled={loading}
                  className="bg-cinema-card border border-cinema-border text-cinema-text hover:border-cinema-accent px-8 py-3 rounded-xl transition-all">
                  {loading ? 'Loading...' : 'Load More'}
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-20">
            <FiSearch className="text-cinema-muted mx-auto mb-4" size={48} />
            <p className="text-cinema-muted text-lg">No results found</p>
            {query && <p className="text-cinema-muted text-sm mt-1">Try a different search term or filters</p>}
          </div>
        )}
      </div>
    </>
  );
}
