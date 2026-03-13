/**
 * Movie Detail Page - Fixed version
 * - Handles seeded movies (archive.org MP4 direct links)
 * - Handles scraped movies (embed sources like autoembed, vidsrc etc.)
 * - Poster fallback when image fails to load
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Image from 'next/image';
import Link from 'next/link';
import { movieApi, userApi } from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import VideoPlayer from '../../components/player/VideoPlayer';
import MovieCard from '../../components/cards/MovieCard';
import { FiStar, FiClock, FiCalendar, FiHeart, FiPlay, FiGlobe, FiServer } from 'react-icons/fi';
import AdBlockBanner from '../../components/ui/AdBlockBanner';
import { saveMovieProgress, getMovieProgress } from '../../utils/watchProgress';

export default function MoviePage() {
  const router = useRouter();
  const { id } = router.query;
  const { user } = useAuth();

  const [movie,      setMovie]      = useState(null);
  const [related,    setRelated]    = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [showPlayer, setShowPlayer] = useState(false);
  const [isFav,      setIsFav]      = useState(false);
  const [imgError,   setImgError]   = useState(false);
  const [resumeTime,  setResumeTime]  = useState(0);

  useEffect(() => {
    if (!id) return;
    async function load() {
      setLoading(true);
      setShowPlayer(false);
      setImgError(false);
      try {
        const [movieRes, relatedRes] = await Promise.all([
          movieApi.getById(id),
          movieApi.getRelated(id),
        ]);
        setMovie(movieRes.data);
        setRelated(relatedRes.data);
        // Load saved progress for resume
        const saved = getMovieProgress(id);
        if (saved && saved.percent >= 2 && saved.percent < 95) {
          setResumeTime(saved.currentTime);
        } else {
          setResumeTime(0);
        }
      } catch (err) {
        console.error('Failed to load movie:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  useEffect(() => {
    if (user && id && showPlayer) {
      userApi.addToHistory(id, 0).catch(() => {});
    }
  }, [user, id, showPlayer]);

  const handleToggleFav = async () => {
    if (!user) { router.push('/auth/login'); return; }
    try {
      await userApi.toggleFavorite(id);
      setIsFav(!isFav);
    } catch (err) { console.error(err); }
  };

  // Build stream sources from whatever the movie has stored
  function getStreamSources(movie) {
    if (movie.streamSources?.length > 0) return movie.streamSources;
    if (movie.streamUrl) {
      return [{
        provider: movie.streamUrl.includes('archive.org') ? 'Internet Archive' : 'direct',
        label: 'Server 1',
        url: movie.streamUrl,
        quality: 'auto',
        isHLS: movie.streamUrl.endsWith('.m3u8'),
      }];
    }
    return [];
  }

  // Called by VideoPlayer every 5 seconds
  const handleProgress = (currentTime, duration) => {
    if (!movie || !currentTime) return;
    const realDuration = duration > 0 ? duration
      : movie.duration > 0 ? movie.duration * 60
      : 7200;
    saveMovieProgress(movie._id, currentTime, realDuration, {
      title:  movie.title,
      poster: movie.poster,
    });
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

  const streamSources = getStreamSources(movie);
  const primaryUrl    = streamSources[0]?.url || '';

  return (
    <>
      <Head>
        <title>{movie.title} — CineStream</title>
        <meta name="description" content={movie.description} />
      </Head>

      {/* Backdrop */}
      <div className="relative h-[50vh] min-h-80 overflow-hidden">
        {(movie.backdrop || movie.poster) && !imgError ? (
          <Image
            src={movie.backdrop || movie.poster}
            alt={movie.title}
            fill
            className="object-cover object-top"
            priority
            unoptimized
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-cinema-card to-cinema-black flex items-center justify-center">
            <span className="text-8xl opacity-10">🎬</span>
          </div>
        )}
        <div className="hero-gradient absolute inset-0" />
        <div className="bottom-gradient absolute bottom-0 left-0 right-0 h-60" />
      </div>

      {/* Main content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-32 pb-16">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Poster */}
          <div className="hidden lg:block">
            <div className="sticky top-24 aspect-[2/3] rounded-2xl overflow-hidden shadow-2xl border border-cinema-border bg-cinema-card">
              {movie.poster && !imgError ? (
                <Image src={movie.poster} alt={movie.title} fill className="object-cover" unoptimized onError={() => setImgError(true)}/>
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center gap-3">
                  <span className="text-6xl">🎬</span>
                  <p className="text-cinema-muted text-sm text-center px-4">{movie.title}</p>
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
              {movie.year > 0 && <div className="flex items-center gap-1.5"><FiCalendar size={13}/><span>{movie.year}</span></div>}
              {movie.duration > 0 && <div className="flex items-center gap-1.5"><FiClock size={13}/><span>{movie.duration} min</span></div>}
              {movie.rating > 0 && (
                <div className="flex items-center gap-1.5">
                  <FiStar className="text-cinema-gold fill-cinema-gold" size={13}/>
                  <span className="text-cinema-gold font-semibold">{Number(movie.rating).toFixed(1)}</span>
                  <span>/10</span>
                </div>
              )}
              {movie.language && <div className="flex items-center gap-1.5"><FiGlobe size={13}/><span>{movie.language}</span></div>}
              {streamSources.length > 0 && (
                <div className="flex items-center gap-1.5 text-green-400">
                  <FiServer size={13}/>
                  <span>{streamSources.length} server{streamSources.length > 1 ? 's' : ''} available</span>
                </div>
              )}
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
                <span className="text-cinema-text">{movie.cast.slice(0, 6).join(', ')}</span>
              </div>
            )}

            <div className="flex flex-wrap gap-3">
              {streamSources.length > 0 ? (
                <button onClick={() => setShowPlayer(!showPlayer)}
                  className="flex items-center gap-2 bg-cinema-accent hover:bg-red-700 text-white font-semibold px-8 py-3 rounded-full transition-all shadow-lg">
                  <FiPlay size={18} className="fill-white"/>
                  {showPlayer ? 'Hide Player' : 'Watch Now'}
                </button>
              ) : (
                <div className="flex items-center gap-2 bg-cinema-border text-cinema-muted font-semibold px-8 py-3 rounded-full">
                  <FiPlay size={18}/> No Stream Available
                </div>
              )}
              <button onClick={handleToggleFav}
                className={`flex items-center gap-2 px-6 py-3 rounded-full border transition-all ${
                  isFav ? 'bg-cinema-accent/20 border-cinema-accent text-cinema-accent'
                        : 'border-cinema-border text-cinema-muted hover:border-cinema-accent hover:text-cinema-accent'
                }`}>
                <FiHeart size={18} className={isFav ? 'fill-cinema-accent' : ''}/>
                {isFav ? 'Favorited' : 'Favorite'}
              </button>
            </div>

            {/* Resume banner */}
            {!showPlayer && resumeTime > 0 && (
              <div className="flex items-center gap-3 bg-cinema-card border border-cinema-accent/30 rounded-xl px-4 py-3">
                <FiPlay size={16} className="text-cinema-accent shrink-0" />
                <p className="text-cinema-text text-sm flex-1">
                  You watched <span className="text-white font-semibold">{Math.floor(resumeTime / 60)}m</span> — resume where you left off?
                </p>
                <button
                  onClick={() => setShowPlayer(true)}
                  className="text-cinema-accent text-sm font-semibold hover:underline shrink-0"
                >
                  Resume
                </button>
              </div>
            )}

            {/* Video Player */}
            {showPlayer && streamSources.length > 0 && (
              <div className="mt-4 animate-slide-up">
                <h2 className="text-2xl text-white mb-3"
                  style={{ fontFamily: 'Bebas Neue, serif', letterSpacing: '0.1em' }}>
                  Now Playing
                </h2>
                <VideoPlayer
                  streamUrl={primaryUrl}
                  streamSources={streamSources}
                  title={movie.title}
                  onProgress={handleProgress}
                  startTime={resumeTime}
                />
                <div className="mt-3 flex flex-wrap gap-2">
                  {streamSources.map((s, i) => (
                    <span key={i} className="text-xs bg-cinema-dark border border-cinema-border text-cinema-muted px-3 py-1 rounded-full">
                      {s.label || `Server ${i + 1}`} · {s.provider}
                    </span>
                  ))}
                </div>
                <p className="text-cinema-muted text-xs mt-2">
                  💡 If one server doesn't work, switch source. Space = play/pause · F = fullscreen · M = mute · ←→ = seek
                </p>
                <AdBlockBanner />
              </div>
            )}
          </div>
        </div>

        {related.length > 0 && (
          <div className="mt-12">
            <h2 className="text-3xl text-white mb-6"
              style={{ fontFamily: 'Bebas Neue, serif', letterSpacing: '0.1em' }}>
              You May Also Like
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {related.map((m) => (<MovieCard key={m._id} movie={m} size="sm"/>))}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
