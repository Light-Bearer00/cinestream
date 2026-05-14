/**
 * Watchlist / Collections Page
 * client/src/pages/watchlist.jsx
 */
import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '../context/AuthContext';
import { useRouter } from 'next/router';
import { FiBookmark, FiPlus, FiTrash2, FiFilm, FiTv, FiX } from 'react-icons/fi';

function getWatchlist(userId) {
  try {
    const raw = localStorage.getItem(`rq_watchlist_${userId}`);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function saveWatchlist(userId, list) {
  localStorage.setItem(`rq_watchlist_${userId}`, JSON.stringify(list));
}

export function addToWatchlist(userId, item) {
  const list = getWatchlist(userId);
  if (list.find(i => i._id === item._id)) return false;
  list.unshift({ ...item, addedAt: Date.now() });
  saveWatchlist(userId, list);
  return true;
}

export function removeFromWatchlist(userId, itemId) {
  const list = getWatchlist(userId).filter(i => i._id !== itemId);
  saveWatchlist(userId, list);
}

export function isInWatchlist(userId, itemId) {
  return getWatchlist(userId).some(i => i._id === itemId);
}

export default function WatchlistPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [items, setItems] = useState([]);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    if (!user) { router.push('/auth/login'); return; }
    setItems(getWatchlist(user._id));
  }, [user]);

  const handleRemove = (id) => {
    removeFromWatchlist(user._id, id);
    setItems(prev => prev.filter(i => i._id !== id));
  };

  const filtered = filter === 'all' ? items
    : items.filter(i => i.type === filter);

  if (!user) return null;

  return (
    <>
      <Head><title>My Watchlist — RoyalQueen</title></Head>
      <div className="min-h-screen pt-24 pb-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl text-white" style={{ fontFamily: 'Bebas Neue, serif', letterSpacing: '0.1em' }}>
            MY WATCHLIST
          </h1>
          <span className="text-cinema-muted text-sm">{items.length} items</span>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-2 mb-6">
          {[['all','All'], ['movie','Movies'], ['tv','TV Shows']].map(([val, label]) => (
            <button key={val} onClick={() => setFilter(val)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                filter === val ? 'bg-cinema-accent text-white' : 'bg-cinema-card border border-cinema-border text-cinema-muted hover:text-white'
              }`}>{label}</button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <div className="text-center py-20">
            <FiBookmark className="text-cinema-muted mx-auto mb-4" size={48} />
            <p className="text-cinema-muted text-lg">Your watchlist is empty</p>
            <p className="text-cinema-muted text-sm mt-1">Add movies and shows by clicking the bookmark icon</p>
            <Link href="/" className="inline-block mt-4 text-cinema-accent hover:underline">Browse content →</Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {filtered.map(item => (
              <div key={item._id} className="relative group">
                <Link href={`/${item.type === 'tv' ? 'tv' : 'movie'}/${item._id}`}>
                  <div className="relative aspect-[2/3] rounded-xl overflow-hidden bg-cinema-card border border-cinema-border">
                    {item.poster ? (
                      <Image src={item.poster} alt={item.title} fill className="object-cover group-hover:scale-105 transition-transform duration-300" unoptimized />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        {item.type === 'tv' ? <FiTv className="text-cinema-muted" size={32} /> : <FiFilm className="text-cinema-muted" size={32} />}
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <p className="text-cinema-text text-xs mt-1.5 truncate font-medium">{item.title}</p>
                  <p className="text-cinema-muted text-xs">{item.year}</p>
                </Link>
                <button
                  onClick={() => handleRemove(item._id)}
                  className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/70 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                >
                  <FiX size={14} className="text-white" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
