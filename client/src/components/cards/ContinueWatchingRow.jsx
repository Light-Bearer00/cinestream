/**
 * Continue Watching Row - matches MovieRow structure exactly
 */
import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { FiPlay, FiX } from 'react-icons/fi';
import { getAllContinueWatching, clearMovieProgress, formatTimeRemaining } from '../../utils/watchProgress';

export default function ContinueWatchingRow() {
  const [items, setItems] = useState([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    try {
      const all = getAllContinueWatching();
      setItems(all || []);
    } catch (e) { setItems([]); }
  }, []);

  if (!mounted || !items.length) return null;

  const handleRemove = (item, e) => {
    e.preventDefault();
    e.stopPropagation();
    if (item.type === 'movie') clearMovieProgress(item.movieId);
    setItems(prev => prev.filter(i => !(i.type === item.type && i.movieId === item.movieId && i.showId === item.showId)));
  };

  return (
    <section className="py-4">
      <div className="flex items-center justify-between mb-4 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <h2 className="text-2xl md:text-3xl text-white"
          style={{ fontFamily: 'Bebas Neue, serif', letterSpacing: '0.1em' }}>
          Continue Watching
        </h2>
      </div>
      <div className="scroll-row flex gap-4 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        {items.map((item, i) => {
          const href = item.type === 'movie'
            ? `/movie/${item.movieId}`
            : `/tv/${item.showId}?resume=s${item.season}e${item.episode}`;
          return (
            <Link key={i} href={href} className="w-36 md:w-40 shrink-0 group relative movie-card">
              <div className="relative aspect-[2/3] rounded-lg overflow-hidden bg-cinema-card border border-cinema-border group-hover:border-cinema-accent/50 transition-all duration-300 shadow-lg group-hover:shadow-cinema-accent/20 group-hover:shadow-xl">
                {item.poster ? (
                  <Image src={item.poster} alt={item.title || ''} fill
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                    sizes="(max-width: 640px) 144px, 208px" unoptimized />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-cinema-muted">
                    <FiPlay size={32} />
                  </div>
                )}
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col items-center justify-center gap-3">
                  <div className="w-12 h-12 bg-cinema-accent rounded-full flex items-center justify-center shadow-lg">
                    <FiPlay size={20} className="text-white ml-1" />
                  </div>
                  <span className="text-white text-xs font-medium text-center px-2 line-clamp-2">
                    {item.showTitle || item.title}
                  </span>
                </div>
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20">
                  <div className="h-full bg-cinema-accent" style={{ width: `${item.percent}%` }} />
                </div>
                <button onClick={(e) => handleRemove(item, e)}
                  className="absolute top-2 right-2 p-1.5 bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-cinema-accent">
                  <FiX size={12} className="text-white" />
                </button>
                {item.type === 'tv' && (
                  <div className="absolute top-2 left-2 bg-cinema-accent text-white text-xs px-1.5 py-0.5 rounded font-medium">
                    S{item.season}E{item.episode}
                  </div>
                )}
              </div>
              <div className="mt-2 px-0.5">
                <p className="text-cinema-text text-sm font-medium truncate">{item.showTitle || item.title}</p>
                <p className="text-cinema-accent text-xs mt-0.5">{formatTimeRemaining(item.currentTime, item.duration)}</p>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
