// ── ADD THIS ROUTE TO server/routes/movies.js ────────────────────────────────
// Place it BEFORE the module.exports line

/**
 * POST /api/movies/:id/view
 * Increments view count — called when user starts watching
 */
router.post('/:id/view', async (req, res) => {
  try {
    await Movie.findByIdAndUpdate(req.params.id, { $inc: { views: 1 } });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});
