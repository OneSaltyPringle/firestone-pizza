const mongoose = require('mongoose');

const toppingSchema = new mongoose.Schema({
  name: String,
  category: String, // e.g., "meat", "veggie", "cheese"
  price: Number,
  image: String
});

module.exports = mongoose.model('Topping', toppingSchema);
