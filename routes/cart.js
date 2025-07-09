
const express = require('express');
const router = express.Router();
const Cart = require('../models/Cart');
const Crust = require('../models/Crust');
const Sauce = require('../models/Sauce');
const Cheese = require('../models/Cheese');
const MenuItem = require('../models/MenuItem');
const Order = require('../models/Order');

function ensureUser(req, res, next) {
  if (req.session && req.session.user) {
    return next();
  } else {
    return res.redirect('/login');
  }
}

router.get('/', ensureUser, async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.session.user._id }).populate('items.menuItem');

    const crusts = await Crust.find();
    const sauces = await Sauce.find();
    const cheeses = await Cheese.find();

    const crustMap = {};
    crusts.forEach(c => crustMap[c.image] = c.name);

    const sauceMap = {};
    sauces.forEach(s => sauceMap[s.image] = s.name);

    const cheeseMap = {};
    cheeses.forEach(ch => cheeseMap[ch.image] = ch.name);

    if (cart) {
      cart.items.forEach(i => {
        if (i.type === 'pizza' && i.customPizza) {
          i.customPizza.crust = crustMap[i.customPizza.crust] || i.customPizza.crust;
          i.customPizza.sauce = sauceMap[i.customPizza.sauce] || i.customPizza.sauce;
          i.customPizza.cheese = cheeseMap[i.customPizza.cheese] || i.customPizza.cheese;
        }
      });
    }

    res.render('cart', { cart });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
});

router.get('/checkout', ensureUser, async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.session.user._id }).populate('items.menuItem');

    const crusts = await Crust.find();
    const sauces = await Sauce.find();
    const cheeses = await Cheese.find();

    const crustMap = {};
    crusts.forEach(c => crustMap[c.image] = c.name);

    const sauceMap = {};
    sauces.forEach(s => sauceMap[s.image] = s.name);

    const cheeseMap = {};
    cheeses.forEach(ch => cheeseMap[ch.image] = ch.name);

    if (cart) {
      cart.items.forEach(i => {
        if (i.type === 'pizza' && i.customPizza) {
          i.customPizza.crust = crustMap[i.customPizza.crust] || i.customPizza.crust;
          i.customPizza.sauce = sauceMap[i.customPizza.sauce] || i.customPizza.sauce;
          i.customPizza.cheese = cheeseMap[i.customPizza.cheese] || i.customPizza.cheese;
        }
      });
    }

    res.render('checkout', { cart });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
});

router.post('/add', ensureUser, async (req, res) => {
  try {
    let cart = await Cart.findOne({ user: req.session.user._id });
    if (!cart) {
      cart = new Cart({ user: req.session.user._id, items: [] });
    }

    if (req.body.menuItemId) {
      const menuItem = await MenuItem.findById(req.body.menuItemId);
      if (menuItem) {
        cart.items.push({
          type: 'menuItem',
          menuItem: menuItem._id,
          quantity: 1
        });
      }
    }
    await cart.save();
    res.redirect('/cart');
  } catch (err) {
    console.error(err);
    res.status(500).send('Error adding to cart');
  }
});

router.post('/update/:itemId', ensureUser, async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.session.user._id });
    if (cart) {
      const item = cart.items.id(req.params.itemId);
      if (item) {
        item.quantity = Math.max(parseInt(req.body.quantity), 1);
        await cart.save();
      }
    }
    res.redirect('/cart');
  } catch (err) {
    console.error(err);
    res.status(500).send('Error updating quantity');
  }
});

router.post('/checkout/complete', ensureUser, async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.session.user._id }).populate('items.menuItem');
    if (!cart) {
      return res.redirect('/cart');
    }

    let total = 0;
    const orderItems = cart.items.map(i => {
      if (i.type === 'pizza' && i.customPizza) {
        total += i.customPizza.price * i.quantity;
        return {
          type: 'pizza',
          customPizza: i.customPizza,
          quantity: i.quantity
        };
      } else if (i.type === 'menuItem' && i.menuItem) {
        total += i.menuItem.price * i.quantity;
        return {
          type: 'menuItem',
          menuItem: i.menuItem._id,
          quantity: i.quantity
        };
      }
    });

    await Order.create({
      user: req.session.user._id,
      items: orderItems,
      total
    });

    await Cart.deleteOne({ user: req.session.user._id });
    res.redirect('/account');
  } catch (err) {
    console.error(err);
    res.status(500).send('Checkout error');
  }
});

router.post('/delete/:itemId', ensureUser, async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.session.user._id });
    if (cart) {
      cart.items = cart.items.filter(
        i => i._id.toString() !== req.params.itemId
      );
      await cart.save();
    }
    res.redirect('/cart');
  } catch (err) {
    console.error(err);
    res.status(500).send('Error deleting item');
  }
});

module.exports = router;
