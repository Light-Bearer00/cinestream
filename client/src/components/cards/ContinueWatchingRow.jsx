/**
 * ContinueWatchingRow
 * Shows recently watched movies/episodes with a progress bar
 * and correct "X minutes remaining" label.
 */

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { FiPlay, FiX, FiClock } from 'react-icons/fi';
import { getContinueWatching, removeFromContinueWatching } from '../../utils/watchProgress';

function formatRemaining(currentTime, duration) {
  if (!duration || !currentTime || duration <= 0) return null;
  const remaining = Math.max(0, duration - currentTime);
  const mins = Math.floor(remaining / 60);
  if (mins <= 0) return 'Almost done';
  if (mins >= 60) {
    const hrs = Math.floor(mins / 60);
    const m   = mins % 60;
    return m > 0 ? `${hrs}h ${m}m left` : `${hrs}h left`;
  }
  return `${mins}m left`;
}

function ContinueCard({ item, onRemove }) {
  const href = item.type === 'movie'
    ? `/movie/${item.id}`
    : `/tv/${item.id}?resume=s${item.season}e${item.episode}`;

  const displayTitle = item.type === 'tv_last'
    ? (item.showTitle || item.title)
    : item.title;

  const episodeLabel = item.type === 'tv_last'
    ? `S${item.season} E${item.episode}`
    : null;

  // Calculate remaining time properly
  const remaining = formatRemaining(item.currentTime, item.duration);
  const percent   = Math.min(Math.max(item.percent || 0), 99);

  return (
    <div className="relative w-44 md:w-52 shrink-0 group">
      <Link href={href}>
        <div className="relative aspect-[2/3] rounded-lg overflow-hidden bg-cinema-card border border-cinema-border group-hover:border-cinema-accent/50 transition-all duration-300 shadow-lg">
          {item.poster ? (
            <Image
              src={item.poster}
              alt={displayTitle}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-105"
              sizes="208px"
              unoptimized
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-cinema-muted text-4xl">🎬</div>
          )}

          {/* Hover overlay */}
          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
            <div className="w-12 h-12 bg-cinema-accent rounded-full flex items-center justify-center shadow-lg">
              <FiPlay size={20} className="text-white ml-1" />
            </div>
          </div>

          {/* Progress bar */}
          <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-white/20">
            <div
              className="h-full bg-cinema-accent transition-all"
              style={{ width: `${percent}%` }}
            />
          </div>

          {/* Episode badge for TV */}
          {episodeLabel && (
            <div className="absolute top-2 left-2 bg-black/70 text-white text-xs px-2 py-0.5 rounded font-medium">
              {episodeLabel}
            </div>
          )}
        </div>
      </Link>

      {/* Remove button */}
      <button
        onClick={(e) => { e.preventDefault(); onRemove(item.id); }}
        className="absolute top-2 right-2 w-6 h-6 bg-black/70 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-cinema-accent z-10"
        title="Remove"
      >
        <FiX size={12} className="text-white" />
      </button>

      {/* Info */}
      <div className="mt-2 px-0.5">
        <p className="text-cinema-text text-sm font-medium truncate">{displayTitle}</p>
        {remaining ? (
          <div className="flex items-center gap-1 mt-0.5">
            <FiClock size={10} className="text-cinema-accent shrink-0" />
            <p className="text-cinema-accent text-xs">{remaining}</p>
          </div>
        ) : (
          <p className="text-cinema-muted text-xs mt-0.5">{percent}% watched</p>
        )}
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
