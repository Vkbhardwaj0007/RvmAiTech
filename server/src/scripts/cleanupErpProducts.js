const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') });
const mongoose = require('mongoose');
const Product = require('../models/Product');

async function run() {
  const uri = process.env.MONGO_URI || process.env.MONGODB_URI;
  await mongoose.connect(uri);
  const r = await Product.deleteMany({ category: { $in: ['School ERP', 'Hotel ERP'] } });
  console.log('Removed from products collection:', r.deletedCount);
  await mongoose.disconnect();
}

run().catch(console.error);
