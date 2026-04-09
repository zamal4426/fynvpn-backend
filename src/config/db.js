const mongoose = require('mongoose');
const env = require('./env');

async function connectDB() {
  const conn = await mongoose.connect(env.mongoUri);
  console.log(`MongoDB connected: ${conn.connection.host}`);
  return conn;
}

module.exports = { connectDB };
