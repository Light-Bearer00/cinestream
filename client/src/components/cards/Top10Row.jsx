/**
 * Top10Row — Netflix-style Top 10 with giant ranking numbers
 */

import Link from 'next/link';
import Image from 'next/image';
import { FiStar, FiPlay, FiChevronRight } from 'react-icons/fi';

export default function Top10Row({ title, movies = [], viewAllHref }) {
  if (!movies.length) return null;

  return (
    <section className="py-4">
      <div className="flex items-center justify-between mb-4 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <h2
          className="text-2xl md:text-3xl text-white"
          style={{ fontFamily: 'Bebas Neue, serif', letterSpacing: '0.1em' }}
        >
          {title}
        </h2>
        {viewAllHref && (
          <Link
            href={viewAllHref}
            className="flex items-center gap-1 text-cinema-muted hover:text-cinema-accent text-sm transition-colors"
          >
            See all <FiChevronRight size={14} />
          </Link>
        )}
      </div>

      <div className="scroll-row flex gap-0 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        {movies.slice(0, 10).map((movie, index) => (
          <Link
            key={movie._id}
            href={`/movie/${movie._id}`}
            className="relative shrink-0 group flex items-end"
            style={{ width: '160px' }}
          >
            {/* Giant ranking number */}
            <span
              className="absolute bottom-6 -left-3 z-10 font-black text-cinema-dark select-none leading-none"
              style={{
                fontSize: '9rem',
                WebkitTextStroke: '3px #6b7280',
                color: 'transparent',
                lineHeight: 1,
                fontFamily: 'Bebas Neue, serif',
              }}
            >
              {index + 1}
            </span>

            {/* Poster */}
            <div className="relative w-28 h-40 ml-8 rounded-lg overflow-hidden bg-cinema-card border border-cinema-border group-hover:border-cinema-accent/50 transition-all duration-300 shadow-lg group-hover:shadow-cinema-accent/20 group-hover:shadow-xl shrink-0">
              {movie.poster ? (
                <Image
                  src={movie.poster}
                  alt={movie.title}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                  sizes="112px"
                  unoptimized
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-cinema-muted">
                  <span className="text-3xl">🎬</span>
                </div>
              )}

              {/* Hover overlay */}
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                <div className="w-10 h-10 bg-cinema-accent rounded-full flex items-center justify-center shadow-lg">
                  <FiPlay size={16} className="text-white ml-0.5" />
                </div>
              </div>
            </div>

            {/* Info below */}
            <div className="absolute -bottom-8 left-8 w-28 px-0.5">
              <p className="text-cinema-text text-xs font-medium truncate">{movie.title}</p>
              {movie.rating > 0 && (
                <div className="flex items-center gap-0.5 mt-0.5">
                  <FiStar size={9} className="text-cinema-gold fill-cinema-gold" />
                  <span className="text-cinema-gold text-xs">{movie.rating.toFixed(1)}</span>
                </div>
              )}
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
