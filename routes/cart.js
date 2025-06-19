const express = require('express');
const router = express.Router();
const Cart = require('../models/Cart');
const MenuItem = require('../models/MenuItem');
const Order = require('../models/Order');

function ensureUser(req, res, next) {
  if (req.session && req.session.user) return next();
  res.redirect('/login');
}

router.get('/', ensureUser, async (req, res) => {
  const cart = await Cart.findOne({ user: req.session.user._id }).populate('items.menuItem') || { items: [] };
  res.render('cart', { cart });
});

router.get('/checkout', ensureUser, async (req, res) => {
  const cart = await Cart.findOne({ user: req.session.user._id }).populate('items.menuItem') || { items: [] };
  res.render('checkout', { cart });
});

router.post('/add', ensureUser, async (req, res) => {
  const { type } = req.body;
  let cart = await Cart.findOne({ user: req.session.user._id });
  if (!cart) cart = new Cart({ user: req.session.user._id, items: [] });

  if (type === 'pizza') {
    const { size, crust, sauce, cheese } = req.body;
    let toppings = req.body.toppings;
    if (!Array.isArray(toppings)) toppings = toppings ? [toppings] : [];

    const customPizza = {
      size,
      crust,
      sauce,
      cheese,
      toppings,
      price: size === 'Small' ? 8.99 : size === 'Medium' ? 10.99 : 12.99,
      imageUrl: '/images/pizza-base.png'
    };
    cart.items.push({ type: 'pizza', customPizza, quantity: 1 });
  } else {
    const { menuItemId } = req.body;
    const item = await MenuItem.findById(menuItemId);
    if (!item) return res.redirect('/cart');
    cart.items.push({ type: 'menuItem', menuItem: item._id, quantity: 1 });
  }

  await cart.save();
  res.redirect('/cart');
});

router.post('/checkout/complete', ensureUser, async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.session.user._id }).populate('items.menuItem') || { items: [] };
    if (!cart || cart.items.length === 0) return res.redirect('/cart');

    const orderItems = cart.items.map(i => {
      if (i.type === 'pizza') {
        return {
          type: 'pizza',
          customPizza: i.customPizza,
          quantity: i.quantity
        };
      } else {
        return {
          type: 'menuItem',
          menuItem: i.menuItem._id,
          quantity: i.quantity,
          price: i.menuItem.price
        };
      }
    });

    const total = orderItems.reduce((sum, i) => {
      if (i.type === 'pizza') return sum + i.customPizza.price * i.quantity;
      if (i.type === 'menuItem') return sum + i.price * i.quantity;
      return sum;
    }, 0);

    const newOrder = new Order({
      user: req.session.user._id,
      items: orderItems,
      total,
      date: new Date()
    });

    await newOrder.save();
    await Cart.findOneAndDelete({ user: req.session.user._id });
    res.redirect('/account');
  } catch (err) {
    console.error(err);
    res.redirect('/cart');
  }
});

router.post('/delete/:itemId', ensureUser, async (req, res) => {
  const cart = await Cart.findOne({ user: req.session.user._id });
  if (cart) {
    cart.items.id(req.params.itemId)?.deleteOne();
    await cart.save();
  }
  res.redirect('/cart');
});

router.post('/update/:itemId', ensureUser, async (req, res) => {
  const { quantity } = req.body;
  const cart = await Cart.findOne({ user: req.session.user._id });
  if (cart) {
    const item = cart.items.id(req.params.itemId);
    if (item) {
      item.quantity = Math.max(1, parseInt(quantity));
      await cart.save();
    }
  }
  res.redirect('/cart');
});

module.exports = router;