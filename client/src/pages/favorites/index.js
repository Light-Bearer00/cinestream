import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useAuth } from '../../context/AuthContext';
import { userApi } from '../../utils/api';
import MovieCard from '../../components/cards/MovieCard';

export default function FavoritesPage() {
  const { user } = useAuth();
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    userApi.getFavorites()
      .then((res) => setFavorites(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [user]);

  if (!user) {
    return (
      <div className="min-h-screen pt-32 flex items-center justify-center">
        <div className="text-center">
          <p className="text-cinema-muted mb-4">Sign in to see your favorites</p>
          <Link href="/auth/login" className="bg-cinema-accent text-white px-6 py-3 rounded-full">
            Sign In
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head><title>My Favorites — CineStream</title></Head>
      <div className="min-h-screen pt-24 pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <h1 className="text-5xl text-white mb-8" style={{ fontFamily: 'Bebas Neue, serif', letterSpacing: '0.1em' }}>
          My Favorites
        </h1>

        {loading ? (
          <p className="text-cinema-muted">Loading...</p>
        ) : favorites.length === 0 ? (
          <div className="text-center py-24">
            <p className="text-5xl mb-4">❤️</p>
            <p className="text-cinema-muted">No favorites yet. Browse movies and click the heart!</p>
            <Link href="/" className="text-cinema-accent hover:underline mt-4 inline-block">Browse Movies</Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6">
            {favorites.map((m) => <MovieCard key={m._id} movie={m} size="sm" />)}
          </div>
        )}
      </div>
    </>
  );
}
