const express = require('express');
const router = express.Router();
const Topping = require('../models/Topping');
const Crust = require('../models/Crust');
const Sauce = require('../models/Sauce');
const Cheese = require('../models/Cheese');
const MenuItem = require('../models/MenuItem');
const Cart = require('../models/Cart');
const mongoose = require('mongoose');

// Auth middleware
function ensureAuthenticated(req, res, next) {
  if (req.session && req.session.user) {
    return next();
  }
  return res.status(401).json({ redirect: '/login' });
}

router.get('/builder', async (req, res) => {
  try {
    const toppings = await Topping.find();
    const crusts = await Crust.find();
    const sauces = await Sauce.find();
    const cheeses = await Cheese.find();
    const presetPizzas = await MenuItem.find({ isPizza: true });

    res.render('pizza-builder', {
      toppings,
      crusts,
      sauces,
      cheeses,
      presetPizzas
    });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
});

// Protected POST route
router.post('/builder/add', ensureAuthenticated, async (req, res) => {
  try {
    const { size, crust, sauce, cheese, toppings } = req.body;
    const toppingsArray = JSON.parse(toppings || '[]');

    let basePrice = 0;
    let presetPizza = null;

    if (mongoose.Types.ObjectId.isValid(size)) {
      presetPizza = await MenuItem.findById(size);
      if (presetPizza) {
        basePrice = presetPizza.price;
      }
    } else {
      basePrice =
        size === 'Small' ? 8.99 :
        size === 'Medium' ? 10.99 :
        12.99;
    }

    const crustDoc = await Crust.findOne({ image: crust });
    const sauceDoc = await Sauce.findOne({ image: sauce });
    const cheeseDoc = await Cheese.findOne({ image: cheese });

    const crustPrice = crustDoc?.price || 0;
    const saucePrice = sauceDoc?.price || 0;
    const cheesePrice = cheeseDoc?.price || 0;

    let toppingsPrice = 0;
    if (toppingsArray.length > 0) {
      const toppingDocs = await Topping.find({
        name: { $in: toppingsArray.map(t => t.name) }
      });

      toppingsPrice = toppingDocs.reduce(
        (sum, t) => sum + (t.price || 0),
        0
      );
    }

    const totalPrice = basePrice + crustPrice + saucePrice + cheesePrice + toppingsPrice;

    const customPizza = {
      size: presetPizza?.name || size,
      crust,
      sauce,
      cheese,
      toppings: toppingsArray,
      price: totalPrice,
      imageUrl: '/images/pizza-base.png'
    };

    let cart = await Cart.findOne({ user: req.session.user._id });
    if (!cart) {
      cart = new Cart({
        user: req.session.user._id,
        items: []
      });
    }

    // Check if a matching pizza already exists
    const existing = cart.items.find(i => {
      if (i.type !== 'pizza' || !i.customPizza) return false;

      const a = i.customPizza;
      const b = customPizza;

      const toppingsEqual =
        (a.toppings?.length || 0) === (b.toppings?.length || 0) &&
        a.toppings.every(at =>
          b.toppings.some(bt => bt.name === at.name && bt.region === at.region)
        );

      return (
        a.size === b.size &&
        a.crust === b.crust &&
        a.sauce === b.sauce &&
        a.cheese === b.cheese &&
        toppingsEqual
      );
    });

    if (existing) {
      existing.quantity += 1;
    } else {
      cart.items.push({
        type: 'pizza',
        customPizza,
        quantity: 1
      });
    }

    await cart.save();

    res.json({
      success: true,
      message: 'Pizza added to cart',
      redirect: '/cart'
    });

  } catch (err) {
    console.error('Error saving pizza to cart:', err);
    res.status(500).json({ error: 'Server error adding pizza to cart' });
  }
});

module.exports = router;
