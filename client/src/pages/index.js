/**
 * Homepage
 * Netflix-style layout with hero banner, trending, featured,
 * and genre-based rows.
 */

import { useState, useEffect } from 'react';
import Head from 'next/head';
import { movieApi } from '../utils/api';
import HeroBanner from '../components/cards/HeroBanner';
import MovieRow from '../components/cards/MovieRow';
import { MovieRowSkeleton, HeroSkeleton } from '../components/ui/Skeleton';

const GENRE_ROWS = ['Action', 'Comedy', 'Drama', 'Horror', 'Sci-Fi', 'Documentary'];

export default function HomePage() {
  const [featured, setFeatured] = useState(null);
  const [trending, setTrending] = useState([]);
  const [allMovies, setAllMovies] = useState([]);
  const [genreMovies, setGenreMovies] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadHome() {
      try {
        const [featuredRes, trendingRes, allRes] = await Promise.all([
          movieApi.getAll({ featured: 'true', limit: 5 }),
          movieApi.getAll({ trending: 'true', limit: 12 }),
          movieApi.getAll({ limit: 40 }),
        ]);

        const featuredMovies = featuredRes.data.movies;
        setFeatured(featuredMovies[0] || allRes.data.movies[0]);
        setTrending(trendingRes.data.movies);
        setAllMovies(allRes.data.movies);

        // Build per-genre map from all movies
        const byGenre = {};
        for (const movie of allRes.data.movies) {
          for (const g of (movie.genre || [])) {
            if (!byGenre[g]) byGenre[g] = [];
            if (byGenre[g].length < 12) byGenre[g].push(movie);
          }
        }
        setGenreMovies(byGenre);
      } catch (err) {
        console.error('Failed to load homepage:', err);
      } finally {
        setLoading(false);
      }
    }
    loadHome();
  }, []);

  return (
    <>
      <Head>
        <title>CineStream — Watch Classic Films</title>
        <meta name="description" content="Stream public-domain classic films for free." />
      </Head>

      {loading ? (
        <>
          <HeroSkeleton />
          <div className="mt-8 space-y-8">
            <MovieRowSkeleton />
            <MovieRowSkeleton />
            <MovieRowSkeleton />
          </div>
        </>
      ) : (
        <>
          {/* Hero */}
          <HeroBanner movie={featured} />

          {/* Content rows */}
          <div className="space-y-2 -mt-8 relative z-10">
            {trending.length > 0 && (
              <MovieRow
                title="🔥 Trending Now"
                movies={trending}
                viewAllHref="/search?trending=true"
              />
            )}

            <MovieRow
              title="All Movies"
              movies={allMovies.slice(0, 12)}
              viewAllHref="/search"
            />

            {/* Genre rows */}
            {GENRE_ROWS.map((genre) =>
              genreMovies[genre]?.length > 0 ? (
                <MovieRow
                  key={genre}
                  title={genre}
                  movies={genreMovies[genre]}
                  viewAllHref={`/genre/${genre.toLowerCase()}`}
                />
              ) : null
            )}

            {/* Classic / remaining */}
            {genreMovies['Classic']?.length > 0 && (
              <MovieRow
                title="Classic Cinema"
                movies={genreMovies['Classic']}
                viewAllHref="/genre/classic"
              />
            )}
          </div>
        </>
      )}
    </>
  );
}
