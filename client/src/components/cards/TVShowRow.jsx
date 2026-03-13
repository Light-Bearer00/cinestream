/**
 * TVShowRow — horizontal scrollable row of TV show cards for the homepage
 */

import Link from 'next/link';
import Image from 'next/image';
import { FiStar, FiTv, FiChevronRight } from 'react-icons/fi';

export default function TVShowRow({ title, shows = [], viewAllHref }) {
  if (!shows.length) return null;

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-4">
      {/* Row header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl md:text-2xl text-white font-semibold tracking-wide">
          {title}
        </h2>
        {viewAllHref && (
          <Link href={viewAllHref} className="flex items-center gap-1 text-cinema-muted hover:text-white text-sm transition-colors">
            See all <FiChevronRight size={16} />
          </Link>
        )}
      </div>

      {/* Scrollable row */}
      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
        {shows.map(show => (
          <Link
            key={show._id}
            href={`/tv/${show._id}`}
            className="group shrink-0 w-32 sm:w-36 md:w-40"
          >
            <div className="relative aspect-[2/3] rounded-xl overflow-hidden bg-cinema-card border border-cinema-border group-hover:border-cinema-accent transition-all">
              {show.poster ? (
                <Image
                  src={show.poster}
                  alt={show.title}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                  unoptimized
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <FiTv className="text-cinema-muted text-3xl" />
                </div>
              )}
              {/* Season badge */}
              {show.totalSeasons > 0 && (
                <div className="absolute top-2 left-2 bg-cinema-accent text-white text-xs px-1.5 py-0.5 rounded font-medium">
                  {show.totalSeasons}S
                </div>
              )}
              {/* On air badge */}
              {show.status === 'Returning Series' && (
                <div className="absolute top-2 right-2 bg-green-500 text-white text-xs px-1.5 py-0.5 rounded font-medium">
                  ON AIR
                </div>
              )}
              {/* Hover overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <div className="mt-2 px-0.5">
              <p className="text-cinema-text text-xs font-medium truncate group-hover:text-white transition-colors">
                {show.title}
              </p>
              <div className="flex items-center gap-2 mt-0.5">
                {show.year > 0 && <span className="text-cinema-muted text-xs">{show.year}</span>}
                {show.rating > 0 && (
                  <div className="flex items-center gap-0.5">
                    <FiStar className="text-cinema-gold fill-cinema-gold" size={9} />
                    <span className="text-cinema-gold text-xs">{Number(show.rating).toFixed(1)}</span>
                  </div>
                )}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
