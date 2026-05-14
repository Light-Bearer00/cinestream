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
      setBasedOn(recent.showTitle || recent.title || '');
      movieApi.getAll({ sort: 'rating', limit: 12 })
        .then(r => setMovies(r.data.movies || []))
        .catch(() => {});
    } catch (e) {}
  }, []);

  if (!movies.length) return null;

  return (
    <section className="py-4">
      <div className="flex items-center justify-between mb-4 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <h2 className="text-2xl md:text-3xl text-white"
          style={{ fontFamily: 'Bebas Neue, serif', letterSpacing: '0.1em' }}>
          Because You Watched
        </h2>
        {basedOn && <p className="text-cinema-accent text-sm ml-3 self-end mb-1">{basedOn}</p>}
      </div>
      <div className="scroll-row flex gap-4 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        {movies.map(movie => (
          <MovieCard key={movie._id} movie={movie} size="sm" />
        ))}
      </div>
    </section>
  );
}
