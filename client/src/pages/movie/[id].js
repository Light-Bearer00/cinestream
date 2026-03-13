/**
 * Movie Detail Page
 * Shows movie info, video player, and related movies.
 * Saves watch progress to localStorage and resumes from last position.
 */

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Image from 'next/image';
import Link from 'next/link';
import { movieApi, userApi } from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import VideoPlayer from '../../components/player/VideoPlayer';
import MovieCard from '../../components/cards/MovieCard';
import { saveMovieProgress, getMovieProgress, formatTimeRemaining } from '../../utils/watchProgress';
import { FiStar, FiClock, FiCalendar, FiHeart, FiPlay, FiGlobe } from 'react-icons/fi';

export default function MoviePage() {
  const router = useRouter();
  const { id } = router.query;
  const { user } = useAuth();

  const [movie,      setMovie]      = useState(null);
  const [related,    setRelated]    = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [showPlayer, setShowPlayer] = useState(false);
  const [isFav,      setIsFav]      = useState(false);
  const [savedProgress, setSavedProgress] = useState(null);

  useEffect(() => {
    if (!id) return;
    async function load() {
      setLoading(true);
      setShowPlayer(false);
      try {
        const [movieRes, relatedRes] = await Promise.all([
          movieApi.getById(id),
          movieApi.getRelated(id),
        ]);
        setMovie(movieRes.data);
        setRelated(relatedRes.data);
        // Check for saved progress
        const prog = getMovieProgress(id);
        if (prog && prog.percent > 2 && prog.percent < 95) {
          setSavedProgress(prog);
        }
      } catch (err) {
        console.error('Failed to load movie:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  // Track in watch history
  useEffect(() => {
    if (user && id && showPlayer) {
      userApi.addToHistory(id, 0).catch(() => {});
      movieApi.incrementView?.(id).catch(() => {});
    }
  }, [user, id, showPlayer]);

  // Save progress callback — called every 5s by VideoPlayer
  // For iframes, duration from VideoPlayer is 7200 (default).
  // Override with real movie duration if available (movie.duration is in minutes).
  const handleProgress = useCallback((currentTime, durationFromPlayer) => {
    if (!movie) return;
    const realDuration = movie.duration > 0
      ? movie.duration * 60          // convert minutes → seconds
      : durationFromPlayer || 7200;  // fallback to player estimate
    saveMovieProgress(id, currentTime, realDuration, {
      title:  movie.title,
      poster: movie.poster,
    });
  }, [id, movie]);

  const handleToggleFav = async () => {
    if (!user) { router.push('/auth/login'); return; }
    try {
      await userApi.toggleFavorite(id);
      setIsFav(!isFav);
    } catch (err) { console.error(err); }
  };

  if (loading) {
    return (
      <div className="min-h-screen pt-20 px-6 max-w-7xl mx-auto">
        <div className="h-96 shimmer rounded-xl mb-8" />
        <div className="space-y-3">
          <div className="h-10 w-64 shimmer rounded" />
          <div className="h-4 w-full shimmer rounded" />
          <div className="h-4 w-3/4 shimmer rounded" />
        </div>
      </div>
    );
  }

  if (!movie) {
    return (
      <div className="min-h-screen pt-32 flex items-center justify-center">
        <div className="text-center">
          <p className="text-cinema-muted text-xl">Movie not found</p>
          <Link href="/" className="text-cinema-accent hover:underline mt-4 inline-block">Go Home</Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>{movie.title} — RoyalQueen</title>
        <meta name="description" content={movie.description} />
      </Head>

      {/* Backdrop */}
      <div className="relative h-[50vh] min-h-80 overflow-hidden">
        {(movie.backdrop || movie.poster) && (
          <Image src={movie.backdrop || movie.poster} alt={movie.title} fill className="object-cover object-top" priority unoptimized />
        )}
        <div className="hero-gradient absolute inset-0" />
        <div className="bottom-gradient absolute bottom-0 left-0 right-0 h-60" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-32 pb-16">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Poster */}
          <div className="hidden lg:block">
            <div className="sticky top-24 aspect-[2/3] rounded-2xl overflow-hidden shadow-2xl border border-cinema-border">
              {movie.poster ? (
                <Image src={movie.poster} alt={movie.title} fill className="object-cover" unoptimized />
              ) : (
                <div className="w-full h-full bg-cinema-card flex items-center justify-center text-6xl">🎬</div>
              )}
              {/* Progress bar on poster */}
              {savedProgress && (
                <div className="absolute bottom-0 left-0 right-0">
                  <div className="h-1.5 bg-white/20">
                    <div className="h-full bg-cinema-accent" style={{ width: `${savedProgress.percent}%` }} />
                  </div>
                  <div className="bg-black/70 text-cinema-accent text-xs text-center py-1 font-medium">
                    {formatTimeRemaining(savedProgress.currentTime, savedProgress.duration)}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Info + Player */}
          <div className="lg:col-span-2 space-y-6">

            <div className="flex flex-wrap gap-2 pt-8 lg:pt-0">
              {movie.genre?.map((g) => (
                <Link key={g} href={`/genre/${g.toLowerCase()}`}
                  className="text-xs text-cinema-accent border border-cinema-accent/40 px-2.5 py-1 rounded-full hover:bg-cinema-accent/10 transition-colors">
                  {g}
                </Link>
              ))}
            </div>

            <h1 className="text-4xl md:text-6xl text-white leading-none"
              style={{ fontFamily: 'Bebas Neue, serif', letterSpacing: '0.05em' }}>
              {movie.title}
            </h1>

            <div className="flex flex-wrap items-center gap-4 text-sm text-cinema-muted">
              {movie.year && <div className="flex items-center gap-1.5"><FiCalendar size={13} /><span>{movie.year}</span></div>}
              {movie.duration > 0 && <div className="flex items-center gap-1.5"><FiClock size={13} /><span>{movie.duration} min</span></div>}
              {movie.rating > 0 && (
                <div className="flex items-center gap-1.5">
                  <FiStar className="text-cinema-gold fill-cinema-gold" size={13} />
                  <span className="text-cinema-gold font-semibold">{movie.rating.toFixed(1)}</span>
                  <span>/10</span>
                </div>
              )}
              {movie.language && <div className="flex items-center gap-1.5"><FiGlobe size={13} /><span>{movie.language}</span></div>}
            </div>

            <p className="text-cinema-muted leading-relaxed">{movie.description}</p>

            {movie.director && (
              <div className="text-sm">
                <span className="text-cinema-muted">Director: </span>
                <span className="text-cinema-text">{movie.director}</span>
              </div>
            )}
            {movie.cast?.length > 0 && (
              <div className="text-sm">
                <span className="text-cinema-muted">Cast: </span>
                <span className="text-cinema-text">{movie.cast.join(', ')}</span>
              </div>
            )}

            {/* Action buttons */}
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => setShowPlayer(true)}
                className="flex items-center gap-2 bg-cinema-accent hover:bg-red-700 text-white font-semibold px-8 py-3 rounded-full transition-all shadow-lg hover:shadow-cinema-accent/30"
              >
                <FiPlay size={18} className="fill-white" />
                {savedProgress ? 'Resume' : 'Watch Now'}
              </button>

              {savedProgress && (
                <div className="flex items-center gap-2 bg-cinema-card border border-cinema-border px-4 py-3 rounded-full">
                  <div className="w-20 h-1.5 bg-white/20 rounded-full overflow-hidden">
                    <div className="h-full bg-cinema-accent rounded-full" style={{ width: `${savedProgress.percent}%` }} />
                  </div>
                  <span className="text-cinema-accent text-xs font-medium">
                    {formatTimeRemaining(savedProgress.currentTime, savedProgress.duration)}
                  </span>
                </div>
              )}

              <button onClick={handleToggleFav}
                className={`flex items-center gap-2 px-6 py-3 rounded-full border transition-all ${
                  isFav ? 'bg-cinema-accent/20 border-cinema-accent text-cinema-accent'
                        : 'border-cinema-border text-cinema-muted hover:border-cinema-accent hover:text-cinema-accent'
                }`}>
                <FiHeart size={18} className={isFav ? 'fill-cinema-accent' : ''} />
                {isFav ? 'Favorited' : 'Favorite'}
              </button>
            </div>

            {/* Video Player */}
            {showPlayer && (
              <div className="mt-4 animate-slide-up">
                <h2 className="text-2xl text-white mb-3"
                  style={{ fontFamily: 'Bebas Neue, serif', letterSpacing: '0.1em' }}>
                  Now Playing
                </h2>
                {movie.streamUrl || movie.streamSources?.length > 0 ? (
                  <VideoPlayer
                    streamUrl={movie.streamUrl}
                    streamSources={movie.streamSources || []}
                    title={movie.title}
                    onProgress={handleProgress}
                  />
                ) : (
                  <div className="aspect-video bg-cinema-card rounded-xl flex items-center justify-center border border-cinema-border">
                    <p className="text-cinema-muted">No stream URL configured for this movie.</p>
                  </div>
                )}
                <p className="text-cinema-muted text-xs mt-2">
                  Space (play/pause) · F (fullscreen) · ← → (seek 10s) · M (mute)
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Related Movies */}
        {related.length > 0 && (
          <div className="mt-12">
            <h2 className="text-3xl text-white mb-6"
              style={{ fontFamily: 'Bebas Neue, serif', letterSpacing: '0.1em' }}>
              You May Also Like
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {related.map((m) => <MovieCard key={m._id} movie={m} size="sm" />)}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
