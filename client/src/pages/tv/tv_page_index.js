/**
 * /tv — TV Shows listing page
 */

import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import Image from 'next/image';
import { tvApi } from '../../utils/api';
import { FiStar, FiTv, FiSearch } from 'react-icons/fi';

export default function TVPage() {
  const [shows,   setShows]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [search,  setSearch]  = useState('');
  const [genre,   setGenre]   = useState('');
  const [genres,  setGenres]  = useState([]);

  useEffect(() => {
    tvApi.getGenres().then(r => setGenres(r.data)).catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    tvApi.getAll({ search, genre, limit: 40 })
      .then(r => setShows(r.data.shows))
      .catch(() => setShows([]))
      .finally(() => setLoading(false));
  }, [search, genre]);

  return (
    <>
      <Head><title>TV Shows — RoyalQueen</title></Head>

      <div className="min-h-screen pt-24 pb-16 px-4 max-w-7xl mx-auto">

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <FiTv className="text-cinema-accent text-3xl" />
            <h1 className="text-4xl text-white" style={{ fontFamily: 'Bebas Neue, serif', letterSpacing: '0.1em' }}>
              TV SHOWS
            </h1>
          </div>
          <p className="text-cinema-muted">Browse and stream full seasons & episodes</p>
        </div>

        {/* Search + Filter */}
        <div className="flex flex-wrap gap-3 mb-8">
          <div className="relative flex-1 min-w-60">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-cinema-muted" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search TV shows..."
              className="w-full bg-cinema-card border border-cinema-border rounded-xl pl-9 pr-4 py-2.5 text-cinema-text placeholder-cinema-muted outline-none focus:border-cinema-accent transition-colors text-sm"
            />
          </div>
          <select
            value={genre}
            onChange={e => setGenre(e.target.value)}
            className="bg-cinema-card border border-cinema-border rounded-xl px-4 py-2.5 text-cinema-text outline-none focus:border-cinema-accent text-sm"
          >
            <option value="">All Genres</option>
            {genres.map(g => <option key={g} value={g}>{g}</option>)}
          </select>
        </div>

        {/* Grid */}
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {Array(12).fill(0).map((_, i) => (
              <div key={i} className="aspect-[2/3] shimmer rounded-xl" />
            ))}
          </div>
        ) : shows.length === 0 ? (
          <div className="text-center py-24">
            <FiTv className="text-cinema-muted text-6xl mx-auto mb-4" />
            <p className="text-cinema-muted text-xl">No TV shows found</p>
            <p className="text-cinema-muted text-sm mt-2">Import some shows from the admin panel</p>
            <Link href="/admin" className="inline-block mt-4 text-cinema-accent hover:underline text-sm">
              Go to Admin Panel →
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {shows.map(show => (
              <Link key={show._id} href={`/tv/${show._id}`} className="group">
                <div className="relative aspect-[2/3] rounded-xl overflow-hidden bg-cinema-card border border-cinema-border group-hover:border-cinema-accent transition-all">
                  {show.poster ? (
                    <Image src={show.poster} alt={show.title} fill className="object-cover group-hover:scale-105 transition-transform duration-300" unoptimized />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <FiTv className="text-cinema-muted text-4xl" />
                    </div>
                  )}
                  {/* Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  {/* Badge */}
                  {show.totalSeasons > 0 && (
                    <div className="absolute top-2 left-2 bg-cinema-accent text-white text-xs px-2 py-0.5 rounded font-medium">
                      {show.totalSeasons}S
                    </div>
                  )}
                  {show.status === 'Returning Series' && (
                    <div className="absolute top-2 right-2 bg-green-500 text-white text-xs px-2 py-0.5 rounded font-medium">
                      ON AIR
                    </div>
                  )}
                </div>
                <div className="mt-2 px-1">
                  <p className="text-cinema-text text-sm font-medium truncate group-hover:text-white transition-colors">{show.title}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-cinema-muted text-xs">{show.year}</span>
                    {show.rating > 0 && (
                      <div className="flex items-center gap-1">
                        <FiStar className="text-cinema-gold fill-cinema-gold" size={10} />
                        <span className="text-cinema-gold text-xs">{show.rating.toFixed(1)}</span>
                      </div>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
