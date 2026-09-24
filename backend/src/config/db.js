const mongoose = require('mongoose');

let mongoMemoryServer = null;

const connectDB = async () => {
  const uri = process.env.MONGODB_URI;
  const isProduction = process.env.NODE_ENV === 'production' || process.env.VERCEL;

  if (uri && uri.trim() !== '') {
    try {
      console.log(`Attempting to connect to MongoDB Atlas...`);
      const conn = await mongoose.connect(uri, {
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 10000,
      });
      console.log(`Connected to MongoDB: ${conn.connection.host}`);
      return conn;
    } catch (err) {
      if (isProduction) {
        // In production (Vercel), never try in-memory fallback — it won't work
        throw new Error(`MongoDB Atlas connection failed: ${err.message}`);
      }
      console.warn(`Could not connect to external MongoDB: ${err.message}. Falling back to in-memory MongoDB...`);
    }
  } else if (isProduction) {
    throw new Error('MONGODB_URI environment variable is not set. Please configure it in your Vercel project settings.');
  }

  // Local/test fallback: use in-memory MongoDB
  try {
    const { MongoMemoryServer } = require('mongodb-memory-server');
    console.log('Spinning up embedded MongoDB Memory Server...');
    mongoMemoryServer = await MongoMemoryServer.create();
    const memoryUri = mongoMemoryServer.getUri();
    console.log(`In-memory MongoDB running at: ${memoryUri}`);

    const conn = await mongoose.connect(memoryUri);
    console.log('Successfully connected to in-memory MongoDB!');
    return conn;
  } catch (error) {
    console.error('Failed to initialize MongoDB connection:', error.message);
    throw error;
  }
};

const closeDB = async () => {
  try {
    await mongoose.connection.close();
    if (mongoMemoryServer) {
      await mongoMemoryServer.stop();
    }
    console.log('MongoDB connection closed.');
  } catch (err) {
    console.error('Error closing MongoDB connection:', err.message);
  }
};

module.exports = { connectDB, closeDB };
