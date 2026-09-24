/**
 * Vercel Serverless Entry Point
 * Wraps the Express app for Vercel's serverless runtime.
 * DB connection is established lazily (once per warm instance).
 */
require('dotenv').config();
const app = require('../src/app');
const { connectDB } = require('../src/config/db');
const User = require('../src/models/User');
const { seedAll } = require('../src/seeds/seedData');

let isConnected = false;

const ensureConnected = async () => {
  if (isConnected) return;
  await connectDB();
  // Seed if empty (first cold start against a fresh Atlas DB)
  const count = await User.countDocuments();
  if (count === 0) {
    console.log('[Vercel] Empty database — running seed...');
    await seedAll();
    console.log('[Vercel] Seed complete.');
  }
  isConnected = true;
};

module.exports = async (req, res) => {
  try {
    await ensureConnected();
  } catch (err) {
    console.error('[Vercel] DB connection error:', err);
    return res.status(503).json({ success: false, message: 'Database unavailable' });
  }
  return app(req, res);
};
