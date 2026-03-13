/**
 * TVShowRow — exact same style as MovieRow + MovieCard
 */

import Link from 'next/link';
import Image from 'next/image';
import { FiStar, FiTv, FiPlay, FiChevronRight } from 'react-icons/fi';

function TVShowCard({ show }) {
  return (
    <Link href={`/tv/${show._id}`} className="w-44 md:w-52 shrink-0 group relative">
      <div className="relative aspect-[2/3] rounded-lg overflow-hidden bg-cinema-card border border-cinema-border group-hover:border-cinema-accent/50 transition-all duration-300 shadow-lg group-hover:shadow-cinema-accent/20 group-hover:shadow-xl">
        {show.poster ? (
          <Image
            src={show.poster}
            alt={show.title}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            sizes="(max-width: 640px) 144px, 208px"
            unoptimized
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-cinema-muted">
            <FiTv size={40} />
          </div>
        )}

        {/* Hover overlay */}
        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col items-center justify-center gap-3">
          <div className="w-12 h-12 bg-cinema-accent rounded-full flex items-center justify-center shadow-lg">
            <FiPlay size={20} className="text-white ml-1" />
          </div>
          <span className="text-white text-xs font-medium text-center px-2 line-clamp-2">
            {show.title}
          </span>
        </div>

        {/* Season badge */}
        {show.totalSeasons > 0 && (
          <div className="absolute top-2 left-2 bg-cinema-accent text-white text-xs px-1.5 py-0.5 rounded font-medium">
            {show.totalSeasons}S
          </div>
        )}

        {/* On Air badge */}
        {show.status === 'Returning Series' && (
          <div className="absolute top-2 right-2 bg-green-500 text-white text-xs px-1.5 py-0.5 rounded font-medium">
            ON AIR
          </div>
        )}
      </div>

      <div className="mt-2 px-0.5">
        <p className="text-cinema-text text-sm font-medium truncate">{show.title}</p>
        <div className="flex items-center gap-2 mt-0.5">
          {show.year > 0 && <span className="text-cinema-muted text-xs">{show.year}</span>}
          {show.rating > 0 && (
            <div className="flex items-center gap-0.5">
              <FiStar size={10} className="text-cinema-gold fill-cinema-gold" />
              <span className="text-cinema-gold text-xs">{Number(show.rating).toFixed(1)}</span>
            </div>
          )}
        </div>
        {show.genre?.length > 0 && (
          <p className="text-cinema-muted text-xs truncate mt-0.5">{show.genre[0]}</p>
        )}
      </div>
    </Link>
  );
}

export default function TVShowRow({ title, shows = [], viewAllHref }) {
  if (!shows.length) return null;

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
          <Link href={viewAllHref} className="flex items-center gap-1 text-cinema-muted hover:text-cinema-accent text-sm transition-colors">
            See all <FiChevronRight size={14} />
          </Link>
        )}
      </div>

      <div className="scroll-row flex gap-4 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        {shows.map(show => (
          <TVShowCard key={show._id} show={show} />
        ))}
      </div>
    </section>
  );
}
