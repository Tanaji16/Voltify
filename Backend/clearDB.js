const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

const clearDB = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/voltify';
    console.log(`Connecting to database at: ${mongoUri}`);
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB.');

    // Drop the entire database
    await mongoose.connection.db.dropDatabase();
    console.log('✅ Database "voltify" cleared successfully.');
    
    process.exit(0);
  } catch (err) {
    console.error('❌ Failed to clear database:', err);
    process.exit(1);
  }
};

clearDB();
