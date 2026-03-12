/**
 * MovieRow Component
 * Horizontal scrollable row of movie cards.
 */

import Link from 'next/link';
import MovieCard from './MovieCard';
import { FiChevronRight } from 'react-icons/fi';

export default function MovieRow({ title, movies = [], viewAllHref, size = 'md' }) {
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

      <div className="scroll-row flex gap-4 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        {movies.map((movie) => (
          <MovieCard key={movie._id} movie={movie} size={size} />
        ))}
      </div>
    </section>
  );
}
