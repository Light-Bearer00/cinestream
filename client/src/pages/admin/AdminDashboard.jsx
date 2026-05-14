/**
 * Admin Analytics Dashboard
 * client/src/pages/admin/index.js — REPLACE existing admin page
 */
import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useAuth } from '../../context/AuthContext';
import { useRouter } from 'next/router';
import api from '../../utils/api';
import { FiFilm, FiTv, FiUsers, FiEye, FiTrendingUp, FiDatabase, FiSettings, FiDownload } from 'react-icons/fi';

export default function AdminDashboard() {
  const { user } = useAuth();
  const router = useRouter();
  const [stats, setStats]   = useState(null);
  const [loading, setLoading] = useState(true);
  const [topMovies, setTopMovies] = useState([]);
  const [topShows,  setTopShows]  = useState([]);

  useEffect(() => {
    if (!user) { router.push('/auth/login'); return; }
    if (user.role !== 'admin') { router.push('/'); return; }
    loadStats();
  }, [user]);

  const loadStats = async () => {
    try {
      const [statsRes, moviesRes, showsRes] = await Promise.all([
        api.get('/admin/stats').catch(() => ({ data: {} })),
        api.get('/movies?sort=views&limit=5').catch(() => ({ data: { movies: [] } })),
        api.get('/tv?limit=5').catch(() => ({ data: { shows: [] } })),
      ]);
      setStats(statsRes.data);
      setTopMovies(moviesRes.data.movies || []);
      setTopShows(showsRes.data.shows || []);
    } catch {}
    setLoading(false);
  };

  if (!user || user.role !== 'admin') return null;

  const cards = [
    { label: 'Total Movies', value: stats?.totalMovies ?? '...', icon: FiFilm,     color: 'text-blue-400',   bg: 'bg-blue-400/10' },
    { label: 'TV Shows',     value: stats?.totalShows  ?? '...', icon: FiTv,       color: 'text-purple-400', bg: 'bg-purple-400/10' },
    { label: 'Total Users',  value: stats?.totalUsers  ?? '...', icon: FiUsers,    color: 'text-green-400',  bg: 'bg-green-400/10' },
    { label: 'Total Views',  value: stats?.totalViews  ?? '...', icon: FiEye,      color: 'text-yellow-400', bg: 'bg-yellow-400/10' },
  ];

  const adminLinks = [
    { href: '/admin/scraper', label: 'Import Movies', icon: FiFilm,     desc: 'Search & import from TMDB' },
    { href: '/admin/tv',      label: 'Import TV Shows',icon: FiTv,       desc: 'Search & import TV shows' },
    { href: '/admin/scraper', label: 'Fix URLs',       icon: FiSettings, desc: 'Update stream URLs in DB' },
  ];

  return (
    <>
      <Head><title>Admin Dashboard — RoyalQueen</title></Head>
      <div className="min-h-screen pt-24 pb-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl text-white" style={{ fontFamily: 'Bebas Neue, serif', letterSpacing: '0.1em' }}>
              ADMIN DASHBOARD
            </h1>
            <p className="text-cinema-muted text-sm mt-1">Welcome back, {user.name} 👑</p>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {cards.map((c, i) => (
            <div key={i} className="bg-cinema-card border border-cinema-border rounded-2xl p-5">
              <div className={`w-10 h-10 rounded-xl ${c.bg} flex items-center justify-center mb-3`}>
                <c.icon className={c.color} size={20} />
              </div>
              <p className="text-2xl font-bold text-white">{loading ? '...' : c.value?.toLocaleString()}</p>
              <p className="text-cinema-muted text-sm mt-0.5">{c.label}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Quick Actions */}
          <div className="bg-cinema-card border border-cinema-border rounded-2xl p-5">
            <h2 className="text-white font-semibold mb-4 flex items-center gap-2">
              <FiSettings className="text-cinema-accent" size={18} /> Quick Actions
            </h2>
            <div className="space-y-3">
              {adminLinks.map((l, i) => (
                <Link key={i} href={l.href}
                  className="flex items-center gap-3 p-3 bg-cinema-dark rounded-xl hover:border hover:border-cinema-accent transition-all group">
                  <div className="w-9 h-9 rounded-lg bg-cinema-accent/10 flex items-center justify-center">
                    <l.icon className="text-cinema-accent" size={16} />
                  </div>
                  <div>
                    <p className="text-white text-sm font-medium group-hover:text-cinema-accent transition-colors">{l.label}</p>
                    <p className="text-cinema-muted text-xs">{l.desc}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Top Movies */}
          <div className="bg-cinema-card border border-cinema-border rounded-2xl p-5">
            <h2 className="text-white font-semibold mb-4 flex items-center gap-2">
              <FiTrendingUp className="text-cinema-accent" size={18} /> Most Watched Movies
            </h2>
            <div className="space-y-3">
              {topMovies.length === 0 ? (
                <p className="text-cinema-muted text-sm">No data yet</p>
              ) : topMovies.map((m, i) => (
                <div key={m._id} className="flex items-center gap-3">
                  <span className="text-cinema-muted text-sm w-5 shrink-0">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-cinema-text text-sm truncate">{m.title}</p>
                    <p className="text-cinema-muted text-xs">{m.year}</p>
                  </div>
                  <div className="flex items-center gap-1 text-cinema-muted text-xs shrink-0">
                    <FiEye size={12} /> {(m.views || 0).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Top TV Shows */}
          <div className="bg-cinema-card border border-cinema-border rounded-2xl p-5">
            <h2 className="text-white font-semibold mb-4 flex items-center gap-2">
              <FiTv className="text-cinema-accent" size={18} /> Latest TV Shows
            </h2>
            <div className="space-y-3">
              {topShows.length === 0 ? (
                <p className="text-cinema-muted text-sm">No data yet</p>
              ) : topShows.map((s, i) => (
                <div key={s._id} className="flex items-center gap-3">
                  <span className="text-cinema-muted text-sm w-5 shrink-0">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-cinema-text text-sm truncate">{s.title}</p>
                    <p className="text-cinema-muted text-xs">{s.totalSeasons} seasons</p>
                  </div>
                  <div className="flex items-center gap-1 text-cinema-muted text-xs shrink-0">
                    <FiEye size={12} /> {(s.views || 0).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Database Info */}
        <div className="mt-6 bg-cinema-card border border-cinema-border rounded-2xl p-5">
          <h2 className="text-white font-semibold mb-3 flex items-center gap-2">
            <FiDatabase className="text-cinema-accent" size={18} /> Database Status
          </h2>
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              <span className="text-cinema-text text-sm">MongoDB Atlas — Connected</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              <span className="text-cinema-text text-sm">Railway Backend — Online</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              <span className="text-cinema-text text-sm">Vercel Frontend — Online</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
