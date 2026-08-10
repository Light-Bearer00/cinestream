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


/* ─── Birthday Countdown / Celebration ─────────────────────────────────────── */
function BirthdayCountdown() {
  const [timeLeft, setTimeLeft] = useState({});
  const [isBirthday, setIsBirthday] = useState(false);
  const [showBdayPopup, setShowBdayPopup] = useState(false);

  useEffect(() => {
    function calculate() {
      const now = new Date();
      const thisYear = now.getFullYear();
      // Sep 1 of this year
      let birthday = new Date(thisYear, 8, 1, 0, 0, 0); // month is 0-indexed
      // If Sep 1 already passed this year, target next year
      if (now > new Date(thisYear, 8, 1, 23, 59, 59)) {
        birthday = new Date(thisYear + 1, 8, 1, 0, 0, 0);
      }

      const isTodayBirthday =
        now.getMonth() === 8 && now.getDate() === 1;

      setIsBirthday(isTodayBirthday);

      if (isTodayBirthday) {
        // Check session so popup shows once per session on birthday
        if (!sessionStorage.getItem('rq_bday_seen')) {
          setShowBdayPopup(true);
          sessionStorage.setItem('rq_bday_seen', '1');
        }
        return;
      }

      const diff = birthday - now;
      const days    = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours   = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      setTimeLeft({ days, hours, minutes, seconds });
    }

    calculate();
    const id = setInterval(calculate, 1000);
    return () => clearInterval(id);
  }, []);

  // ── Birthday popup (all day on Sep 1) ─────────────────────────────────────
  if (showBdayPopup) {
    return (
      <>
        {/* Confetti layer */}
        <style>{`
          @keyframes confetti-fall {
            0%   { transform: translateY(-10px) rotate(0deg);   opacity: 1; }
            100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
          }
          @keyframes bday-pulse {
            0%, 100% { box-shadow: 0 0 30px 6px rgba(220,38,38,0.35); }
            50%       { box-shadow: 0 0 60px 16px rgba(220,38,38,0.6); }
          }
          @keyframes float-up {
            from { opacity: 0; transform: translateY(40px) scale(0.95); }
            to   { opacity: 1; transform: translateY(0)    scale(1);    }
          }
          .confetti-piece {
            position: fixed;
            width: 10px;
            height: 10px;
            top: -10px;
            animation: confetti-fall linear infinite;
            z-index: 9998;
            border-radius: 2px;
          }
        `}</style>

        {/* Confetti pieces */}
        {[...Array(30)].map((_, i) => (
          <div key={i} className="confetti-piece" style={{
            left: `${Math.random() * 100}%`,
            background: ['#dc2626','#f59e0b','#ec4899','#8b5cf6','#10b981','#fff'][i % 6],
            width:  `${6 + Math.random() * 8}px`,
            height: `${6 + Math.random() * 8}px`,
            animationDuration: `${2 + Math.random() * 4}s`,
            animationDelay:    `${Math.random() * 4}s`,
          }} />
        ))}

        {/* Popup */}
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.88)', backdropFilter: 'blur(8px)' }}>
          <div style={{
            background: 'linear-gradient(160deg, #1a1a1a, #111)',
            border: '1px solid rgba(220,38,38,0.4)',
            borderRadius: 24,
            maxWidth: 420,
            width: '100%',
            animation: 'float-up 0.5s cubic-bezier(.22,.68,0,1.2) forwards',
            animationName: 'bday-pulse, float-up',
          }}>
            {/* Top bar */}
            <div style={{
              height: 4, borderRadius: '24px 24px 0 0',
              background: 'linear-gradient(90deg, #dc2626, #f59e0b, #ec4899, #dc2626)',
              backgroundSize: '200% 100%',
            }} />

            <div className="px-8 py-8 text-center">
              <div style={{ fontSize: 64, marginBottom: 12, lineHeight: 1 }}>
                👑🎂👑
              </div>
              <h2 style={{
                fontFamily: 'Bebas Neue, serif',
                fontSize: 42,
                letterSpacing: '0.06em',
                color: '#fff',
                lineHeight: 1,
                marginBottom: 8,
              }}>
                Happy Birthday
              </h2>
              <h3 style={{
                fontFamily: 'Bebas Neue, serif',
                fontSize: 52,
                letterSpacing: '0.04em',
                background: 'linear-gradient(90deg, #dc2626, #f59e0b)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                lineHeight: 1,
                marginBottom: 20,
              }}>
                Hiba 👑
              </h3>
              <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 15, lineHeight: 1.8, marginBottom: 28 }}>
                On this special day, I want you to know you are
                the most precious person in my world. Wishing you
                all the happiness, love, and joy you deserve.
                <br /><br />
                You will always be my Queen 👑✨
              </p>
              <button
                onClick={() => setShowBdayPopup(false)}
                style={{
                  background: 'linear-gradient(135deg, #dc2626, #b91c1c)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 14,
                  padding: '12px 36px',
                  fontSize: 15,
                  fontWeight: 600,
                  cursor: 'pointer',
                  width: '100%',
                  boxShadow: '0 0 24px rgba(220,38,38,0.4)',
                }}>
                Thank You 💛
              </button>
            </div>
          </div>
        </div>
      </>
    );
  }

  // ── Countdown banner (every day until Sep 1) ───────────────────────────────
  if (isBirthday) return null; // popup already handled above

  const units = [
    { label: 'Days',    value: timeLeft.days },
    { label: 'Hours',   value: timeLeft.hours },
    { label: 'Minutes', value: timeLeft.minutes },
    { label: 'Seconds', value: timeLeft.seconds },
  ];

  return (
    <>
      <style>{`
        @keyframes countdown-glow {
          0%, 100% { box-shadow: 0 0 12px 2px rgba(220,38,38,0.2); }
          50%       { box-shadow: 0 0 22px 4px rgba(220,38,38,0.35); }
        }
        @keyframes tick {
          0%  { transform: scale(1.12); }
          100%{ transform: scale(1); }
        }
        .cd-number { animation: tick 1s ease-out; }
      `}</style>
      <div style={{
        background: 'linear-gradient(135deg, #111 0%, #1a0a0a 100%)',
        border: '1px solid rgba(220,38,38,0.2)',
        borderRadius: 16,
        padding: '18px 24px',
        margin: '0 16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 16,
        animation: 'countdown-glow 3s ease-in-out infinite',
      }}>
        {/* Left label */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 24 }}>👑</span>
          <div>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 2 }}>
              Something special is coming
            </p>
            <p style={{ color: '#fff', fontSize: 14, fontWeight: 600 }}>
              A very important day
            </p>
          </div>
        </div>

        {/* Timer units */}
        <div style={{ display: 'flex', gap: 10 }}>
          {units.map(u => (
            <div key={u.label} style={{ textAlign: 'center', minWidth: 52 }}>
              <div className="cd-number" key={u.value} style={{
                background: 'rgba(220,38,38,0.12)',
                border: '1px solid rgba(220,38,38,0.25)',
                borderRadius: 10,
                padding: '8px 10px',
                marginBottom: 4,
              }}>
                <span style={{
                  color: '#fff',
                  fontSize: 22,
                  fontWeight: 700,
                  fontFamily: 'monospace',
                  lineHeight: 1,
                }}>
                  {String(u.value ?? 0).padStart(2, '0')}
                </span>
              </div>
              <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                {u.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </>
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
      <HeroCarousel movies={heroMovies} />
      <div className="px-0 sm:px-0 mt-4 mb-2">
        <BirthdayCountdown />
      </div>
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
