/**
 * Navbar Component
 * Sticky top navigation with search, auth, and genre links.
 */

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useAuth } from '../../context/AuthContext';
import {
  FiSearch, FiX, FiUser, FiLogOut, FiSettings, FiHeart, FiMenu
} from 'react-icons/fi';
import { MdLocalMovies } from 'react-icons/md';

const GENRES = ['Action', 'Comedy', 'Drama', 'Horror', 'Sci-Fi', 'Romance', 'Documentary', 'Classic'];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const { user, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchOpen(false);
      setSearchQuery('');
    }
  };

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? 'bg-cinema-black/95 backdrop-blur-md shadow-2xl' : 'bg-gradient-to-b from-black/80 to-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <MdLocalMovies className="text-cinema-accent text-3xl group-hover:scale-110 transition-transform" />
            <span
              className="text-2xl font-display tracking-widest text-white"
              style={{ fontFamily: 'Bebas Neue, serif', letterSpacing: '0.15em' }}
            >
              ROYALQUEEN
            </span>
          </Link>

          {/* Desktop nav links */}
          <div className="hidden md:flex items-center gap-6">
            <Link href="/" className="text-sm text-cinema-muted hover:text-white transition-colors">
              Home
            </Link>
            {GENRES.slice(0, 5).map((genre) => (
              <Link
                key={genre}
                href={`/genre/${genre.toLowerCase()}`}
                className="text-sm text-cinema-muted hover:text-white transition-colors"
              >
                {genre}
              </Link>
            ))}
          </div>

          {/* Right controls */}
          <div className="flex items-center gap-3">
            
            {/* Search */}
            {searchOpen ? (
              <form onSubmit={handleSearch} className="flex items-center bg-cinema-dark border border-cinema-border rounded-full px-3 py-1.5 gap-2 animate-fade-in">
                <FiSearch className="text-cinema-muted shrink-0" />
                <input
                  autoFocus
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search movies..."
                  className="bg-transparent text-sm text-white outline-none w-44 placeholder-cinema-muted"
                />
                <button type="button" onClick={() => setSearchOpen(false)}>
                  <FiX className="text-cinema-muted hover:text-white transition-colors" />
                </button>
              </form>
            ) : (
              <button
                onClick={() => setSearchOpen(true)}
                className="text-cinema-muted hover:text-white transition-colors p-1"
                aria-label="Search"
              >
                <FiSearch size={20} />
              </button>
            )}

            {/* User menu / Auth */}
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2 bg-cinema-card border border-cinema-border rounded-full px-3 py-1.5 hover:border-cinema-accent transition-colors"
                >
                  <div className="w-6 h-6 bg-cinema-accent rounded-full flex items-center justify-center text-white text-xs font-bold">
                    {user.username?.[0]?.toUpperCase()}
                  </div>
                  <span className="text-sm text-cinema-text hidden sm:block">{user.username}</span>
                </button>

                {userMenuOpen && (
                  <div className="absolute right-0 top-12 w-48 bg-cinema-card border border-cinema-border rounded-xl shadow-2xl overflow-hidden animate-slide-up z-50">
                    {user.role === 'admin' && (
                      <Link
                        href="/admin"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-3 px-4 py-3 text-sm text-cinema-text hover:bg-cinema-border transition-colors"
                      >
                        <FiSettings size={16} /> Admin Panel
                      </Link>
                    )}
                    <Link
                      href="/favorites"
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-3 px-4 py-3 text-sm text-cinema-text hover:bg-cinema-border transition-colors"
                    >
                      <FiHeart size={16} /> Favorites
                    </Link>
                    <button
                      onClick={() => { logout(); setUserMenuOpen(false); }}
                      className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-400 hover:bg-cinema-border transition-colors"
                    >
                      <FiLogOut size={16} /> Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link
                href="/auth/login"
                className="flex items-center gap-2 bg-cinema-accent hover:bg-red-700 text-white text-sm px-4 py-1.5 rounded-full transition-colors font-medium"
              >
                <FiUser size={14} /> Sign In
              </Link>
            )}

            {/* Mobile menu toggle */}
            <button
              className="md:hidden text-cinema-muted hover:text-white"
              onClick={() => setMenuOpen(!menuOpen)}
            >
              <FiMenu size={22} />
            </button>
          </div>
        </div>

        {/* Mobile dropdown */}
        {menuOpen && (
          <div className="md:hidden border-t border-cinema-border py-3 animate-slide-up">
            {GENRES.map((genre) => (
              <Link
                key={genre}
                href={`/genre/${genre.toLowerCase()}`}
                onClick={() => setMenuOpen(false)}
                className="block px-2 py-2 text-sm text-cinema-muted hover:text-white transition-colors"
              >
                {genre}
              </Link>
            ))}
          </div>
        )}
      </div>
    </nav>
  );
}
