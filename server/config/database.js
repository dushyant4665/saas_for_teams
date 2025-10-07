const mongoose = require('mongoose');

let isConnected = false;

const connectDB = async () => {
  try {
    if (isConnected) return;
    
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/teampulse';
    
    const conn = await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });

    isConnected = true;
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    isConnected = false;
    console.error('❌ MongoDB connection error:', error.message);
    console.log('⚠️ Running without database...');
  }
};

const checkConnection = () => {
  return mongoose.connection.readyState === 1;
};

module.exports = { connectDB, checkConnection };
