const dns = require('dns');
const mongoose = require('mongoose');

// Configure public DNS resolvers to handle mobile hotspot / ISP SRV issues (opt-in only)
if (process.env.NODE_ENV === 'development' && process.env.CUSTOM_DNS === 'true') {
  try {
    dns.setServers(['8.8.8.8', '1.1.1.1']);
  } catch {
    // Ignore DNS override errors in restricted environments
  }
}

const connectDB = async () => {
  try {
    if (!process.env.MONGODB_URI) {
      throw new Error('MongoDB connection string is missing in environment variables');
    }

    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000,
    });

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);

    // Fallback to in-memory MongoDB only when explicitly allowed via ALLOW_IN_MEMORY_DB=true
    if (process.env.ALLOW_IN_MEMORY_DB === 'true') {
      try {
        console.log('💡 Starting local In-Memory MongoDB fallback for development...');
        const { MongoMemoryServer } = require('mongodb-memory-server');
        const mongod = await MongoMemoryServer.create();
        const memUri = mongod.getUri();
        await mongoose.connect(memUri, {
          useNewUrlParser: true,
          useUnifiedTopology: true,
        });
        console.log('⚡ Connected to In-Memory MongoDB. Seeding demo data...');
        const { seedDemoData } = require('../scripts/seedDemo');
        await seedDemoData();
        console.log('✅ In-Memory Dev Environment Ready! Log in at http://localhost:5173 with:');
        console.log('   Email:    demo@minddiary.app');
        console.log('   Password: DemoSafe123!\n');
        return;
      } catch (fallbackErr) {
        console.error('❌ In-Memory MongoDB fallback failed:', fallbackErr.message);
      }
    }

    process.exit(1);
  }
};

module.exports = connectDB;
