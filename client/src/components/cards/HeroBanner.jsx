/**
 * HeroBanner Component
 * Large featured movie section at top of homepage.
 */

import Image from 'next/image';
import Link from 'next/link';
import { FiPlay, FiInfo, FiStar } from 'react-icons/fi';

export default function HeroBanner({ movie }) {
  if (!movie) return null;

  return (
    <div className="relative h-[75vh] min-h-[500px] w-full overflow-hidden">
      {/* Background image */}
      <div className="absolute inset-0">
        {movie.backdrop || movie.poster ? (
          <Image
            src={movie.backdrop || movie.poster}
            alt={movie.title}
            fill
            className="object-cover object-top"
            priority
            unoptimized
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-cinema-dark to-cinema-black" />
        )}
      </div>

      {/* Gradient overlays */}
      <div className="hero-gradient absolute inset-0" />
      <div className="bottom-gradient absolute bottom-0 left-0 right-0 h-48" />

      {/* Content */}
      <div className="relative z-10 h-full flex items-end pb-16 px-6 md:px-12 lg:px-20 max-w-7xl mx-auto">
        <div className="max-w-xl animate-slide-up">
          {/* Genre badges */}
          <div className="flex flex-wrap gap-2 mb-3">
            {movie.genre?.slice(0, 3).map((g) => (
              <span key={g} className="text-xs text-cinema-muted border border-cinema-border px-2 py-0.5 rounded">
                {g}
              </span>
            ))}
          </div>

          {/* Title */}
          <h1
            className="text-5xl md:text-7xl text-white mb-3 leading-none"
            style={{ fontFamily: 'Bebas Neue, serif', letterSpacing: '0.05em' }}
          >
            {movie.title}
          </h1>

          {/* Meta */}
          <div className="flex items-center gap-4 mb-4 text-sm text-cinema-muted">
            <span>{movie.year}</span>
            {movie.rating > 0 && (
              <div className="flex items-center gap-1">
                <FiStar className="text-cinema-gold fill-cinema-gold" size={13} />
                <span className="text-cinema-gold font-medium">{movie.rating.toFixed(1)}</span>
              </div>
            )}
            {movie.duration > 0 && <span>{movie.duration} min</span>}
            {movie.director && <span>Dir. {movie.director}</span>}
          </div>

          {/* Description */}
          <p className="text-cinema-muted text-sm md:text-base leading-relaxed mb-6 line-clamp-3">
            {movie.description}
          </p>

          {/* CTA buttons */}
          <div className="flex items-center gap-3 flex-wrap">
            <Link
              href={`/movie/${movie._id}`}
              className="flex items-center gap-2 bg-cinema-accent hover:bg-red-700 text-white font-semibold px-6 py-3 rounded-full transition-all shadow-lg hover:shadow-cinema-accent/30 hover:shadow-xl"
            >
              <FiPlay size={18} className="fill-white" /> Watch Now
            </Link>
            <Link
              href={`/movie/${movie._id}`}
              className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white px-6 py-3 rounded-full transition-all backdrop-blur-sm border border-white/20"
            >
              <FiInfo size={18} /> More Info
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
