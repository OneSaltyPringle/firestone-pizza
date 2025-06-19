
const mongoose = require('mongoose');

const cartSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  items: [
    {
      type: { type: String, enum: ['menuItem', 'pizza'], required: true },
      menuItem: { type: mongoose.Schema.Types.ObjectId, ref: 'MenuItem' },
      customPizza: {
        size: String,
        crust: String,
        sauce: String,
        cheese: String,
        toppings: [mongoose.Schema.Types.Mixed],
        price: Number,
        imageUrl: String
      },
      quantity: { type: Number, default: 1 }
    }
  ]
});

module.exports = mongoose.model('Cart', cartSchema);
