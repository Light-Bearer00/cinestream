/**
 * Homepage — Advanced streaming platform layout
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
import RecommendationsRow from '../components/cards/RecommendationsRow';
import { FiPlay, FiInfo, FiStar, FiChevronLeft, FiChevronRight, FiVolume2, FiVolumeX } from 'react-icons/fi';

const GENRE_ROWS = ['Action', 'Comedy', 'Drama', 'Horror', 'Sci-Fi', 'Documentary'];

function extractTmdbId(movie) {
  const urls = [movie.streamUrl, ...(movie.streamSources || []).map(s => s.url)].filter(Boolean);
  for (const url of urls) {
    const m = url.match(/tmdb[=/](\d+)/i);
    if (m) return m[1];
  }
  return null;
}

const TMDB_KEY = 'd4c55464b2e3eb6c6ec8aa2173bf6e2d';
async function fetchTrailerKey(movie) {
  try {
    const search = await fetch(
      `https://api.themoviedb.org/3/search/movie?api_key=${TMDB_KEY}&query=${encodeURIComponent(movie.title)}&year=${movie.year}`
    ).then(r => r.json());
    const tmdbId = search.results?.[0]?.id;
    if (!tmdbId) return null;
    const videos = await fetch(
      `https://api.themoviedb.org/3/movie/${tmdbId}/videos?api_key=${TMDB_KEY}`
    ).then(r => r.json());
    const trailer = videos.results?.find(v => v.site === 'YouTube' && v.type === 'Trailer' && v.official)
      || videos.results?.find(v => v.site === 'YouTube' && v.type === 'Trailer')
      || videos.results?.find(v => v.site === 'YouTube' && v.type === 'Teaser');
    return trailer?.key || null;
  } catch { return null; }
}



/* ─── Name Change Announcement Popup ────────────────────────────────────────── */
function AnnouncementPopup() {
  const [visible, setVisible]     = useState(false);
  const [closing, setClosing]     = useState(false);
  const [countdown, setCountdown] = useState(5);
  const [canClose, setCanClose]   = useState(false);

  useEffect(() => {
    const SESSION_KEY = 'rq_announcement_seen';
    const EXPIRY_KEY  = 'rq_announcement_expiry';

    // Set expiry date = 1 week from first visit
    if (!localStorage.getItem(EXPIRY_KEY)) {
      const expiry = Date.now() + 7 * 24 * 60 * 60 * 1000; // 7 days
      localStorage.setItem(EXPIRY_KEY, expiry.toString());
    }

    const expiry = parseInt(localStorage.getItem(EXPIRY_KEY));
    const expired = Date.now() > expiry;

    // Don't show if week is over OR already seen this session
    if (expired || sessionStorage.getItem(SESSION_KEY)) return;

    // Show after short delay
    const t = setTimeout(() => {
      setVisible(true);
      sessionStorage.setItem(SESSION_KEY, '1');
    }, 800);
    return () => clearTimeout(t);
  }, []);

  // 5 second countdown before close button activates
  useEffect(() => {
    if (!visible) return;
    if (countdown === 0) { setCanClose(true); return; }
    const t = setTimeout(() => setCountdown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [visible, countdown]);

  function handleClose() {
    if (!canClose) return;
    setClosing(true);
    setTimeout(() => setVisible(false), 400);
  }

  if (!visible) return null;

  return (
    <div
      className="fixed inset-0 z-[9998] flex items-center justify-center p-4"
      style={{
        background: 'rgba(0,0,0,0.82)',
        backdropFilter: 'blur(7px)',
        animation: closing ? 'ann-fade-out 0.4s ease forwards' : 'ann-fade-in 0.4s ease forwards',
      }}
    >
      <style>{`
        @keyframes ann-fade-in  { from { opacity:0 } to { opacity:1 } }
        @keyframes ann-fade-out { from { opacity:1 } to { opacity:0 } }
        @keyframes ann-slide-up {
          from { opacity:0; transform: translateY(30px) scale(0.96); }
          to   { opacity:1; transform: translateY(0)    scale(1);    }
        }
        @keyframes ann-shimmer {
          0%   { background-position: -200% center; }
          100% { background-position:  200% center; }
        }
        @keyframes ann-glow {
          0%, 100% { box-shadow: 0 0 24px 4px rgba(220,38,38,0.25); }
          50%       { box-shadow: 0 0 48px 10px rgba(220,38,38,0.45); }
        }
        @keyframes ann-ring {
          0%   { transform: scale(1);    opacity: 0.6; }
          100% { transform: scale(1.8);  opacity: 0;   }
        }
        .ann-card {
          animation: ann-slide-up 0.5s cubic-bezier(.22,.68,0,1.2) forwards, ann-glow 3s ease-in-out infinite;
        }
        .ann-title-shimmer {
          background: linear-gradient(90deg, #fff 0%, #dc2626 40%, #f59e0b 60%, #fff 100%);
          background-size: 200% auto;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          animation: ann-shimmer 3s linear infinite;
        }
        .ann-ring {
          position: absolute;
          inset: 0;
          border-radius: 50%;
          border: 2px solid rgba(220,38,38,0.5);
          animation: ann-ring 1.8s ease-out infinite;
        }
      `}</style>

      <div
        className="ann-card relative w-full max-w-md rounded-2xl overflow-hidden"
        style={{
          background: 'linear-gradient(160deg, #1c1c1c 0%, #111 100%)',
          border: '1px solid rgba(220,38,38,0.35)',
        }}
      >
        {/* Top gradient bar */}
        <div style={{
          height: 4,
          background: 'linear-gradient(90deg, #dc2626, #f59e0b, #ec4899, #dc2626)',
          backgroundSize: '200% 100%',
          animation: 'ann-shimmer 3s linear infinite',
        }} />

        <div className="px-7 py-7">
          {/* Icon with rings */}
          <div className="flex justify-center mb-5">
            <div style={{ position: 'relative', width: 64, height: 64 }}>
              <div className="ann-ring" />
              <div className="ann-ring" style={{ animationDelay: '0.6s' }} />
              <div style={{
                width: 64, height: 64, borderRadius: '50%',
                background: 'linear-gradient(135deg, #dc2626, #991b1b)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 28, position: 'relative', zIndex: 1,
              }}>👑</div>
            </div>
          </div>

          {/* Announcement badge */}
          <div className="flex justify-center mb-4">
            <span style={{
              background: 'rgba(220,38,38,0.15)',
              border: '1px solid rgba(220,38,38,0.3)',
              color: '#dc2626',
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              padding: '4px 14px',
              borderRadius: 99,
            }}>📢 Announcement</span>
          </div>

          {/* Main message */}
          <div className="text-center mb-5">
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, marginBottom: 16, lineHeight: 1.6 }}>
              We have some exciting news to share with you
            </p>

            {/* Old name → New name */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, marginBottom: 20 }}>
              <div style={{ textAlign: 'center' }}>
                <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 11, marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Was</p>
                <p style={{
                  color: 'rgba(255,255,255,0.4)',
                  fontSize: 18,
                  fontWeight: 700,
                  fontFamily: 'Bebas Neue, serif',
                  letterSpacing: '0.05em',
                  textDecoration: 'line-through',
                  textDecorationColor: 'rgba(220,38,38,0.5)',
                }}>RoyalQueen</p>
              </div>
              <div style={{ fontSize: 22 }}>→</div>
              <div style={{ textAlign: 'center' }}>
                <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 11, marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Now</p>
                <p className="ann-title-shimmer" style={{
                  fontSize: 24,
                  fontWeight: 700,
                  fontFamily: 'Bebas Neue, serif',
                  letterSpacing: '0.05em',
                }}>ForeverQueen</p>
              </div>
            </div>

            {/* Reason */}
            <div style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.07)',
              borderRadius: 12,
              padding: '14px 16px',
            }}>
              <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: 13, lineHeight: 1.8 }}>
                Because no matter what happens,{' '}
                <span style={{ color: '#f59e0b', fontWeight: 600 }}>you will always be my Queen 👑</span>
                {' '}— and some things are simply{' '}
                <span style={{ color: '#dc2626', fontWeight: 600 }}>forever</span>.
              </p>
            </div>
          </div>

          {/* Close button with countdown */}
          <button
            onClick={handleClose}
            style={{
              width: '100%',
              padding: '12px',
              borderRadius: 14,
              border: 'none',
              cursor: canClose ? 'pointer' : 'not-allowed',
              background: canClose
                ? 'linear-gradient(135deg, #dc2626, #b91c1c)'
                : 'rgba(255,255,255,0.07)',
              color: canClose ? '#fff' : 'rgba(255,255,255,0.3)',
              fontWeight: 600,
              fontSize: 14,
              transition: 'all 0.3s ease',
              boxShadow: canClose ? '0 0 20px rgba(220,38,38,0.35)' : 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
            }}
          >
            {canClose ? (
              <>Got it! 💛</>
            ) : (
              <>
                <span style={{
                  width: 22, height: 22, borderRadius: '50%',
                  border: '2px solid rgba(255,255,255,0.2)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.4)',
                }}>
                  {countdown}
                </span>
                Please read this first...
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}


function HeroCarousel({ movies }) {
  const [current, setCurrent] = useState(0);
  const [trailerKeys, setTrailerKeys] = useState({});
  const [muted, setMuted] = useState(true);
  const [showTrailer, setShowTrailer] = useState(false);
  const timerRef = useRef(null);
  const trailerTimer = useRef(null);
  const router = useRouter();

  const startTimer = () => {
    clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setCurrent(c => (c + 1) % movies.length);
      setShowTrailer(false);
    }, 20000);
  };

  useEffect(() => {
    const movie = movies[current];
    if (!movie) return;
    if (trailerKeys[movie._id] !== undefined) {
      if (trailerKeys[movie._id]) trailerTimer.current = setTimeout(() => setShowTrailer(true), 1200);
      return;
    }
    setShowTrailer(false);
    fetchTrailerKey(movie).then(key => {
      setTrailerKeys(prev => ({ ...prev, [movie._id]: key || null }));
      if (key) trailerTimer.current = setTimeout(() => setShowTrailer(true), 1200);
    });
    return () => clearTimeout(trailerTimer.current);
  }, [current, movies]);

  useEffect(() => {
    if (movies.length > 1) startTimer();
    return () => clearInterval(timerRef.current);
  }, [movies.length]);

  const go = (dir) => { setCurrent(c => (c + dir + movies.length) % movies.length); setShowTrailer(false); startTimer(); };

  if (!movies.length) return null;
  const movie = movies[current];
  const trailerKey = trailerKeys[movie._id];

  return (
    <div className="relative w-full h-[45vh] sm:h-[60vh] md:h-[75vh] min-h-[320px] overflow-hidden bg-cinema-black">
      {movies.map((m, i) => (
        <div key={m._id} className="absolute inset-0 transition-opacity duration-1000" style={{ opacity: i === current && !showTrailer ? 1 : 0 }}>
          {m.backdrop || m.poster ? (
            <Image src={m.backdrop || m.poster} alt={m.title} fill className="object-cover object-top" priority={i === 0} unoptimized />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-cinema-card to-cinema-black" />
          )}
        </div>
      ))}
      {trailerKey && (
        <div className="absolute inset-0 transition-opacity duration-1000" style={{ opacity: showTrailer ? 1 : 0, pointerEvents: 'none' }}>
          <iframe
            key={trailerKey}
            src={`https://www.youtube.com/embed/${trailerKey}?autoplay=1&mute=${muted ? 1 : 0}&controls=0&loop=1&playlist=${trailerKey}&modestbranding=1&rel=0&showinfo=0&iv_load_policy=3`}
            allow="autoplay; encrypted-media"
            className="absolute w-full h-full"
            style={{ top: '50%', left: '50%', transform: 'translate(-50%, -50%) scale(1.8)', border: 'none', pointerEvents: 'none' }}
            title={movie.title}
          />
        </div>
      )}
      <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/40 to-transparent z-10" />
      <div className="absolute inset-0 bg-gradient-to-t from-cinema-black via-transparent to-transparent z-10" />
      <div className="absolute inset-0 flex items-center z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <div className="max-w-xl">
            <div className="flex items-center gap-2 mb-3 flex-wrap">
              {movie.isTrending && <span className="text-xs bg-cinema-accent text-white px-2.5 py-1 rounded-full font-semibold">🔥 Trending</span>}
              {movie.isFeatured && <span className="text-xs bg-yellow-500 text-black px-2.5 py-1 rounded-full font-semibold">⭐ Featured</span>}
              {movie.genre?.[0] && <span className="text-xs border border-white/30 text-white/80 px-2.5 py-1 rounded-full">{movie.genre[0]}</span>}
              {showTrailer && (
                <span className="flex items-center gap-1 text-xs bg-red-600/80 text-white px-2.5 py-1 rounded-full font-semibold animate-pulse">
                  <FiPlay size={10} className="fill-white" /> Trailer
                </span>
              )}
            </div>
            <h1 className="text-3xl sm:text-5xl md:text-7xl text-white leading-none mb-3" style={{ fontFamily: 'Bebas Neue, serif', letterSpacing: '0.03em' }}>
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
            <p className="text-white/70 text-sm leading-relaxed mb-6 line-clamp-3">{movie.description}</p>
            <div className="flex items-center gap-3 flex-wrap">
              <button onClick={() => router.push(`/movie/${movie._id}`)}
                className="flex items-center gap-2 bg-white text-black px-6 py-3 rounded-xl font-bold text-sm hover:bg-white/90 transition-colors">
                <FiPlay size={16} className="fill-black" /> Play Now
              </button>
              <Link href={`/movie/${movie._id}`}
                className="flex items-center gap-2 bg-white/20 backdrop-blur text-white px-6 py-3 rounded-xl font-semibold text-sm hover:bg-white/30 transition-colors border border-white/20">
                <FiInfo size={16} /> More Info
              </Link>
              <button onClick={() => setMuted(m => !m)}
                className={`flex items-center justify-center w-11 h-11 rounded-full border transition-all duration-200 ${showTrailer ? 'bg-black/40 border-white/40 text-white hover:bg-black/60 opacity-100' : 'opacity-0 pointer-events-none border-transparent'}`}>
                {muted ? <FiVolumeX size={18} /> : <FiVolume2 size={18} />}
              </button>
            </div>
          </div>
        </div>
      </div>
      {movies.length > 1 && (
        <>
          <button onClick={() => go(-1)} className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/50 hover:bg-black/80 rounded-full flex items-center justify-center text-white transition-colors z-30"><FiChevronLeft size={20} /></button>
          <button onClick={() => go(1)} className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/50 hover:bg-black/80 rounded-full flex items-center justify-center text-white transition-colors z-30"><FiChevronRight size={20} /></button>
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-2 z-30">
            {movies.map((_, i) => (
              <button key={i} onClick={() => { setCurrent(i); setShowTrailer(false); startTimer(); }}
                className={`rounded-full transition-all ${i === current ? 'w-6 h-2 bg-cinema-accent' : 'w-2 h-2 bg-white/40 hover:bg-white/70'}`} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default function HomePage() {
  const [heroMovies,  setHeroMovies]  = useState([]);
  const [trending,    setTrending]    = useState([]);
  const [top10,       setTop10]       = useState([]);
  const [popular,     setPopular]     = useState([]);
  const [newReleases, setNewReleases] = useState([]);
  const [allMovies,   setAllMovies]   = useState([]);
  const [genreMovies, setGenreMovies] = useState({});
  const [tvShows,     setTvShows]     = useState([]);
  const [loading,     setLoading]     = useState(true);

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
        const heroPool = [...featured, ...all.filter(m => !featured.find(f => f._id === m._id))].slice(0, 6);
        setHeroMovies(heroPool);
        setTrending(trending.slice(0, 12));
        const top10 = [...all].sort((a, b) => (b.rating - a.rating) || ((b.views || 0) - (a.views || 0))).slice(0, 10);
        setTop10(top10);
        const popularMovies = trending.length >= 8 ? trending.slice(0, 12) : [...all].sort((a, b) => (b.views || 0) - (a.views || 0)).slice(0, 12);
        setPopular(popularMovies);
        const newRel = [...all].sort((a, b) => (b.year - a.year) || new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 12);
        setNewReleases(newRel);
        setAllMovies(all.slice(0, 12));
        setTvShows(tvRes.data.shows || []);
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
        <Head><title>ForeverQueen — Watch Movies & TV Shows</title></Head>
        <div className="w-full h-[45vh] sm:h-[60vh] md:h-[70vh] shimmer" />
        <div className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto mt-8 space-y-10">
          {[1,2,3,4].map(i => (
            <div key={i} className="space-y-3">
              <div className="h-6 w-40 shimmer rounded" />
              <div className="flex gap-3 overflow-hidden">
                {[1,2,3,4,5,6].map(j => <div key={j} className="w-36 sm:w-44 shrink-0 aspect-[2/3] shimmer rounded-lg" />)}
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
        <title>ForeverQueen — Watch Movies & TV Shows</title>
        <meta name="description" content="Stream thousands of movies and TV shows on ForeverQueen." />
      </Head>
      <AnnouncementPopup />
      <HeroCarousel movies={heroMovies} />
      <div className="space-y-8 pb-16 relative z-10 -mt-4">
        <ContinueWatchingRow />
        <RecommendationsRow />
        {trending.length > 0 && (
          <MovieRow title="🔥 Trending Now" movies={trending} viewAllHref="/search?trending=true" />
        )}
        {top10.length >= 5 && (
          <div className="pt-6 pb-10">
            <Top10Row title="Top 10 on ForeverQueen" movies={top10} />
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
            <MovieRow key={genre} title={genre} movies={genreMovies[genre]} viewAllHref={`/genre/${genre.toLowerCase()}`} />
          ) : null
        )}
        {genreMovies['Classic']?.length > 0 && (
          <MovieRow title="Classic Cinema" movies={genreMovies['Classic']} viewAllHref="/genre/classic" />
        )}
      </div>
    </>
  );
}
