/**
 * Homepage — Advanced streaming platform layout
 * Sections: Hero (auto-rotating) → Trending → Top 10 → Most Popular
 *           → New Releases → TV Shows → Genre rows
 */

import { useState, useEffect, useRef } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/router';
import { movieApi, tvApi } from '../utils/api';
import MovieRow from '../components/cards/MovieRow';
import TVShowRow from '../components/cards/TVShowRow';
import Top10Row from '../components/cards/Top10Row';
import ContinueWatchingRow from '../components/cards/ContinueWatchingRow';
import { FiPlay, FiInfo, FiStar, FiChevronLeft, FiChevronRight } from 'react-icons/fi';

const GENRE_ROWS = ['Action', 'Comedy', 'Drama', 'Horror', 'Sci-Fi', 'Documentary'];

// ── Auto-rotating Hero Banner ──────────────────────────────────────────────
function HeroCarousel({ movies }) {
  const [current, setCurrent] = useState(0);
  const timerRef = useRef(null);
  const router = useRouter();

  const startTimer = () => {
    clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setCurrent(c => (c + 1) % movies.length);
    }, 6000);
  };

  useEffect(() => {
    if (movies.length > 1) startTimer();
    return () => clearInterval(timerRef.current);
  }, [movies.length]);

  const go = (dir) => {
    setCurrent(c => (c + dir + movies.length) % movies.length);
    startTimer();
  };

  if (!movies.length) return null;
  const movie = movies[current];

  return (
    <div className="relative w-full h-[70vh] min-h-[500px] overflow-hidden">
      {/* Backdrop */}
      {movies.map((m, i) => (
        <div
          key={m._id}
          className="absolute inset-0 transition-opacity duration-1000"
          style={{ opacity: i === current ? 1 : 0 }}
        >
          {m.backdrop || m.poster ? (
            <Image
              src={m.backdrop || m.poster}
              alt={m.title}
              fill
              className="object-cover object-top"
              priority={i === 0}
              unoptimized
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-cinema-card to-cinema-black" />
          )}
        </div>
      ))}

      {/* Gradient overlays */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/50 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-t from-cinema-black via-transparent to-transparent" />

      {/* Content */}
      <div className="absolute inset-0 flex items-center">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <div className="max-w-xl">
            {/* Badges */}
            <div className="flex items-center gap-2 mb-3 flex-wrap">
              {movie.isTrending && (
                <span className="text-xs bg-cinema-accent text-white px-2.5 py-1 rounded-full font-semibold">
                  🔥 Trending
                </span>
              )}
              {movie.isFeatured && (
                <span className="text-xs bg-yellow-500 text-black px-2.5 py-1 rounded-full font-semibold">
                  ⭐ Featured
                </span>
              )}
              {movie.genre?.[0] && (
                <span className="text-xs border border-white/30 text-white/80 px-2.5 py-1 rounded-full">
                  {movie.genre[0]}
                </span>
              )}
            </div>

            <h1
              className="text-5xl md:text-7xl text-white leading-none mb-3"
              style={{ fontFamily: 'Bebas Neue, serif', letterSpacing: '0.03em' }}
            >
              {movie.title}
            </h1>

            <div className="flex items-center gap-4 mb-4 text-sm text-white/70">
              {movie.year > 0 && <span>{movie.year}</span>}
              {movie.rating > 0 && (
                <div className="flex items-center gap-1">
                  <FiStar size={12} className="text-cinema-gold fill-cinema-gold" />
                  <span className="text-cinema-gold font-semibold">{movie.rating.toFixed(1)}</span>
                </div>
              )}
              {movie.duration > 0 && <span>{movie.duration} min</span>}
            </div>

            <p className="text-white/70 text-sm leading-relaxed mb-6 line-clamp-3">
              {movie.description}
            </p>

            <div className="flex items-center gap-3">
              <button
                onClick={() => router.push(`/movie/${movie._id}`)}
                className="flex items-center gap-2 bg-white text-black px-6 py-3 rounded-xl font-bold text-sm hover:bg-white/90 transition-colors"
              >
                <FiPlay size={16} className="fill-black" /> Play Now
              </button>
              <Link
                href={`/movie/${movie._id}`}
                className="flex items-center gap-2 bg-white/20 backdrop-blur text-white px-6 py-3 rounded-xl font-semibold text-sm hover:bg-white/30 transition-colors border border-white/20"
              >
                <FiInfo size={16} /> More Info
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Carousel navigation arrows */}
      {movies.length > 1 && (
        <>
          <button
            onClick={() => go(-1)}
            className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/50 hover:bg-black/80 rounded-full flex items-center justify-center text-white transition-colors z-10"
          >
            <FiChevronLeft size={20} />
          </button>
          <button
            onClick={() => go(1)}
            className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/50 hover:bg-black/80 rounded-full flex items-center justify-center text-white transition-colors z-10"
          >
            <FiChevronRight size={20} />
          </button>

          {/* Dot indicators */}
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-2 z-10">
            {movies.map((_, i) => (
              <button
                key={i}
                onClick={() => { setCurrent(i); startTimer(); }}
                className={`rounded-full transition-all ${
                  i === current ? 'w-6 h-2 bg-cinema-accent' : 'w-2 h-2 bg-white/40 hover:bg-white/70'
                }`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────
export default function HomePage() {
  const [heroMovies,   setHeroMovies]   = useState([]);
  const [trending,     setTrending]     = useState([]);
  const [top10,        setTop10]        = useState([]);
  const [popular,      setPopular]      = useState([]);
  const [newReleases,  setNewReleases]  = useState([]);
  const [allMovies,    setAllMovies]    = useState([]);
  const [genreMovies,  setGenreMovies]  = useState({});
  const [tvShows,      setTvShows]      = useState([]);
  const [loading,      setLoading]      = useState(true);

  useEffect(() => {
    async function loadHome() {
      try {
        const [featuredRes, trendingRes, allRes, tvRes] = await Promise.all([
          movieApi.getAll({ featured: 'true', limit: 8 }),
          movieApi.getAll({ trending: 'true', limit: 20 }),
          movieApi.getAll({ limit: 60, sort: 'rating' }),
          tvApi.getAll({ limit: 12 }),
        ]);

        const featured = featuredRes.data.movies || [];
        const all      = allRes.data.movies || [];
        const trending = trendingRes.data.movies || [];

        // Hero: featured first, fill with highest rated
        const heroPool = [
          ...featured,
          ...all.filter(m => !featured.find(f => f._id === m._id)),
        ].slice(0, 6);
        setHeroMovies(heroPool);

        setTrending(trending.slice(0, 12));

        // Top 10 — by rating then views
        const top10 = [...all]
          .sort((a, b) => (b.rating - a.rating) || ((b.views || 0) - (a.views || 0)))
          .slice(0, 10);
        setTop10(top10);

        // Most popular — trending or all sorted by views
        const popularMovies = trending.length >= 8
          ? trending.slice(0, 12)
          : [...all].sort((a, b) => (b.views || 0) - (a.views || 0)).slice(0, 12);
        setPopular(popularMovies);

        // New releases — sorted by year then createdAt
        const newRel = [...all]
          .sort((a, b) => (b.year - a.year) || new Date(b.createdAt) - new Date(a.createdAt))
          .slice(0, 12);
        setNewReleases(newRel);

        setAllMovies(all.slice(0, 12));
        setTvShows(tvRes.data.shows || []);

        // Genre buckets
        const byGenre = {};
        for (const movie of all) {
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

  if (loading) {
    return (
      <>
        <Head><title>RoyalQueen — Watch Movies & TV Shows</title></Head>
        <div className="w-full h-[70vh] bg-cinema-card animate-pulse" />
        <div className="max-w-7xl mx-auto px-4 mt-8 space-y-12">
          {[1,2,3,4].map(i => (
            <div key={i} className="space-y-3">
              <div className="h-7 w-48 bg-cinema-card animate-pulse rounded" />
              <div className="flex gap-4">
                {[1,2,3,4,5,6].map(j => (
                  <div key={j} className="w-44 aspect-[2/3] bg-cinema-card animate-pulse rounded-lg shrink-0" />
                ))}
              </div>
            </div>
          ))}
        </div>
      </>
    );
  }

  return (
    <>
      <Head>
        <title>RoyalQueen — Watch Movies & TV Shows</title>
        <meta name="description" content="Stream thousands of movies and TV shows on RoyalQueen." />
      </Head>

      {/* Hero */}
      <HeroCarousel movies={heroMovies} />

      {/* Content rows */}
      <div className="space-y-8 pb-16 relative z-10 -mt-4">

        <ContinueWatchingRow />

        {trending.length > 0 && (
          <MovieRow title="🔥 Trending Now" movies={trending} viewAllHref="/search?trending=true" />
        )}

        {top10.length >= 5 && (
          <div className="pt-6 pb-10">
            <Top10Row title="Top 10 on RoyalQueen" movies={top10} />
          </div>
        )}

        {popular.length > 0 && (
          <MovieRow title="Most Popular" movies={popular} viewAllHref="/search" />
        )}

        {newReleases.length > 0 && (
          <MovieRow title="New Releases" movies={newReleases} viewAllHref="/search?sort=year" />
        )}

        {tvShows.length > 0 && (
          <TVShowRow title="TV Shows" shows={tvShows} viewAllHref="/tv" />
        )}

        <MovieRow title="All Movies" movies={allMovies} viewAllHref="/search" />

        {GENRE_ROWS.map(genre =>
          genreMovies[genre]?.length > 0 ? (
            <MovieRow
              key={genre}
              title={genre}
              movies={genreMovies[genre]}
              viewAllHref={`/genre/${genre.toLowerCase()}`}
            />
          ) : null
        )}

        {genreMovies['Classic']?.length > 0 && (
          <MovieRow title="Classic Cinema" movies={genreMovies['Classic']} viewAllHref="/genre/classic" />
        )}
      </div>
    </>
  );
}
