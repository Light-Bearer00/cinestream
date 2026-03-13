/**
 * Top10Row — Netflix-style full-width carousel
 * Left: rank number + title + description + buttons
 * Right: poster with rank number overlay
 */

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import Image from 'next/image';
import { FiPlay, FiInfo, FiChevronLeft, FiChevronRight, FiStar } from 'react-icons/fi';

export default function Top10Row({ movies = [] }) {
  const [current, setCurrent] = useState(0);
  const router = useRouter();
  const list = movies.slice(0, 10);

  if (!list.length) return null;

  const timerRef = useRef(null);

  const resetTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setCurrent(i => (i + 1) % list.length);
    }, 6000);
  };

  useEffect(() => {
    resetTimer();
    return () => clearInterval(timerRef.current);
  }, [list.length]);

  const prev = () => { setCurrent(i => (i - 1 + list.length) % list.length); resetTimer(); };
  const next = () => { setCurrent(i => (i + 1) % list.length); resetTimer(); };

  const movie = list[current];
  const rank  = current + 1;

  return (
    <section className="py-6 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* Section heading */}
      <div className="mb-4">
        <h2
          className="text-white leading-none"
          style={{
            fontFamily: 'Bebas Neue, serif',
            fontSize: 'clamp(3rem, 8vw, 6rem)',
            letterSpacing: '0.05em',
            WebkitTextStroke: '2px white',
            color: 'transparent',
          }}
        >
          TOP 10
        </h2>
        <p
          className="text-cinema-muted tracking-[0.3em] text-xs sm:text-sm mt-1"
          style={{ fontFamily: 'Bebas Neue, serif' }}
        >
          CONTENT TODAY
        </p>
      </div>

      {/* Card */}
      <div className="relative rounded-2xl overflow-hidden bg-cinema-card border border-cinema-border"
        style={{ minHeight: '260px' }}
      >
        {/* Backdrop blur bg */}
        {movie.backdrop && (
          <div className="absolute inset-0 z-0">
            <Image
              src={movie.backdrop}
              alt=""
              fill
              className="object-cover opacity-10"
              unoptimized
            />
            <div className="absolute inset-0 bg-gradient-to-r from-cinema-black via-cinema-black/90 to-cinema-black/40" />
          </div>
        )}

        {/* Content */}
        <div className="relative z-10 flex items-center justify-between gap-4 p-6 sm:p-8 md:p-10">

          {/* Left arrow */}
          <button
            onClick={prev}
            className="shrink-0 w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-black/40 border border-white/20 hover:border-white/60 text-white flex items-center justify-center transition-all hover:bg-black/70"
            aria-label="Previous"
          >
            <FiChevronLeft size={20} />
          </button>

          {/* Left: info */}
          <div className="flex-1 min-w-0">
            <h3
              className="text-white font-black leading-tight mb-3"
              style={{
                fontFamily: 'Bebas Neue, serif',
                fontSize: 'clamp(1.8rem, 5vw, 3.5rem)',
                letterSpacing: '0.03em',
              }}
            >
              {movie.title}
            </h3>

            {/* Meta */}
            <div className="flex items-center gap-3 mb-3 flex-wrap">
              <span className="text-xs border border-cinema-border text-cinema-muted px-2 py-0.5 rounded uppercase tracking-widest">
                Movie
              </span>
              {movie.rating > 0 && (
                <div className="flex items-center gap-1">
                  <FiStar size={12} className="text-cinema-gold fill-cinema-gold" />
                  <span className="text-white text-sm font-semibold">{movie.rating.toFixed(1)}/10</span>
                </div>
              )}
              {movie.year > 0 && (
                <span className="text-cinema-muted text-sm">{movie.year}</span>
              )}
            </div>

            {/* Description */}
            {movie.description && (
              <p className="text-cinema-muted text-sm leading-relaxed mb-5 line-clamp-3 max-w-lg">
                {movie.description}
              </p>
            )}

            {/* Buttons */}
            <div className="flex items-center gap-3 flex-wrap">
              <button
                onClick={() => router.push(`/movie/${movie._id}`)}
                className="flex items-center gap-2 bg-white hover:bg-gray-200 text-black text-sm font-bold px-5 py-2.5 rounded-full transition-colors"
              >
                <FiPlay size={14} className="fill-black" />
                Play
              </button>
              <button
                onClick={() => router.push(`/movie/${movie._id}`)}
                className="flex items-center gap-2 bg-transparent border border-white/40 hover:border-white text-white text-sm font-medium px-5 py-2.5 rounded-full transition-colors"
              >
                <FiInfo size={14} />
                See More
              </button>
            </div>

            {/* Dots */}
            <div className="flex items-center gap-1.5 mt-5">
              {list.map((_, i) => (
                <button
                  key={i}
                  onClick={() => { setCurrent(i); resetTimer(); }}
                  className={`rounded-full transition-all duration-300 ${
                    i === current
                      ? 'w-6 h-2 bg-white'
                      : 'w-2 h-2 bg-white/30 hover:bg-white/60'
                  }`}
                  aria-label={`Go to ${i + 1}`}
                />
              ))}
            </div>
          </div>

          {/* Right: poster + rank number */}
          <div className="shrink-0 relative hidden sm:block"
            style={{ width: 'clamp(140px, 18vw, 240px)' }}
          >
            <div
              className="relative rounded-xl overflow-hidden border border-white/10 shadow-2xl"
              style={{ aspectRatio: '2/3' }}
            >
              {movie.poster ? (
                <Image
                  src={movie.poster}
                  alt={movie.title}
                  fill
                  className="object-cover"
                  sizes="240px"
                  unoptimized
                />
              ) : (
                <div className="w-full h-full bg-cinema-dark flex items-center justify-center text-5xl">🎬</div>
              )}
            </div>

            {/* Giant rank number */}
            <span
              className="absolute -bottom-4 -left-6 select-none leading-none z-10 pointer-events-none"
              style={{
                fontFamily: 'Bebas Neue, serif',
                fontSize: 'clamp(5rem, 12vw, 9rem)',
                WebkitTextStroke: rank <= 3 ? '3px #e50914' : '3px rgba(255,255,255,0.5)',
                color: 'transparent',
                lineHeight: 1,
              }}
            >
              {rank}
            </span>
          </div>

          {/* Right arrow */}
          <button
            onClick={next}
            className="shrink-0 w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-black/40 border border-white/20 hover:border-white/60 text-white flex items-center justify-center transition-all hover:bg-black/70"
            aria-label="Next"
          >
            <FiChevronRight size={20} />
          </button>
        </div>
      </div>
    </section>
  );
}
