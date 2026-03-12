/**
 * Admin Scraper Page
 * - Browse TMDB (Popular / Top Rated / Trending / Upcoming / By Genre / Search)
 * - Select movies, auto-attach VidSrc + 2embed + SuperEmbed stream URLs
 * - Preview enriched data, then bulk-import into CineStream DB
 * - Delete ALL movies with a safety confirmation
 */

import { useState, useEffect, useCallback } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useAuth } from '../../context/AuthContext';
import { scraperApi, adminApi } from '../../utils/api';

/* ─── Icons (inline SVG to avoid extra deps) ────────────────────────────────── */
const Icon = {
  Search:  () => <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>,
  Check:   () => <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>,
  Import:  () => <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>,
  Trash:   () => <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>,
  Film:    () => <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="2" y="2" width="20" height="20" rx="2.18"/><path d="M7 2v20M17 2v20M2 12h20M2 7h5M17 7h5M2 17h5M17 17h5"/></svg>,
  Star:    () => <svg width="12" height="12" fill="currentColor" viewBox="0 0 24 24"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>,
  Arrow:   () => <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>,
  Back:    () => <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>,
  X:       () => <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
  Zap:     () => <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>,
  Grid:    () => <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>,
  Refresh: () => <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>,
  Globe:   () => <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>,
  Warning: () => <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>,
};

/* ─── Stream provider badges ─────────────────────────────────────────────────── */
const PROVIDERS = [
  { key: 'vidsrc',   label: 'VidSrc',    color: '#3b82f6' },
  { key: 'vidstream',label: '2Embed',    color: '#8b5cf6' },
  { key: 'upcloud',  label: 'SuperEmbed',color: '#f59e0b' },
  { key: 'filemoon', label: 'EmbedSu',   color: '#10b981' },
];

const CATEGORIES = [
  { id: 'popular',   label: '🔥 Popular'   },
  { id: 'trending',  label: '📈 Trending'  },
  { id: 'top_rated', label: '⭐ Top Rated' },
  { id: 'upcoming',  label: '🎬 Upcoming'  },
];

const TMDB_GENRES = [
  {id:28,name:'Action'},{id:12,name:'Adventure'},{id:16,name:'Animation'},
  {id:35,name:'Comedy'},{id:80,name:'Crime'},{id:99,name:'Documentary'},
  {id:18,name:'Drama'},{id:14,name:'Fantasy'},{id:27,name:'Horror'},
  {id:9648,name:'Mystery'},{id:10749,name:'Romance'},{id:878,name:'Sci-Fi'},
  {id:53,name:'Thriller'},{id:37,name:'Western'},
];

/* ═══════════════════════════════════════════════════════════════════════════════
   MovieCard – grid card with select checkbox
═══════════════════════════════════════════════════════════════════════════════ */
function MovieCard({ movie, selected, onToggle, onPreview }) {
  return (
    <div
      onClick={() => onToggle(movie)}
      className={`relative rounded-xl overflow-hidden cursor-pointer transition-all duration-200 group
        ${selected
          ? 'ring-2 ring-red-500 scale-[0.97]'
          : 'hover:scale-[1.02] hover:ring-1 hover:ring-white/20'
        }`}
      style={{ background: '#0f0f0f', border: '1px solid #1f1f1f' }}
    >
      {/* Poster */}
      <div className="relative aspect-[2/3] overflow-hidden bg-[#111]">
        {movie.poster ? (
          <img
            src={movie.poster}
            alt={movie.title}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-3xl text-[#333]">🎬</div>
        )}

        {/* Overlay gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

        {/* Check badge */}
        {selected && (
          <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-red-500 flex items-center justify-center shadow-lg">
            <Icon.Check />
          </div>
        )}

        {/* Rating badge */}
        {movie.rating > 0 && (
          <div className="absolute top-2 left-2 flex items-center gap-1 bg-black/70 backdrop-blur-sm text-yellow-400 text-xs px-1.5 py-0.5 rounded-md font-medium">
            <Icon.Star />{movie.rating}
          </div>
        )}

        {/* Preview button */}
        <button
          onClick={(e) => { e.stopPropagation(); onPreview(movie); }}
          className="absolute bottom-2 right-2 text-xs bg-white/10 hover:bg-white/25 backdrop-blur-sm text-white px-2 py-1 rounded-md transition-colors opacity-0 group-hover:opacity-100"
        >
          Details
        </button>
      </div>

      {/* Info */}
      <div className="p-2.5">
        <p className="text-white text-xs font-medium truncate leading-tight">{movie.title}</p>
        <p className="text-[#666] text-xs mt-0.5">{movie.year || '—'}</p>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════════
   MovieDetailModal – preview before adding to selection
═══════════════════════════════════════════════════════════════════════════════ */
function MovieDetailModal({ movie, selected, onToggle, onClose }) {
  const [details, setDetails]   = useState(null);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    scraperApi.details(movie.tmdbId).then(r => {
      setDetails(r.data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [movie.tmdbId]);

  const data = details || movie;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={onClose}>
      <div
        className="relative w-full max-w-2xl rounded-2xl overflow-hidden shadow-2xl"
        style={{ background: '#0a0a0a', border: '1px solid #222' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Backdrop */}
        {data.backdrop && (
          <div className="relative h-48 overflow-hidden">
            <img src={data.backdrop} alt="" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#0a0a0a]" />
          </div>
        )}

        <div className="p-6 -mt-8 relative">
          <div className="flex gap-5">
            {/* Poster */}
            <div className="w-28 shrink-0 rounded-xl overflow-hidden shadow-xl border border-[#222]">
              {data.poster
                ? <img src={data.poster} alt="" className="w-full aspect-[2/3] object-cover" />
                : <div className="w-full aspect-[2/3] bg-[#111] flex items-center justify-center text-2xl">🎬</div>
              }
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0 pt-4">
              <h2 className="text-white text-xl font-bold leading-tight">{data.title}</h2>
              <div className="flex items-center gap-3 mt-1 text-[#888] text-xs">
                <span>{data.year}</span>
                {data.rating > 0 && (
                  <span className="flex items-center gap-1 text-yellow-400">
                    <Icon.Star />{data.rating}
                  </span>
                )}
                {data.duration > 0 && <span>{data.duration} min</span>}
              </div>
              <div className="flex flex-wrap gap-1.5 mt-2">
                {(data.genre || []).map(g => (
                  <span key={g} className="text-[10px] px-2 py-0.5 rounded-full text-[#aaa]" style={{background:'#1a1a1a',border:'1px solid #2a2a2a'}}>{g}</span>
                ))}
              </div>
            </div>

            <button onClick={onClose} className="text-[#555] hover:text-white transition-colors mt-4 shrink-0">
              <Icon.X />
            </button>
          </div>

          {/* Description */}
          <p className="text-[#888] text-sm mt-4 leading-relaxed line-clamp-4">{data.description}</p>

          {/* Stream sources */}
          <div className="mt-5">
            <p className="text-[#555] text-xs uppercase tracking-wider mb-2 font-medium">Stream Sources (Auto-attached)</p>
            {loading ? (
              <div className="text-[#444] text-xs animate-pulse">Fetching stream URLs…</div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {(details?.streamSources || []).map((s, i) => (
                  <div key={i} className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg" style={{background:'#111',border:'1px solid #222'}}>
                    <Icon.Globe />
                    <span className="text-[#ccc]">{s.label || s.provider}</span>
                  </div>
                ))}
                {!details?.streamSources?.length && <span className="text-[#555] text-xs">Loading…</span>}
              </div>
            )}
          </div>

          {/* Director / Cast */}
          {loading ? null : (
            <div className="mt-3 text-xs text-[#666] space-y-1">
              {details?.director && <p><span className="text-[#444]">Director: </span><span className="text-[#888]">{details.director}</span></p>}
              {details?.cast?.length > 0 && <p><span className="text-[#444]">Cast: </span><span className="text-[#888]">{details.cast.slice(0,4).join(', ')}</span></p>}
            </div>
          )}

          {/* Action */}
          <div className="mt-5 flex gap-3">
            <button
              onClick={() => { onToggle(details || movie); onClose(); }}
              className={`flex-1 py-3 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2
                ${selected
                  ? 'bg-[#1a1a1a] border border-[#333] text-[#888] hover:border-red-500/50 hover:text-red-400'
                  : 'bg-red-600 hover:bg-red-700 text-white'
                }`}
            >
              {selected ? (<><Icon.X /> Remove from selection</>) : (<><Icon.Check /> Add to import list</>)}
            </button>
            <button onClick={onClose} className="px-5 py-3 rounded-xl text-[#666] hover:text-white transition-colors" style={{border:'1px solid #222'}}>
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════════
   ImportModal – preview selected movies then trigger import
═══════════════════════════════════════════════════════════════════════════════ */
function ImportModal({ selected, onClose, onDone }) {
  const [step,     setStep]     = useState('enrich');   // enrich | preview | importing | done
  const [enriched, setEnriched] = useState([]);
  const [progress, setProgress] = useState({ done: 0, total: 0, imported: 0, skipped: 0, errors: [] });

  // Enrich all selected movies with full details + stream sources
  useEffect(() => {
    let alive = true;
    (async () => {
      const results = [];
      for (const m of selected) {
        try {
          const r = await scraperApi.details(m.tmdbId);
          if (alive) results.push(r.data);
        } catch {
          if (alive) results.push(m); // fallback: use preview data
        }
        if (alive) setProgress(p => ({ ...p, done: p.done + 1, total: selected.length }));
        await new Promise(r => setTimeout(r, 120));
      }
      if (alive) { setEnriched(results); setStep('preview'); }
    })();
    return () => { alive = false; };
  }, []);

  const handleImport = async () => {
    setStep('importing');
    try {
      const res = await scraperApi.import(enriched);
      setProgress(p => ({
        ...p,
        imported: res.data.imported,
        skipped:  res.data.skipped,
        errors:   res.data.errors || [],
      }));
      setStep('done');
    } catch (e) {
      setProgress(p => ({ ...p, errors: [e.response?.data?.message || e.message] }));
      setStep('done');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm">
      <div className="w-full max-w-xl rounded-2xl overflow-hidden shadow-2xl" style={{background:'#0a0a0a',border:'1px solid #222'}}>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4" style={{borderBottom:'1px solid #1a1a1a'}}>
          <h3 className="text-white font-semibold">
            {step === 'enrich'    && '⚡ Fetching stream URLs…'}
            {step === 'preview'   && `📋 Ready to import ${enriched.length} movies`}
            {step === 'importing' && '🚀 Importing movies…'}
            {step === 'done'      && (progress.errors.length === 0 ? '✅ All done!' : '⚠️ Completed with issues')}
          </h3>
          <button onClick={onClose} className="text-[#555] hover:text-white transition-colors"><Icon.X /></button>
        </div>

        <div className="p-6">

          {/* ENRICH STEP */}
          {step === 'enrich' && (
            <div className="text-center py-6">
              <div className="text-4xl mb-4 animate-pulse">🌐</div>
              <p className="text-[#888] text-sm mb-5">
                Fetching full details and stream sources for {selected.length} movies…
              </p>
              <div className="w-full rounded-full h-2 mb-2" style={{background:'#1a1a1a'}}>
                <div className="bg-red-500 h-2 rounded-full transition-all duration-300"
                  style={{width: selected.length ? `${(progress.done/selected.length)*100}%` : '0%'}} />
              </div>
              <p className="text-[#555] text-xs">{progress.done} / {selected.length}</p>
            </div>
          )}

          {/* PREVIEW STEP */}
          {step === 'preview' && (
            <>
              <div className="max-h-80 overflow-y-auto space-y-2 mb-5" style={{scrollbarWidth:'thin'}}>
                {enriched.map((m, i) => (
                  <div key={i} className="flex items-center gap-3 rounded-xl p-3" style={{background:'#111',border:'1px solid #1a1a1a'}}>
                    {m.poster
                      ? <img src={m.poster} alt="" className="w-8 h-11 object-cover rounded shrink-0" />
                      : <div className="w-8 h-11 rounded shrink-0 flex items-center justify-center text-sm" style={{background:'#1a1a1a'}}>🎬</div>
                    }
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm font-medium truncate">{m.title}</p>
                      <p className="text-[#666] text-xs">{m.year}{m.rating > 0 ? ` · ⭐ ${m.rating}` : ''}</p>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      {(m.streamSources || []).slice(0, 3).map((s, j) => (
                        <span key={j} className="text-[10px] px-1.5 py-0.5 rounded text-[#888]" style={{background:'#1a1a1a',border:'1px solid #252525'}}>
                          {s.label || s.provider}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              <div className="rounded-xl p-3 mb-5 text-xs text-[#666]" style={{background:'#0d0d0d',border:'1px solid #1a1a1a'}}>
                💡 Duplicate titles (already in your database) will be <span className="text-yellow-400">skipped automatically</span>.
              </div>
              <div className="flex gap-3">
                <button onClick={handleImport}
                  className="flex-1 flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white py-3 rounded-xl font-semibold transition-colors">
                  <Icon.Import /> Import {enriched.length} Movies
                </button>
                <button onClick={onClose}
                  className="px-5 py-3 rounded-xl text-[#666] hover:text-white transition-colors" style={{border:'1px solid #222'}}>
                  Cancel
                </button>
              </div>
            </>
          )}

          {/* IMPORTING */}
          {step === 'importing' && (
            <div className="text-center py-8">
              <div className="text-4xl mb-4 animate-pulse">🎬</div>
              <p className="text-white font-semibold mb-1">Importing to your database…</p>
              <p className="text-[#666] text-sm">Please wait</p>
            </div>
          )}

          {/* DONE */}
          {step === 'done' && (
            <div className="text-center py-6">
              <div className="text-5xl mb-4">{progress.errors.length === 0 ? '🎉' : '⚠️'}</div>
              <p className="text-white font-semibold text-lg mb-3">
                {progress.imported} movies imported
                {progress.skipped > 0 && `, ${progress.skipped} skipped (duplicates)`}
              </p>
              {progress.errors.length > 0 && (
                <div className="text-left rounded-xl p-3 mb-4 max-h-28 overflow-y-auto" style={{background:'#1a0000',border:'1px solid #3a0000'}}>
                  {progress.errors.map((e, i) => <p key={i} className="text-red-400 text-xs">{e}</p>)}
                </div>
              )}
              <button onClick={() => { onDone(); onClose(); }}
                className="bg-red-600 hover:bg-red-700 text-white px-8 py-3 rounded-xl font-semibold transition-colors">
                Done — View Library
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════════
   DeleteAllModal – safety confirmation
═══════════════════════════════════════════════════════════════════════════════ */
function DeleteAllModal({ movieCount, onClose, onDeleted }) {
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [done,    setDone]    = useState(false);
  const [deleted, setDeleted] = useState(0);
  const [error,   setError]   = useState('');

  const REQUIRED = 'delete all movies';

  const handleDelete = async () => {
    if (confirm.toLowerCase() !== REQUIRED) return;
    setLoading(true); setError('');
    try {
      const res = await scraperApi.deleteAll();
      setDeleted(res.data.deleted);
      setDone(true);
    } catch (e) {
      setError(e.response?.data?.message || e.message);
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm">
        <div className="w-full max-w-sm rounded-2xl p-8 text-center" style={{background:'#0a0a0a',border:'1px solid #222'}}>
          <div className="text-5xl mb-4">🗑️</div>
          <p className="text-white font-bold text-xl mb-2">{deleted} movies deleted</p>
          <p className="text-[#666] text-sm mb-6">Your library is now empty.</p>
          <button onClick={() => { onDeleted(); onClose(); }}
            className="w-full bg-red-600 hover:bg-red-700 text-white py-3 rounded-xl font-semibold transition-colors">
            OK
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-2xl overflow-hidden shadow-2xl" style={{background:'#0a0a0a',border:'1px solid #3a0000'}}>
        <div className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-red-500"><Icon.Warning /></span>
            <h3 className="text-white font-bold text-lg">Delete ALL Movies?</h3>
          </div>
          <p className="text-[#888] text-sm mb-2">
            This will permanently delete <span className="text-red-400 font-semibold">{movieCount} movies</span> from your database.
            This action <span className="text-white font-semibold">cannot be undone.</span>
          </p>
          <p className="text-[#666] text-xs mb-4">
            Type <span className="text-[#aaa] font-mono bg-[#111] px-1 rounded">delete all movies</span> to confirm:
          </p>
          <input
            type="text"
            value={confirm}
            onChange={e => setConfirm(e.target.value)}
            placeholder="delete all movies"
            className="w-full text-sm rounded-xl px-3 py-2.5 mb-4 outline-none transition-colors"
            style={{
              background:'#111', border:`1px solid ${confirm.toLowerCase()===REQUIRED ? '#ef4444' : '#222'}`,
              color:'#fff', fontFamily:'monospace'
            }}
            onKeyDown={e => e.key === 'Enter' && handleDelete()}
          />
          {error && <p className="text-red-400 text-xs mb-3">{error}</p>}
          <div className="flex gap-3">
            <button
              onClick={handleDelete}
              disabled={confirm.toLowerCase() !== REQUIRED || loading}
              className="flex-1 py-3 rounded-xl font-semibold text-sm transition-all disabled:opacity-30"
              style={{background:'#7f1d1d',color:'#fca5a5',border:'1px solid #991b1b'}}
            >
              {loading ? 'Deleting…' : '🗑️ Delete Everything'}
            </button>
            <button onClick={onClose}
              className="px-5 py-3 rounded-xl text-[#666] hover:text-white transition-colors" style={{border:'1px solid #222'}}>
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════════
   MAIN PAGE
═══════════════════════════════════════════════════════════════════════════════ */
export default function ScraperPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [movies,      setMovies]      = useState([]);
  const [loading,     setLoading]     = useState(false);
  const [page,        setPage]        = useState(1);
  const [totalPages,  setTotalPages]  = useState(1);
  const [category,    setCategory]    = useState('popular');
  const [genreFilter, setGenreFilter] = useState(null);
  const [searchQ,     setSearchQ]     = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [mode,        setMode]        = useState('browse'); // browse | search | genre
  const [selected,    setSelected]    = useState([]);      // [{tmdbId,title,…}]
  const [previewMovie,setPreviewMovie]= useState(null);
  const [showImport,  setShowImport]  = useState(false);
  const [showDeleteAll,setShowDeleteAll]=useState(false);
  const [dbCount,     setDbCount]     = useState(null);
  const [tmdbKeyMissing,setTmdbKeyMissing] = useState(false);

  useEffect(() => {
    if (!authLoading && user && user.role !== 'admin') router.replace('/');
  }, [user, authLoading]);

  // Load DB movie count for the delete button
  useEffect(() => {
    adminApi.getStats().then(r => setDbCount(r.data.totalMovies)).catch(() => {});
  }, []);

  const fetchMovies = useCallback(async (p = 1) => {
    setLoading(true);
    try {
      let res;
      if (mode === 'search' && searchQ) {
        res = await scraperApi.search(searchQ, p);
      } else if (mode === 'genre' && genreFilter) {
        res = await scraperApi.byGenre(genreFilter, p);
      } else {
        res = await scraperApi.popular(category, p);
      }
      setMovies(res.data.movies || []);
      setTotalPages(res.data.pages || 1);
      setPage(p);
      setTmdbKeyMissing(false);
    } catch (e) {
      const msg = e.response?.data?.message || '';
      if (msg.includes('TMDB_API_KEY')) setTmdbKeyMissing(true);
      setMovies([]);
    }
    setLoading(false);
  }, [mode, searchQ, genreFilter, category]);

  useEffect(() => {
    if (user?.role === 'admin') fetchMovies(1);
  }, [mode, searchQ, genreFilter, category, user]);

  const toggleSelect = (movie) => {
    setSelected(prev => {
      const exists = prev.find(m => m.tmdbId === movie.tmdbId);
      return exists ? prev.filter(m => m.tmdbId !== movie.tmdbId) : [...prev, movie];
    });
  };

  const isSelected = (movie) => selected.some(m => m.tmdbId === movie.tmdbId);

  const handleSearch = (e) => {
    e.preventDefault();
    if (!searchInput.trim()) return;
    setMode('search');
    setSearchQ(searchInput.trim());
    setPage(1);
  };

  const handleCategory = (cat) => {
    setMode('browse');
    setCategory(cat);
    setGenreFilter(null);
    setPage(1);
  };

  const handleGenre = (id) => {
    setMode('genre');
    setGenreFilter(id);
    setPage(1);
  };

  if (authLoading || !user) return null;
  if (user.role !== 'admin') return null;

  return (
    <>
      <Head><title>Movie Scraper — CineStream Admin</title></Head>

      <div className="min-h-screen pt-20 pb-16" style={{background:'#050505'}}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          {/* ── Header ── */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <Link href="/admin" className="text-[#444] hover:text-[#888] transition-colors text-sm flex items-center gap-1">
                  <Icon.Back /> Admin
                </Link>
                <span className="text-[#333]">/</span>
                <span className="text-[#888] text-sm">Movie Scraper</span>
              </div>
              <h1 className="text-white font-bold text-3xl tracking-tight">🎬 Movie Scraper</h1>
              <p className="text-[#555] text-sm mt-1">Browse TMDB, select movies, auto-attach stream URLs, import to your library</p>
            </div>

            {/* Right actions */}
            <div className="flex items-center gap-3">
              {/* Delete All */}
              <button
                onClick={() => setShowDeleteAll(true)}
                className="flex items-center gap-2 text-red-500 hover:text-red-400 border border-red-900/50 hover:border-red-700 px-4 py-2.5 rounded-xl text-sm transition-all"
                style={{background:'#150000'}}
              >
                <Icon.Trash />
                Delete All {dbCount !== null ? `(${dbCount})` : ''}
              </button>

              {/* Import selected */}
              {selected.length > 0 && (
                <button
                  onClick={() => setShowImport(true)}
                  className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors"
                >
                  <Icon.Import />
                  Import {selected.length} Movie{selected.length !== 1 ? 's' : ''}
                </button>
              )}
            </div>
          </div>

          {/* ── TMDB key missing warning ── */}
          {tmdbKeyMissing && (
            <div className="rounded-2xl p-5 mb-6 flex items-start gap-4" style={{background:'#120a00',border:'1px solid #3a2200'}}>
              <span className="text-yellow-400 mt-0.5"><Icon.Warning /></span>
              <div>
                <p className="text-yellow-300 font-semibold text-sm mb-1">TMDB API Key Missing</p>
                <p className="text-[#888] text-sm">
                  Add your free TMDB API key to the server <code className="text-yellow-400 bg-[#1a1200] px-1 rounded text-xs">.env</code> file:
                </p>
                <code className="block mt-2 text-yellow-300 bg-[#1a1200] px-3 py-2 rounded-lg text-xs font-mono">
                  TMDB_API_KEY=your_key_here
                </code>
                <a href="https://www.themoviedb.org/settings/api" target="_blank" rel="noopener noreferrer"
                  className="inline-block mt-2 text-yellow-400 hover:underline text-xs">
                  Get a free TMDB API key →
                </a>
              </div>
            </div>
          )}

          {/* ── Search bar ── */}
          <form onSubmit={handleSearch} className="flex gap-3 mb-6">
            <div className="relative flex-1 max-w-md">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#444]"><Icon.Search /></span>
              <input
                type="text"
                value={searchInput}
                onChange={e => setSearchInput(e.target.value)}
                placeholder="Search TMDB for any movie…"
                className="w-full text-sm pl-9 pr-4 py-2.5 rounded-xl outline-none transition-colors"
                style={{background:'#0f0f0f',border:'1px solid #222',color:'#fff'}}
                onFocus={e => e.target.style.borderColor='#444'}
                onBlur={e => e.target.style.borderColor='#222'}
              />
            </div>
            <button type="submit"
              className="px-5 py-2.5 rounded-xl text-sm font-medium transition-colors"
              style={{background:'#1a1a1a',border:'1px solid #333',color:'#ccc'}}>
              Search
            </button>
            {mode === 'search' && (
              <button type="button" onClick={() => { setMode('browse'); setSearchInput(''); setSearchQ(''); }}
                className="px-4 py-2.5 rounded-xl text-[#555] hover:text-[#888] text-sm transition-colors flex items-center gap-1"
                style={{border:'1px solid #1a1a1a'}}>
                <Icon.X /> Clear
              </button>
            )}
          </form>

          {/* ── Category tabs ── */}
          {mode !== 'search' && (
            <div className="flex flex-wrap gap-2 mb-6">
              {/* Browse categories */}
              <div className="flex gap-1 p-1 rounded-xl" style={{background:'#0f0f0f',border:'1px solid #1a1a1a'}}>
                {CATEGORIES.map(cat => (
                  <button key={cat.id} onClick={() => handleCategory(cat.id)}
                    className="px-4 py-2 rounded-lg text-sm transition-colors"
                    style={{
                      background: mode === 'browse' && category === cat.id ? '#1f1f1f' : 'transparent',
                      color: mode === 'browse' && category === cat.id ? '#fff' : '#666',
                    }}>
                    {cat.label}
                  </button>
                ))}
              </div>

              {/* Genre dropdown-style pills */}
              <div className="flex flex-wrap gap-1.5">
                {TMDB_GENRES.map(g => (
                  <button key={g.id} onClick={() => handleGenre(g.id)}
                    className="px-3 py-1.5 rounded-lg text-xs transition-colors"
                    style={{
                      background: mode === 'genre' && genreFilter === g.id ? '#1f1f1f' : '#0f0f0f',
                      border: `1px solid ${mode === 'genre' && genreFilter === g.id ? '#333' : '#1a1a1a'}`,
                      color: mode === 'genre' && genreFilter === g.id ? '#fff' : '#555',
                    }}>
                    {g.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ── Selection bar ── */}
          {selected.length > 0 && (
            <div className="flex items-center justify-between px-4 py-3 rounded-xl mb-5"
              style={{background:'#0f0a00',border:'1px solid #2a1a00'}}>
              <div className="flex items-center gap-3">
                <span className="text-yellow-400 font-semibold text-sm">{selected.length} selected</span>
                <div className="flex gap-1.5 overflow-x-auto">
                  {selected.slice(0, 6).map(m => (
                    <span key={m.tmdbId} className="text-xs text-[#888] px-2 py-0.5 rounded-md shrink-0"
                      style={{background:'#1a1400',border:'1px solid #2a2000'}}>
                      {m.title}
                    </span>
                  ))}
                  {selected.length > 6 && <span className="text-[#555] text-xs py-0.5 shrink-0">+{selected.length - 6} more</span>}
                </div>
              </div>
              <button onClick={() => setSelected([])} className="text-[#555] hover:text-[#888] text-xs flex items-center gap-1 shrink-0">
                <Icon.X /> Clear
              </button>
            </div>
          )}

          {/* ── Movie Grid ── */}
          {loading ? (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-3">
              {Array.from({length: 20}).map((_, i) => (
                <div key={i} className="rounded-xl overflow-hidden" style={{background:'#0f0f0f',border:'1px solid #1a1a1a'}}>
                  <div className="aspect-[2/3] animate-pulse" style={{background:'#151515'}} />
                  <div className="p-2.5 space-y-1.5">
                    <div className="h-2.5 rounded animate-pulse" style={{background:'#151515'}} />
                    <div className="h-2 w-2/3 rounded animate-pulse" style={{background:'#151515'}} />
                  </div>
                </div>
              ))}
            </div>
          ) : movies.length === 0 && !tmdbKeyMissing ? (
            <div className="text-center py-20">
              <p className="text-4xl mb-3">🎬</p>
              <p className="text-[#555]">No movies found.</p>
            </div>
          ) : !tmdbKeyMissing && (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-3">
              {movies.map(movie => (
                <MovieCard
                  key={movie.tmdbId}
                  movie={movie}
                  selected={isSelected(movie)}
                  onToggle={toggleSelect}
                  onPreview={setPreviewMovie}
                />
              ))}
            </div>
          )}

          {/* ── Pagination ── */}
          {!loading && totalPages > 1 && !tmdbKeyMissing && (
            <div className="flex items-center justify-center gap-3 mt-8">
              <button
                onClick={() => fetchMovies(page - 1)}
                disabled={page <= 1}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm transition-colors disabled:opacity-30"
                style={{background:'#0f0f0f',border:'1px solid #1a1a1a',color:'#888'}}
              >
                <Icon.Back /> Previous
              </button>
              <span className="text-[#555] text-sm">Page {page} of {Math.min(totalPages, 50)}</span>
              <button
                onClick={() => fetchMovies(page + 1)}
                disabled={page >= totalPages}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm transition-colors disabled:opacity-30"
                style={{background:'#0f0f0f',border:'1px solid #1a1a1a',color:'#888'}}
              >
                Next <Icon.Arrow />
              </button>
            </div>
          )}

          {/* ── Stream info footer ── */}
          {!tmdbKeyMissing && (
            <div className="mt-10 rounded-2xl p-5" style={{background:'#0a0a0a',border:'1px solid #1a1a1a'}}>
              <p className="text-[#555] text-xs uppercase tracking-wider font-medium mb-3">Auto-attached stream sources per movie</p>
              <div className="flex flex-wrap gap-3">
                {PROVIDERS.map(p => (
                  <div key={p.key} className="flex items-center gap-2 text-xs px-3 py-2 rounded-lg" style={{background:'#0f0f0f',border:'1px solid #1a1a1a'}}>
                    <div className="w-2 h-2 rounded-full" style={{background: p.color}} />
                    <span className="text-[#888]">{p.label}</span>
                  </div>
                ))}
              </div>
              <p className="text-[#444] text-xs mt-3">
                Each imported movie automatically gets 4 stream server URLs (VidSrc, VidSrc.me, 2Embed, SuperEmbed) so viewers always have a backup source.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      {previewMovie && (
        <MovieDetailModal
          movie={previewMovie}
          selected={isSelected(previewMovie)}
          onToggle={toggleSelect}
          onClose={() => setPreviewMovie(null)}
        />
      )}

      {showImport && (
        <ImportModal
          selected={selected}
          onClose={() => setShowImport(false)}
          onDone={() => {
            setSelected([]);
            adminApi.getStats().then(r => setDbCount(r.data.totalMovies)).catch(() => {});
          }}
        />
      )}

      {showDeleteAll && (
        <DeleteAllModal
          movieCount={dbCount || 0}
          onClose={() => setShowDeleteAll(false)}
          onDeleted={() => {
            setDbCount(0);
            adminApi.getStats().then(r => setDbCount(r.data.totalMovies)).catch(() => {});
          }}
        />
      )}
    </>
  );
}
