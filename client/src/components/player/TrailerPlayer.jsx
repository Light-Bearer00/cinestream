/**
 * Trailer Player
 * Fetches and plays official YouTube trailer from TMDB
 */
import { useState, useEffect } from 'react';
import { FiPlay, FiX, FiYoutube } from 'react-icons/fi';

const TMDB_KEY = process.env.NEXT_PUBLIC_TMDB_KEY || 'd4c55464b2e3eb6c6ec8aa2173bf6e2d';

export default function TrailerPlayer({ tmdbId, type = 'movie', title = '' }) {
  const [trailerKey, setTrailerKey] = useState(null);
  const [showTrailer, setShowTrailer] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!tmdbId) return;
    setLoading(true);
    fetch(`https://api.themoviedb.org/3/${type}/${tmdbId}/videos?api_key=${TMDB_KEY}`)
      .then(r => r.json())
      .then(data => {
        const trailer = (data.results || []).find(v =>
          v.site === 'YouTube' && (v.type === 'Trailer' || v.type === 'Teaser')
        );
        if (trailer) setTrailerKey(trailer.key);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [tmdbId, type]);

  if (!trailerKey && !loading) return null;

  return (
    <>
      <button
        onClick={() => setShowTrailer(true)}
        disabled={loading || !trailerKey}
        className="flex items-center gap-2 px-6 py-3 rounded-full border border-red-500/50 text-red-400 hover:bg-red-500/10 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
      >
        <FiYoutube size={18} />
        {loading ? 'Loading...' : 'Watch Trailer'}
      </button>

      {showTrailer && trailerKey && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4"
          onClick={() => setShowTrailer(false)}>
          <div className="relative w-full max-w-4xl aspect-video" onClick={e => e.stopPropagation()}>
            <button
              onClick={() => setShowTrailer(false)}
              className="absolute -top-10 right-0 text-white hover:text-cinema-accent transition-colors flex items-center gap-2"
            >
              <FiX size={20} /> Close
            </button>
            <iframe
              src={`https://www.youtube.com/embed/${trailerKey}?autoplay=1&rel=0`}
              className="w-full h-full rounded-2xl"
              allowFullScreen
              allow="autoplay; fullscreen"
              title={`${title} Trailer`}
            />
          </div>
        </div>
      )}
    </>
  );
}
