/**
 * Continue Watching Row
 * Shows movies/episodes user left halfway through
 */
import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { FiPlay, FiX } from 'react-icons/fi';
import { getAllContinueWatching, clearMovieProgress, formatTimeRemaining } from '../../utils/watchProgress';

export default function ContinueWatchingRow() {
  const [items, setItems] = useState([]);

  useEffect(() => {
    try {
      const all = getAllContinueWatching();
      setItems(all || []);
    } catch (e) {
      setItems([]);
    }
  }, []);

  const handleRemove = (item, e) => {
    e.preventDefault();
    e.stopPropagation();
    if (item.type === 'movie') clearMovieProgress(item.movieId);
    setItems(prev => prev.filter(i => !(i.type === item.type && i.movieId === item.movieId && i.showId === item.showId)));
  };

  if (!items.length) return null;

  return (
    <section className="mb-10">
      <h2 className="text-2xl text-white mb-4 px-4 sm:px-6 lg:px-8"
        style={{ fontFamily: 'Bebas Neue, serif', letterSpacing: '0.1em' }}>
        Continue Watching
      </h2>
      <div className="flex gap-4 overflow-x-auto px-4 sm:px-6 lg:px-8 pb-2 scrollbar-hide">
        {items.map((item, i) => {
          const href = item.type === 'movie'
            ? `/movie/${item.movieId}`
            : `/tv/${item.showId}?resume=s${item.season}e${item.episode}`;
          return (
            <Link key={i} href={href} className="relative shrink-0 w-48 group">
              <div className="relative aspect-video rounded-xl overflow-hidden bg-cinema-card border border-cinema-border">
                {item.poster ? (
                  <Image src={item.poster} alt={item.title || ''} fill className="object-cover" unoptimized />
                ) : (
                  <div className="w-full h-full bg-cinema-dark flex items-center justify-center">
                    <FiPlay className="text-cinema-muted" size={24} />
                  </div>
                )}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <div className="w-10 h-10 rounded-full bg-cinema-accent flex items-center justify-center">
                    <FiPlay className="text-white fill-white ml-0.5" size={16} />
                  </div>
                </div>
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20">
                  <div className="h-full bg-cinema-accent transition-all" style={{ width: `${item.percent}%` }} />
                </div>
                <button
                  onClick={(e) => handleRemove(item, e)}
                  className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-black/70 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-cinema-accent"
                >
                  <FiX size={12} className="text-white" />
                </button>
                {item.type === 'tv' && (
                  <div className="absolute top-1.5 left-1.5 bg-black/70 text-cinema-accent text-xs px-1.5 py-0.5 rounded font-bold">
                    S{item.season}E{item.episode}
                  </div>
                )}
              </div>
              <p className="text-cinema-text text-xs mt-1.5 truncate font-medium">{item.showTitle || item.title}</p>
              <p className="text-cinema-muted text-xs">{formatTimeRemaining(item.currentTime, item.duration)}</p>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
