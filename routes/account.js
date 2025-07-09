
const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const Crust = require('../models/Crust');
const Sauce = require('../models/Sauce');
const Cheese = require('../models/Cheese');
const MenuItem = require('../models/MenuItem');

function ensureUser(req, res, next) {
  if (req.session && req.session.user) {
    return next();
  } else {
    return res.redirect('/login');
  }
}

router.get('/', ensureUser, async (req, res) => {
  try {
    const orders = await Order.find({ user: req.session.user._id })
      .sort({ createdAt: -1 })
      .populate('items.menuItem');

    const crusts = await Crust.find();
    const sauces = await Sauce.find();
    const cheeses = await Cheese.find();

    const crustMap = {};
    crusts.forEach(c => crustMap[c.image] = c.name);

    const sauceMap = {};
    sauces.forEach(s => sauceMap[s.image] = s.name);

    const cheeseMap = {};
    cheeses.forEach(ch => cheeseMap[ch.image] = ch.name);

    orders.forEach(order => {
      order.items.forEach(i => {
        if (i.type === 'pizza' && i.customPizza) {
          i.customPizza.crust = crustMap[i.customPizza.crust] || i.customPizza.crust;
          i.customPizza.sauce = sauceMap[i.customPizza.sauce] || i.customPizza.sauce;
          i.customPizza.cheese = cheeseMap[i.customPizza.cheese] || i.customPizza.cheese;
        }
      });
    });

    res.render('account', { orders });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
