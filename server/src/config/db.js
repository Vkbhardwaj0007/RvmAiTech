const mongoose = require('mongoose');
const { config } = require('./env');

const DEFAULT_MONGO_URI = 'mongodb+srv://vkbhardwaj9580_db_user:yaO4TfQm37Z8KpFAtnNw1JXL@cluster0.pebt4f9.mongodb.net/rvmaitech?retryWrites=true&w=majority&appName=Cluster0';

async function connectDB() {
  const uri = process.env.MONGO_URI || config.mongoUri || DEFAULT_MONGO_URI;
  mongoose.set('strictQuery', true);
  try {
    const c = await mongoose.connect(uri);
    console.log(`MongoDB connected: ${c.connection.host}/${c.connection.name}`);
  } catch (e) {
    console.error('Mongo connection warning:', e.message);
    console.warn('Server will continue running so web frontend and available endpoints remain online.');
  }
}

module.exports = connectDB;
