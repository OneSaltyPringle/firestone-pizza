
const express = require('express');
const router = express.Router();
const Topping = require('../models/Topping');
const MenuItem = require('../models/MenuItem');

// GET builder page
router.get('/builder', async (req, res) => {
  const toppings = await Topping.find();
  const presetPizzas = await MenuItem.find({ isPizza: true });
  res.render('pizza-builder', { toppings, presetPizzas, title: 'Pizza Builder' });
});

// POST pizza from builder to cart
router.post('/builder/add', async (req, res) => {
  const { size, crust, sauce, cheese, toppings } = req.body;
  const user = req.session.user;
  if (!user) return res.redirect('/login');

  
  const toppingList = JSON.parse(toppings || '[]');

  // Lookup topping prices
  const toppingDocs = await Topping.find({ name: { $in: toppingList.map(t => t.name) } });
  const toppingTotal = toppingDocs.reduce((sum, t) => sum + (t.price || 0), 0);

  let price = 0;
  const menuMatch = await MenuItem.findOne({ name: size, isPizza: true });
  if (menuMatch) {
    price = menuMatch.price + toppingTotal;
  } else {
    price = (size === 'Small' ? 8.99 : size === 'Medium' ? 10.99 : 12.99) + toppingTotal;
  }


  const pizzaData = {
    size,
    crust,
    sauce,
    cheese,
    toppings: toppingList,
    price,
    imageUrl: '/images/pizza-base.png'
  };

  const Cart = require('../models/Cart');
  let cart = await Cart.findOne({ user: user._id });
  if (!cart) {
    cart = new Cart({ user: user._id, items: [] });
  }

  cart.items.push({
    type: 'pizza',
    customPizza: pizzaData,
    quantity: 1
  });

  await cart.save();
  res.redirect('/cart');
});

module.exports = router;
