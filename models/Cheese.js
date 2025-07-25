const mongoose = require('mongoose');

const cheeseSchema = new mongoose.Schema({
  name: String,
  category: String,
  price: Number,
  image: String
});

module.exports = mongoose.model('Cheese', cheeseSchema);