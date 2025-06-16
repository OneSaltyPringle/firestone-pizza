const mongoose = require('mongoose');

const toppingSchema = new mongoose.Schema({
  name: String
});

module.exports = mongoose.model('Topping', toppingSchema);
