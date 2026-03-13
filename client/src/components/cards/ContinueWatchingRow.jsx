/**
 * ContinueWatchingRow
 * Shows recently watched movies/episodes with a progress bar
 * and "X minutes remaining" label.
 */

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { FiPlay, FiX, FiChevronRight } from 'react-icons/fi';
import { getContinueWatching, removeFromContinueWatching, formatTimeRemaining } from '../../utils/watchProgress';

function ContinueCard({ item, onRemove }) {
  const href = item.type === 'movie'
    ? `/movie/${item.id}`
    : `/tv/${item.id}?resume=s${item.season}e${item.episode}`;

  const subtitle = item.type === 'movie'
    ? formatTimeRemaining(item.currentTime, item.duration)
    : `S${item.season} E${item.episode} · ${formatTimeRemaining(item.currentTime, item.duration)}`;

  return (
    <div className="relative w-44 md:w-52 shrink-0 group">
      <Link href={href}>
        <div className="relative aspect-[2/3] rounded-lg overflow-hidden bg-cinema-card border border-cinema-border group-hover:border-cinema-accent/50 transition-all duration-300 shadow-lg">
          {item.poster ? (
            <Image
              src={item.poster}
              alt={item.title}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-105"
              sizes="208px"
              unoptimized
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-cinema-muted text-4xl">🎬</div>
          )}

          {/* Dark overlay on hover */}
          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
            <div className="w-12 h-12 bg-cinema-accent rounded-full flex items-center justify-center shadow-lg">
              <FiPlay size={20} className="text-white ml-1" />
            </div>
          </div>

          {/* Progress bar at bottom of poster */}
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20">
            <div
              className="h-full bg-cinema-accent transition-all"
              style={{ width: `${Math.min(item.percent, 100)}%` }}
            />
          </div>
        </div>
      </Link>

      {/* Remove button */}
      <button
        onClick={(e) => { e.preventDefault(); onRemove(item.id); }}
        className="absolute top-2 right-2 w-6 h-6 bg-black/70 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-cinema-accent z-10"
        title="Remove from continue watching"
      >
        <FiX size={12} className="text-white" />
      </button>

      {/* Info */}
      <div className="mt-2 px-0.5">
        <p className="text-cinema-text text-sm font-medium truncate">
          {item.type === 'tv_last' ? (item.showTitle || item.title) : item.title}
        </p>
        <p className="text-cinema-accent text-xs mt-0.5">{subtitle}</p>
      </div>
    </div>
  );
}

export default function ContinueWatchingRow() {
  const [items, setItems] = useState([]);

  useEffect(() => {
    setItems(getContinueWatching());
  }, []);

  const handleRemove = (id) => {
    removeFromContinueWatching(id);
    setItems(getContinueWatching());
  };

  if (!items.length) return null;

  return (
    <section className="py-4">
      <div className="flex items-center justify-between mb-4 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <h2
          className="text-2xl md:text-3xl text-white"
          style={{ fontFamily: 'Bebas Neue, serif', letterSpacing: '0.1em' }}
        >
          Continue Watching
        </h2>
      </div>

      <div className="scroll-row flex gap-4 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        {items.map(item => (
          <ContinueCard
            key={`${item.type}_${item.id}_${item.season || 0}_${item.episode || 0}`}
            item={item}
            onRemove={handleRemove}
          />
        ))}
      </div>
    </section>
  );
}
