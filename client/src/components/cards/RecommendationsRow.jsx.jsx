/**
 * Recommendations Row
 */
import { useState, useEffect } from 'react';
import { movieApi } from '../../utils/api';
import MovieCard from './MovieCard';
import { getAllContinueWatching } from '../../utils/watchProgress';

export default function RecommendationsRow() {
  const [movies,  setMovies]  = useState([]);
  const [basedOn, setBasedOn] = useState('');

  useEffect(() => {
    try {
      const history = getAllContinueWatching();
      if (!history || !history.length) return;
      const recent = history[0];
      const title  = recent.showTitle || recent.title || '';
      setBasedOn(title);
      movieApi.getAll({ sort: 'rating', limit: 12 })
        .then(r => setMovies(r.data.movies || []))
        .catch(() => {});
    } catch (e) {
      // silently fail
    }
  }, []);

  if (!movies.length) return null;

  return (
    <section className="mb-10">
      <div className="px-4 sm:px-6 lg:px-8 mb-4">
        <h2 className="text-2xl text-white" style={{ fontFamily: 'Bebas Neue, serif', letterSpacing: '0.1em' }}>
          Because You Watched
        </h2>
        {basedOn && <p className="text-cinema-accent text-sm mt-0.5">{basedOn}</p>}
      </div>
      <div className="flex gap-4 overflow-x-auto px-4 sm:px-6 lg:px-8 pb-2 scrollbar-hide">
        {movies.map(movie => (
          <div key={movie._id} className="shrink-0 w-36">
            <MovieCard movie={movie} size="sm" />
          </div>
        ))}
      </div>
    </section>
  );
}
