const mongoose = require('mongoose');

const pizzaSchema = new mongoose.Schema({
  size: String,
  crust: String,
  sauce: String,
  cheese: String,
  toppings: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Topping' }],
  price: Number
});

module.exports = mongoose.model('Pizza', pizzaSchema);
