require('dotenv').config();
const app = require('./app');
const { connectDB, closeDB } = require('./config/db');
const User = require('./models/User');
const { seedAll } = require('./seeds/seedData');

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await connectDB();

    // Check if auto-seed is needed (e.g. fresh in-memory database)
    const userCount = await User.countDocuments();
    if (userCount === 0) {
      console.log('Database is empty. Automatically generating initial seed data...');
      await seedAll();
    } else {
      console.log(`Database already has ${userCount} users. Skipping auto-seed.`);
    }

    const server = app.listen(PORT, () => {
      console.log(`====================================================`);
      console.log(`🚀 Smart Attendance Server is running on port ${PORT}`);
      console.log(`📡 Health Check: http://localhost:${PORT}/api/health`);
      console.log(`👥 Demo Accounts:`);
      console.log(`   - Admin:    admin@college.edu / Admin@123`);
      console.log(`   - Faculty:  faculty.cs1@college.edu / Faculty@123`);
      console.log(`   - Student:  student.rahul@college.edu / Student@123`);
      console.log(`   - Reviewer: reviewer.cs@college.edu / Reviewer@123`);
      console.log(`====================================================`);
    });

    // Graceful shutdown
    const shutdown = async () => {
      console.log('\nGracefully shutting down server...');
      server.close(async () => {
        await closeDB();
        process.exit(0);
      });
    };

    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);

    return server;
  } catch (error) {
    console.error('Fatal Server Startup Error:', error);
    process.exit(1);
  }
};

if (require.main === module) {
  startServer();
}

module.exports = { startServer };
