const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
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
        toppings: [{ name: String, region: String }],
        price: Number,
        imageUrl: String
      },
      quantity: { type: Number, default: 1 }
    }
  ],
  total: Number,
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Order', orderSchema);
