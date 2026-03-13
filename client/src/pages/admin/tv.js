/**
 * /admin/tv — Admin TV Shows import page
 * Bulk select up to 20 shows and import all at once
 */

import { useState } from 'react';
import Head from 'next/head';
import Image from 'next/image';
import Link from 'next/link';
import { tvScraperApi } from '../../utils/api';
import { FiSearch, FiDownload, FiTv, FiChevronLeft, FiLoader, FiCheck, FiTrash2, FiCheckSquare, FiSquare } from 'react-icons/fi';

export default function AdminTVPage() {
  const [query,       setQuery]       = useState('');
  const [category,    setCategory]    = useState('popular');
  const [results,     setResults]     = useState([]);
  const [searching,   setSearching]   = useState(false);
  const [selected,    setSelected]    = useState({}); // { tmdbId: show }
  const [importing,   setImporting]   = useState({}); // { tmdbId: 'loading'|'done'|'error' }
  const [bulkLoading, setBulkLoading] = useState(false);
  const [message,     setMessage]     = useState('');
  const [deleting,    setDeleting]    = useState(false);
  const [progress,    setProgress]    = useState('');

  const search = async () => {
    setSearching(true);
    setResults([]);
    setSelected({});
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

  const toggleSelect = (show) => {
    setSelected(prev => {
      const next = { ...prev };
      if (next[show.tmdbId]) {
        delete next[show.tmdbId];
      } else {
        if (Object.keys(next).length >= 20) {
          setMessage('⚠️ Maximum 20 shows can be selected at once.');
          return prev;
        }
        next[show.tmdbId] = show;
      }
      return next;
    });
  };

  const selectAll = () => {
    const newSelected = {};
    results.slice(0, 20).forEach(s => { newSelected[s.tmdbId] = s; });
    setSelected(newSelected);
  };

  const clearAll = () => setSelected({});

  const importSelected = async () => {
    const shows = Object.values(selected);
    if (!shows.length) { setMessage('⚠️ No shows selected!'); return; }

    setBulkLoading(true);
    setMessage('');
    let imported = 0, skipped = 0, errors = 0;

    for (let i = 0; i < shows.length; i++) {
      const show = shows[i];
      setProgress(`⏳ Importing ${i + 1}/${shows.length}: "${show.title}"...`);
      setImporting(prev => ({ ...prev, [show.tmdbId]: 'loading' }));
      try {
        const detailRes = await tvScraperApi.details(show.tmdbId, true);
        const fullShow  = detailRes.data;
        const importRes = await tvScraperApi.import([fullShow]);
        const r = importRes.data;
        if (r.imported > 0) {
          imported++;
          setImporting(prev => ({ ...prev, [show.tmdbId]: 'done' }));
        } else if (r.skipped > 0) {
          skipped++;
          setImporting(prev => ({ ...prev, [show.tmdbId]: 'done' }));
        } else {
          errors++;
          setImporting(prev => ({ ...prev, [show.tmdbId]: 'error' }));
        }
      } catch (err) {
        errors++;
        setImporting(prev => ({ ...prev, [show.tmdbId]: 'error' }));
      }
    }

    setProgress('');
    setBulkLoading(false);
    setSelected({});
    setMessage(`✅ Done! Imported: ${imported} · Already existed: ${skipped} · Failed: ${errors}`);
  };

  const importSingle = async (show) => {
    setImporting(prev => ({ ...prev, [show.tmdbId]: 'loading' }));
    setMessage(`⏳ Fetching all seasons for "${show.title}"...`);
    try {
      const detailRes = await tvScraperApi.details(show.tmdbId, true);
      const importRes = await tvScraperApi.import([detailRes.data]);
      const r = importRes.data;
      if (r.imported > 0) {
        setImporting(prev => ({ ...prev, [show.tmdbId]: 'done' }));
        setMessage(`✅ "${show.title}" imported with ${detailRes.data.seasons?.length || 0} seasons!`);
      } else if (r.skipped > 0) {
        setImporting(prev => ({ ...prev, [show.tmdbId]: 'done' }));
        setMessage(`⚠️ "${show.title}" already exists.`);
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

  const selectedCount = Object.keys(selected).length;

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
            <p className="text-cinema-muted text-sm mt-1">Select up to 20 shows and import all at once with full seasons & episodes</p>
          </div>
        </div>

        {/* Message */}
        {(message || progress) && (
          <div className={`mb-6 px-4 py-3 rounded-xl text-sm border ${
            (message || progress).startsWith('✅') ? 'bg-green-500/10 border-green-500/30 text-green-400' :
            (message || progress).startsWith('⚠️') ? 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400' :
            (message || progress).startsWith('⏳') ? 'bg-blue-500/10 border-blue-500/30 text-blue-400' :
            'bg-red-500/10 border-red-500/30 text-red-400'
          }`}>
            {progress || message}
          </div>
        )}

        {/* Search */}
        <div className="bg-cinema-card border border-cinema-border rounded-2xl p-6 mb-6">
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
            <button onClick={search} disabled={searching}
              className="flex items-center gap-2 bg-cinema-accent hover:bg-red-700 text-white px-6 py-2.5 rounded-xl font-medium text-sm transition-colors disabled:opacity-50">
              {searching ? <FiLoader size={16} className="animate-spin" /> : <FiSearch size={16} />}
              {searching ? 'Searching...' : 'Search'}
            </button>
          </div>
          <p className="text-cinema-muted text-xs mt-3">
            💡 Click shows to select them, then click <strong>Import Selected</strong>. Each show fetches all seasons + 6 stream servers per episode.
          </p>
        </div>

        {/* Bulk action bar */}
        {results.length > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4 bg-cinema-card border border-cinema-border rounded-xl px-4 py-3">
            <div className="flex items-center gap-3">
              <span className="text-cinema-text text-sm font-medium">
                {selectedCount} of {results.length} selected
              </span>
              <button onClick={selectAll} className="text-cinema-accent text-xs hover:underline">Select All (max 20)</button>
              {selectedCount > 0 && <button onClick={clearAll} className="text-cinema-muted text-xs hover:underline">Clear</button>}
            </div>
            {selectedCount > 0 && (
              <button
                onClick={importSelected}
                disabled={bulkLoading}
                className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-5 py-2 rounded-xl text-sm font-medium transition-colors disabled:opacity-50"
              >
                {bulkLoading ? <FiLoader size={14} className="animate-spin" /> : <FiDownload size={14} />}
                {bulkLoading ? 'Importing...' : `Import ${selectedCount} Show${selectedCount > 1 ? 's' : ''}`}
              </button>
            )}
          </div>
        )}

        {/* Results grid */}
        {results.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 mb-8">
            {results.map(show => {
              const status    = importing[show.tmdbId];
              const isSelected = !!selected[show.tmdbId];
              return (
                <div
                  key={show.tmdbId}
                  className={`bg-cinema-card border rounded-xl overflow-hidden cursor-pointer transition-all ${
                    isSelected ? 'border-purple-500 ring-2 ring-purple-500/40' : 'border-cinema-border hover:border-cinema-accent'
                  }`}
                  onClick={() => status !== 'loading' && status !== 'done' && toggleSelect(show)}
                >
                  <div className="relative aspect-[2/3]">
                    {show.poster ? (
                      <Image src={show.poster} alt={show.title} fill className="object-cover" unoptimized />
                    ) : (
                      <div className="w-full h-full bg-cinema-dark flex items-center justify-center">
                        <FiTv className="text-cinema-muted text-4xl" />
                      </div>
                    )}
                    {/* Select checkbox */}
                    <div className="absolute top-2 right-2">
                      {status === 'done' ? (
                        <div className="bg-green-500 rounded-full p-1"><FiCheck size={12} className="text-white" /></div>
                      ) : status === 'loading' ? (
                        <div className="bg-black/70 rounded-full p-1"><FiLoader size={12} className="text-white animate-spin" /></div>
                      ) : isSelected ? (
                        <div className="bg-purple-600 rounded-full p-1"><FiCheckSquare size={12} className="text-white" /></div>
                      ) : (
                        <div className="bg-black/50 rounded-full p-1"><FiSquare size={12} className="text-white" /></div>
                      )}
                    </div>
                    {show.totalSeasons > 0 && (
                      <div className="absolute top-2 left-2 bg-black/70 text-white text-xs px-2 py-0.5 rounded">
                        {show.totalSeasons}S
                      </div>
                    )}
                    {/* Done overlay */}
                    {status === 'done' && (
                      <div className="absolute inset-0 bg-green-500/20 flex items-center justify-center">
                        <FiCheck size={40} className="text-green-400" />
                      </div>
                    )}
                  </div>
                  <div className="p-3">
                    <p className="text-cinema-text text-xs font-medium truncate">{show.title}</p>
                    <p className="text-cinema-muted text-xs mt-0.5">{show.year} · ⭐ {show.rating}</p>
                    {/* Single import button */}
                    {status !== 'done' && (
                      <button
                        onClick={e => { e.stopPropagation(); importSingle(show); }}
                        disabled={status === 'loading' || bulkLoading}
                        className="mt-2 w-full flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-medium bg-cinema-border hover:bg-cinema-accent hover:text-white text-cinema-muted transition-all disabled:opacity-40"
                      >
                        <FiDownload size={11} /> Import Only This
                      </button>
                    )}
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
          <button onClick={deleteAll} disabled={deleting}
            className="flex items-center gap-2 bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 text-red-400 px-4 py-2 rounded-xl text-sm transition-colors disabled:opacity-50">
            <FiTrash2 size={14} />
            {deleting ? 'Deleting...' : 'Delete All TV Shows'}
          </button>
        </div>
      </div>
    </>
  );
}
