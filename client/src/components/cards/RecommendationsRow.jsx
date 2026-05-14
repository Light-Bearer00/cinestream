/**
 * Recommendations Row - matches MovieRow structure exactly
 */
import { useState, useEffect } from 'react';
import MovieCard from './MovieCard';
import { movieApi } from '../../utils/api';
import { getAllContinueWatching } from '../../utils/watchProgress';

export default function RecommendationsRow() {
  const [movies,  setMovies]  = useState([]);
  const [basedOn, setBasedOn] = useState('');

  useEffect(() => {
    try {
      const history = getAllContinueWatching();
      if (!history || !history.length) return;
      setBasedOn(history[0].showTitle || history[0].title || '');
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
          Because You Watched {basedOn && <span className="text-cinema-accent text-lg ml-2">{basedOn}</span>}
        </h2>
      </div>
      <div className="scroll-row flex gap-4 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        {movies.map(movie => (
          <MovieCard key={movie._id} movie={movie} size="sm" />
        ))}
      </div>
    </section>
  );
}
