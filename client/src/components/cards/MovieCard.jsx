/**
 * MovieCard Component
 * Displays a movie in a Netflix-style card with hover overlay.
 */

import Link from 'next/link';
import Image from 'next/image';
import { FiStar, FiPlay, FiHeart } from 'react-icons/fi';
import { useState } from 'react';
import { userApi } from '../../utils/api';
import { useAuth } from '../../context/AuthContext';

export default function MovieCard({ movie, size = 'md' }) {
  const { user } = useAuth();
  const [isFav, setIsFav] = useState(false);

  const sizeClasses = {
    sm: 'w-36 md:w-40',
    md: 'w-44 md:w-52',
    lg: 'w-52 md:w-64',
  };

  const handleFavorite = async (e) => {
    e.preventDefault();
    if (!user) return;
    try {
      await userApi.toggleFavorite(movie._id);
      setIsFav(!isFav);
    } catch (err) {
      console.error('Favorite error:', err);
    }
  };

  return (
    <Link href={`/movie/${movie._id}`} className={`${sizeClasses[size]} shrink-0 group relative movie-card`}>
      {/* Poster */}
      <div className="relative aspect-[2/3] rounded-lg overflow-hidden bg-cinema-card border border-cinema-border group-hover:border-cinema-accent/50 transition-all duration-300 shadow-lg group-hover:shadow-cinema-accent/20 group-hover:shadow-xl">
        {movie.poster ? (
          <Image
            src={movie.poster}
            alt={movie.title}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            sizes="(max-width: 640px) 144px, 208px"
            unoptimized
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-cinema-muted">
            <span className="text-4xl">🎬</span>
          </div>
        )}

        {/* Hover overlay */}
        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col items-center justify-center gap-3">
          <div className="w-12 h-12 bg-cinema-accent rounded-full flex items-center justify-center shadow-lg">
            <FiPlay size={20} className="text-white ml-1" />
          </div>
          <span className="text-white text-xs font-medium text-center px-2 line-clamp-2">
            {movie.title}
          </span>
        </div>

        {/* Favorite button */}
        {user && (
          <button
            onClick={handleFavorite}
            className="absolute top-2 right-2 p-1.5 bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-cinema-accent"
            aria-label="Favorite"
          >
            <FiHeart
              size={12}
              className={isFav ? 'text-cinema-accent fill-cinema-accent' : 'text-white'}
            />
          </button>
        )}

        {/* Featured badge */}
        {movie.isFeatured && (
          <div className="absolute top-2 left-2 bg-cinema-accent text-white text-xs px-1.5 py-0.5 rounded font-medium">
            Featured
          </div>
        )}
      </div>

      {/* Info below card */}
      <div className="mt-2 px-0.5">
        <p className="text-cinema-text text-sm font-medium truncate">{movie.title}</p>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-cinema-muted text-xs">{movie.year}</span>
          {movie.rating > 0 && (
            <div className="flex items-center gap-0.5">
              <FiStar size={10} className="text-cinema-gold fill-cinema-gold" />
              <span className="text-cinema-gold text-xs">{movie.rating.toFixed(1)}</span>
            </div>
          )}
        </div>
        {movie.genre?.length > 0 && (
          <p className="text-cinema-muted text-xs truncate mt-0.5">{movie.genre[0]}</p>
        )}
      </div>
    </Link>
  );
}
