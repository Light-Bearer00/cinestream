/**
 * CineStream / RoyalQueen - Main Server Entry Point
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const path = require('path');

const movieRoutes     = require('./routes/movies');
const userRoutes      = require('./routes/users');
const authRoutes      = require('./routes/auth');
const adminRoutes     = require('./routes/admin');
const scraperRoutes   = require('./routes/scraper');
const tvRoutes        = require('./routes/tv');
const tvScraperRoutes = require('./routes/tv-scraper');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use('/api/movies',     movieRoutes);
app.use('/api/users',      userRoutes);
app.use('/api/auth',       authRoutes);
app.use('/api/admin',      adminRoutes);
app.use('/api/scraper',    scraperRoutes);
app.use('/api/tv',         tvRoutes);
app.use('/api/tv-scraper', tvScraperRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'RoyalQueen API running' });
});

// Secret one-time admin update route
app.get('/api/setup-admin', async (req, res) => {
  try {
    const { secret } = req.query;
    if (secret !== 'cinestream_setup_2024') {
      return res.status(403).json({ message: 'Invalid secret' });
    }
    const bcrypt = require('bcryptjs');
    const User   = require('./models/User');
    const newEmail    = process.env.ADMIN_EMAIL    || 'royalqueen@cinestream.com';
    const newPassword = process.env.ADMIN_PASSWORD || 'TrueQueen@SheIsTheOne01';
    const hash        = await bcrypt.hash(newPassword, 10);
    const result = await User.updateOne(
      { role: 'admin' },
      { email: newEmail, password: hash, username: newEmail.split('@')[0] }
    );
    if (result.matchedCount === 0) {
      await User.create({ username: newEmail.split('@')[0], email: newEmail, password: hash, role: 'admin' });
      return res.json({ message: '✅ Admin created!', email: newEmail });
    }
    res.json({ message: '✅ Admin updated!', email: newEmail });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/cinestream')
  .then(() => {
    console.log('✅ MongoDB connected');
    app.listen(PORT, () => {
      console.log(`🚀 RoyalQueen API running on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error('❌ MongoDB connection failed:', err.message);
    process.exit(1);
  });

module.exports = app;
