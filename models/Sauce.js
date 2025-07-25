const mongoose = require('mongoose');

const sauceSchema = new mongoose.Schema({
  name: String,
  category: String,
  price: Number,
  image: String
});

module.exports = mongoose.model('Sauce', sauceSchema);