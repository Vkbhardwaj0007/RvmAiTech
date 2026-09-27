const mongoose = require('mongoose');
async function connectDB() {
  const uri = process.env.MONGO_URI;
  if (!uri) { console.error('MONGO_URI missing'); process.exit(1); }
  mongoose.set('strictQuery', true);
  try { const c = await mongoose.connect(uri); console.log(`MongoDB connected: ${c.connection.host}/${c.connection.name}`); }
  catch (e) { console.error('Mongo error:', e.message); process.exit(1); }
}
module.exports = connectDB;
