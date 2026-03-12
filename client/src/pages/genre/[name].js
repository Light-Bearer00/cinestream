/**
 * Genre Page
 * Shows all movies for a specific genre.
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { movieApi } from '../../utils/api';
import MovieCard from '../../components/cards/MovieCard';
import { MovieCardSkeleton } from '../../components/ui/Skeleton';

export default function GenrePage() {
  const router = useRouter();
  const { name } = router.query;

  const [movies, setMovies] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  const displayName = name ? name.charAt(0).toUpperCase() + name.slice(1) : '';

  useEffect(() => {
    if (!name) return;
    setLoading(true);
    movieApi.getAll({ genre: displayName, limit: 40 })
      .then((res) => {
        setMovies(res.data.movies);
        setTotal(res.data.total);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [name]);

  return (
    <>
      <Head>
        <title>{displayName} Movies — CineStream</title>
      </Head>

      <div className="min-h-screen pt-24 pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="mb-8">
          <p className="text-cinema-muted text-sm mb-1">Genre</p>
          <h1
            className="text-5xl md:text-7xl text-white"
            style={{ fontFamily: 'Bebas Neue, serif', letterSpacing: '0.05em' }}
          >
            {displayName}
          </h1>
          <p className="text-cinema-muted mt-2 text-sm">{total} movies</p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6">
          {loading
            ? Array.from({ length: 12 }).map((_, i) => <MovieCardSkeleton key={i} />)
            : movies.map((m) => <MovieCard key={m._id} movie={m} size="sm" />)
          }
        </div>

        {!loading && movies.length === 0 && (
          <div className="text-center py-24 text-cinema-muted">
            No {displayName} movies found.
          </div>
        )}
      </div>
    </>
  );
}
