/**
 * Watchlist Button — add/remove from watchlist
 * Use anywhere: <WatchlistButton item={movie} type="movie" />
 */
import { useState, useEffect } from 'react';
import { FiBookmark } from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';
import { useRouter } from 'next/router';
import { addToWatchlist, removeFromWatchlist, isInWatchlist } from '../../pages/watchlist';

export default function WatchlistButton({ item, type = 'movie', className = '' }) {
  const { user } = useAuth();
  const router = useRouter();
  const [saved, setSaved] = useState(false);
  const [flash, setFlash] = useState(false);

  useEffect(() => {
    if (user && item?._id) setSaved(isInWatchlist(user._id, item._id));
  }, [user, item]);

  const toggle = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) { router.push('/auth/login'); return; }
    if (saved) {
      removeFromWatchlist(user._id, item._id);
      setSaved(false);
    } else {
      addToWatchlist(user._id, { ...item, type });
      setSaved(true);
      setFlash(true);
      setTimeout(() => setFlash(false), 1000);
    }
  };

  return (
    <button
      onClick={toggle}
      title={saved ? 'Remove from watchlist' : 'Add to watchlist'}
      className={`flex items-center gap-1.5 transition-all ${className} ${
        flash ? 'scale-125' : 'scale-100'
      }`}
    >
      <FiBookmark
        size={18}
        className={saved ? 'text-cinema-accent fill-cinema-accent' : 'text-cinema-muted hover:text-white'}
      />
    </button>
  );
}
