const mongoose = require('mongoose');

const pizzaSchema = new mongoose.Schema({
  size: String,
  toppings: [String],
  price: Number
});

module.exports = mongoose.model('Pizza', pizzaSchema);
