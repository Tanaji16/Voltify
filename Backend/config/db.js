// ============================================================
//  Voltify — MongoDB Connection
//  config/db.js
// ============================================================

const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      // Mongoose 7+ has these defaults built-in, but explicit is good practice
      serverSelectionTimeoutMS: 5000,
    });

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`❌ MongoDB Connection Error: ${error.message}`);
    // Exit process with failure so the container/PM2 can restart it
    process.exit(1);
  }
};

module.exports = connectDB;
