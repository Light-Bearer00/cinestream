/**
 * ProtectedRoute
 * Wraps every page. If user is not logged in, redirects to /auth/login.
 */

import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../../context/AuthContext';
import { MdLocalMovies } from 'react-icons/md';

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/auth/login');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-cinema-black flex flex-col items-center justify-center gap-4">
        <MdLocalMovies className="text-cinema-accent text-5xl animate-pulse" />
        <p className="text-cinema-muted text-sm tracking-widest uppercase">Loading...</p>
      </div>
    );
  }

  if (!user) return null;

  return children;
}
