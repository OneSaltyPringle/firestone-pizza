const express = require('express');
const router = express.Router();
const Topping = require('../models/Topping');
const Order = require('../models/Order');
const User = require('../models/User');

router.get('/builder', async (req, res) => {
  const toppings = (await Topping.find()).map(t => t.name);
  res.render('pizza-builder', { toppings, title: 'Pizza Builder' });
});

router.post('/order', async (req, res) => {
  const { size = 'Medium', crust = 'Regular', sauce = 'Tomato', cheese = 'Mozzarella', toppings } = req.body;
  const toppingList = JSON.parse(toppings || '[]');
  const total = 12 + toppingList.length * 1.5;
  req.session.pendingOrder = { size, crust, sauce, cheese, toppings: toppingList, total };
  res.render('payment', { total, title: 'Payment' });
});

router.post('/complete', async (req, res) => {
  const order = req.session.pendingOrder;
  if (!order || !req.session.user) return res.redirect('/pizza/builder');

  await Order.create({
    userId: req.session.user._id,
    pizzas: [{
      size: order.size,
      crust: order.crust,
      sauce: order.sauce,
      cheese: order.cheese,
      toppings: Array.isArray(order.toppings) ? order.toppings : [{ name: order.toppings, region: 'center' }]
    }],
    total: order.total
  });

  const user = await User.findById(req.session.user._id);
  user.rewardsPoints += Math.floor(order.total / 10);
  await user.save();
  req.session.user = user;

  delete req.session.pendingOrder;
  res.redirect('/account');
});

module.exports = router;
