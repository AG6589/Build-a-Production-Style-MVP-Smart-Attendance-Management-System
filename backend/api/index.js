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
  // Always set CORS headers — even before Express middleware runs
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,PATCH,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');

  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  try {
    await ensureConnected();
  } catch (err) {
    console.error('[Vercel] DB connection error:', err.message);
    return res.status(503).json({ success: false, message: 'Database unavailable', error: err.message });
  }
  return app(req, res);
};
