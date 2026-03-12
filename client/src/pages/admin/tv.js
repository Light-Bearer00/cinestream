/**
 * /admin/tv — Admin TV Shows import page
 * Search TMDB for TV shows and import them with full seasons + episodes
 */

import { useState } from 'react';
import Head from 'next/head';
import Image from 'next/image';
import Link from 'next/link';
import { tvScraperApi } from '../../utils/api';
import { FiSearch, FiDownload, FiTv, FiChevronLeft, FiLoader, FiCheck, FiTrash2 } from 'react-icons/fi';

export default function AdminTVPage() {
  const [query,       setQuery]       = useState('');
  const [category,    setCategory]    = useState('popular');
  const [results,     setResults]     = useState([]);
  const [searching,   setSearching]   = useState(false);
  const [importing,   setImporting]   = useState({}); // { tmdbId: 'loading'|'done'|'error' }
  const [message,     setMessage]     = useState('');
  const [deleting,    setDeleting]    = useState(false);

  const search = async () => {
    setSearching(true);
    setResults([]);
    try {
      const res = query.trim()
        ? await tvScraperApi.search(query)
        : await tvScraperApi.popular(category);
      setResults(res.data.shows || []);
    } catch (err) {
      setMessage('❌ ' + (err.response?.data?.message || err.message));
    } finally {
      setSearching(false);
    }
  };

  const importShow = async (show) => {
    setImporting(prev => ({ ...prev, [show.tmdbId]: 'loading' }));
    setMessage('');
    try {
      // Fetch full details with all seasons and episodes
      setMessage(`⏳ Fetching all seasons for "${show.title}"... this may take a moment`);
      const detailRes = await tvScraperApi.details(show.tmdbId, true);
      const fullShow  = detailRes.data;

      const importRes = await tvScraperApi.import([fullShow]);
      const r = importRes.data;

      if (r.imported > 0) {
        setImporting(prev => ({ ...prev, [show.tmdbId]: 'done' }));
        setMessage(`✅ "${show.title}" imported with ${fullShow.seasons?.length || 0} seasons!`);
      } else if (r.skipped > 0) {
        setImporting(prev => ({ ...prev, [show.tmdbId]: 'done' }));
        setMessage(`⚠️ "${show.title}" already exists in database.`);
      } else {
        setImporting(prev => ({ ...prev, [show.tmdbId]: 'error' }));
        setMessage(`❌ Failed: ${r.errors?.[0] || 'Unknown error'}`);
      }
    } catch (err) {
      setImporting(prev => ({ ...prev, [show.tmdbId]: 'error' }));
      setMessage('❌ ' + (err.response?.data?.message || err.message));
    }
  };

  const deleteAll = async () => {
    if (!confirm('Delete ALL TV shows from the database? This cannot be undone!')) return;
    setDeleting(true);
    try {
      const res = await tvScraperApi.deleteAll();
      setMessage(`✅ ${res.data.message}`);
    } catch (err) {
      setMessage('❌ ' + (err.response?.data?.message || err.message));
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <Head><title>TV Shows Admin — RoyalQueen</title></Head>

      <div className="min-h-screen pt-24 pb-16 px-4 max-w-7xl mx-auto">

        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link href="/admin" className="text-cinema-muted hover:text-white transition-colors">
            <FiChevronLeft size={24} />
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <FiTv className="text-cinema-accent text-2xl" />
              <h1 className="text-3xl text-white" style={{ fontFamily: 'Bebas Neue, serif', letterSpacing: '0.1em' }}>
                IMPORT TV SHOWS
              </h1>
            </div>
            <p className="text-cinema-muted text-sm mt-1">Search TMDB and import full seasons with episode stream links</p>
          </div>
        </div>

        {/* Message */}
        {message && (
          <div className={`mb-6 px-4 py-3 rounded-xl text-sm border ${
            message.startsWith('✅') ? 'bg-green-500/10 border-green-500/30 text-green-400' :
            message.startsWith('⚠️') ? 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400' :
            message.startsWith('⏳') ? 'bg-blue-500/10 border-blue-500/30 text-blue-400' :
            'bg-red-500/10 border-red-500/30 text-red-400'
          }`}>
            {message}
          </div>
        )}

        {/* Search */}
        <div className="bg-cinema-card border border-cinema-border rounded-2xl p-6 mb-8">
          <div className="flex flex-wrap gap-3">
            <input
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && search()}
              placeholder="Search TV shows (e.g. Breaking Bad, Game of Thrones)..."
              className="flex-1 min-w-60 bg-cinema-dark border border-cinema-border rounded-xl px-4 py-2.5 text-cinema-text placeholder-cinema-muted outline-none focus:border-cinema-accent text-sm"
            />
            {!query && (
              <select
                value={category}
                onChange={e => setCategory(e.target.value)}
                className="bg-cinema-dark border border-cinema-border rounded-xl px-4 py-2.5 text-cinema-text outline-none focus:border-cinema-accent text-sm"
              >
                <option value="popular">Popular</option>
                <option value="top_rated">Top Rated</option>
                <option value="trending">Trending</option>
                <option value="airing">Currently Airing</option>
              </select>
            )}
            <button
              onClick={search}
              disabled={searching}
              className="flex items-center gap-2 bg-cinema-accent hover:bg-red-700 text-white px-6 py-2.5 rounded-xl font-medium text-sm transition-colors disabled:opacity-50"
            >
              {searching ? <FiLoader size={16} className="animate-spin" /> : <FiSearch size={16} />}
              {searching ? 'Searching...' : 'Search'}
            </button>
          </div>
          <p className="text-cinema-muted text-xs mt-3">
            💡 Importing a show fetches all seasons and episodes automatically. Each episode gets 6 stream servers.
          </p>
        </div>

        {/* Results */}
        {results.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 mb-8">
            {results.map(show => {
              const status = importing[show.tmdbId];
              return (
                <div key={show.tmdbId} className="bg-cinema-card border border-cinema-border rounded-xl overflow-hidden">
                  <div className="relative aspect-[2/3]">
                    {show.poster ? (
                      <Image src={show.poster} alt={show.title} fill className="object-cover" unoptimized />
                    ) : (
                      <div className="w-full h-full bg-cinema-dark flex items-center justify-center">
                        <FiTv className="text-cinema-muted text-4xl" />
                      </div>
                    )}
                    {show.totalSeasons > 0 && (
                      <div className="absolute top-2 left-2 bg-black/70 text-white text-xs px-2 py-0.5 rounded">
                        {show.totalSeasons}S
                      </div>
                    )}
                  </div>
                  <div className="p-3">
                    <p className="text-cinema-text text-xs font-medium truncate">{show.title}</p>
                    <p className="text-cinema-muted text-xs mt-0.5">{show.year} · ⭐ {show.rating}</p>
                    <button
                      onClick={() => importShow(show)}
                      disabled={status === 'loading' || status === 'done'}
                      className={`mt-2 w-full flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                        status === 'done'    ? 'bg-green-500/20 border border-green-500/30 text-green-400 cursor-default' :
                        status === 'loading' ? 'bg-cinema-border text-cinema-muted cursor-wait' :
                        status === 'error'   ? 'bg-red-500/20 border border-red-500/30 text-red-400 hover:bg-red-500/30' :
                        'bg-cinema-accent hover:bg-red-700 text-white'
                      }`}
                    >
                      {status === 'loading' && <FiLoader size={12} className="animate-spin" />}
                      {status === 'done'    && <FiCheck size={12} />}
                      {!status              && <FiDownload size={12} />}
                      {status === 'loading' ? 'Importing...' : status === 'done' ? 'Imported' : status === 'error' ? 'Retry' : 'Import'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Danger zone */}
        <div className="border border-red-500/20 rounded-2xl p-6 bg-red-500/5">
          <h3 className="text-red-400 font-semibold mb-2">Danger Zone</h3>
          <p className="text-cinema-muted text-sm mb-4">Delete all TV shows from the database. This cannot be undone.</p>
          <button
            onClick={deleteAll}
            disabled={deleting}
            className="flex items-center gap-2 bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 text-red-400 px-4 py-2 rounded-xl text-sm transition-colors disabled:opacity-50"
          >
            <FiTrash2 size={14} />
            {deleting ? 'Deleting...' : 'Delete All TV Shows'}
          </button>
        </div>
      </div>
    </>
  );
}
