/**
 * Movie Routes
 * Public endpoints for browsing, searching, and streaming movies.
 */

const express = require('express');
const Movie = require('../models/Movie');
const { optionalAuth } = require('../middleware/auth');

const router = express.Router();

// GET /api/movies — list all movies with filters
router.get('/', async (req, res) => {
  try {
    const {
      genre,
      year,
      search,
      featured,
      trending,
      page = 1,
      limit = 20,
      sort = '-createdAt',
    } = req.query;

    const query = { isPublished: true };

    if (genre) query.genre = { $in: [genre] };
    if (year) query.year = Number(year);
    if (featured === 'true') query.isFeatured = true;
    if (trending === 'true') query.isTrending = true;

    // Full-text search on title/description
    if (search) {
      query.$text = { $search: search };
    }

    const skip = (Number(page) - 1) * Number(limit);
    const total = await Movie.countDocuments(query);
    const movies = await Movie.find(query)
      .sort(sort)
      .skip(skip)
      .limit(Number(limit));

    res.json({
      movies,
      total,
      page: Number(page),
      pages: Math.ceil(total / Number(limit)),
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/movies/genres — unique genre list
router.get('/genres', async (req, res) => {
  try {
    const genres = await Movie.distinct('genre', { isPublished: true });
    res.json(genres.sort());
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/movies/:id — single movie detail
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const movie = await Movie.findById(req.params.id);
    if (!movie) return res.status(404).json({ message: 'Movie not found' });

    // Increment view counter
    await Movie.findByIdAndUpdate(req.params.id, { $inc: { views: 1 } });

    res.json(movie);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/movies/:id/related — related movies by genre
router.get('/:id/related', async (req, res) => {
  try {
    const movie = await Movie.findById(req.params.id);
    if (!movie) return res.status(404).json({ message: 'Movie not found' });

    const related = await Movie.find({
      _id: { $ne: movie._id },
      genre: { $in: movie.genre },
      isPublished: true,
    })
      .sort('-views')
      .limit(8);

    res.json(related);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
