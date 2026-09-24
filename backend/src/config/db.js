const mongoose = require('mongoose');

let mongoMemoryServer = null;

const connectDB = async () => {
  const uri = process.env.MONGODB_URI;

  if (uri && uri.trim() !== '') {
    try {
      console.log(`Attempting to connect to MongoDB at: ${uri}`);
      const conn = await mongoose.connect(uri, {
        serverSelectionTimeoutMS: 3000
      });
      console.log(`Connected to MongoDB: ${conn.connection.host}`);
      return conn;
    } catch (err) {
      console.warn(`Could not connect to external MongoDB: ${err.message}. Falling back to in-memory MongoDB...`);
    }
  }

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
