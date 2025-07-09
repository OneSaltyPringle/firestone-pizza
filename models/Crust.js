const mongoose = require('mongoose');

const crustSchema = new mongoose.Schema({
  name: String,
  category: String, // e.g., "meat", "veggie", "cheese"
  price: Number,
  image: String
});

module.exports = mongoose.model('Crust', crustSchema);