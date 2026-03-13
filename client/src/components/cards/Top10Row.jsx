/**
 * Top10Row — Large cards with auto-scroll arrows, Netflix style
 */

import { useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { FiStar, FiPlay, FiChevronLeft, FiChevronRight } from 'react-icons/fi';

export default function Top10Row({ title, movies = [] }) {
  const rowRef = useRef(null);

  const scroll = (dir) => {
    if (!rowRef.current) return;
    rowRef.current.scrollBy({ left: dir * 320, behavior: 'smooth' });
  };

  if (!movies.length) return null;

  return (
    <section className="py-4">
      <div className="flex items-center justify-between mb-6 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <h2
          className="text-2xl md:text-3xl text-white"
          style={{ fontFamily: 'Bebas Neue, serif', letterSpacing: '0.1em' }}
        >
          {title}
        </h2>
        <div className="flex gap-2">
          <button
            onClick={() => scroll(-1)}
            className="w-9 h-9 rounded-full bg-cinema-card border border-cinema-border hover:border-cinema-accent text-cinema-muted hover:text-white flex items-center justify-center transition-all"
          >
            <FiChevronLeft size={18} />
          </button>
          <button
            onClick={() => scroll(1)}
            className="w-9 h-9 rounded-full bg-cinema-card border border-cinema-border hover:border-cinema-accent text-cinema-muted hover:text-white flex items-center justify-center transition-all"
          >
            <FiChevronRight size={18} />
          </button>
        </div>
      </div>

      {/* Scrollable row — hidden scrollbar */}
      <div
        ref={rowRef}
        className="flex gap-2 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto overflow-x-auto"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {movies.slice(0, 10).map((movie, index) => (
          <Link
            key={movie._id}
            href={`/movie/${movie._id}`}
            className="relative shrink-0 group flex items-end"
            style={{ width: '200px', paddingBottom: '48px' }}
          >
            {/* Giant ranking number */}
            <span
              className="absolute bottom-10 -left-2 z-10 select-none leading-none"
              style={{
                fontSize: '11rem',
                WebkitTextStroke: index < 3 ? '3px #e53e3e' : '3px #4b5563',
                color: 'transparent',
                lineHeight: 1,
                fontFamily: 'Bebas Neue, serif',
              }}
            >
              {index + 1}
            </span>

            {/* Poster */}
            <div className="relative ml-12 rounded-xl overflow-hidden bg-cinema-card border border-cinema-border group-hover:border-cinema-accent/70 transition-all duration-300 shadow-xl group-hover:shadow-cinema-accent/20 shrink-0"
              style={{ width: '140px', height: '210px' }}
            >
              {movie.poster ? (
                <Image
                  src={movie.poster}
                  alt={movie.title}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                  sizes="140px"
                  unoptimized
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-cinema-muted">
                  <span className="text-4xl">🎬</span>
                </div>
              )}

              {/* Hover overlay */}
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                <div className="w-12 h-12 bg-cinema-accent rounded-full flex items-center justify-center shadow-lg">
                  <FiPlay size={18} className="text-white ml-0.5" />
                </div>
              </div>

              {/* Top 3 gold crown badge */}
              {index < 3 && (
                <div className="absolute top-2 right-2 text-lg">
                  {index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'}
                </div>
              )}
            </div>

            {/* Info below poster */}
            <div className="absolute bottom-0 left-12 w-36 px-0.5">
              <p className="text-cinema-text text-xs font-semibold truncate">{movie.title}</p>
              <div className="flex items-center gap-2 mt-0.5">
                {movie.rating > 0 && (
                  <div className="flex items-center gap-0.5">
                    <FiStar size={9} className="text-cinema-gold fill-cinema-gold" />
                    <span className="text-cinema-gold text-xs">{movie.rating.toFixed(1)}</span>
                  </div>
                )}
                {movie.year > 0 && (
                  <span className="text-cinema-muted text-xs">{movie.year}</span>
                )}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
