const express = require('express');
const router = express.Router();
const Cart = require('../models/Cart');
const Crust = require('../models/Crust');
const Sauce = require('../models/Sauce');
const Cheese = require('../models/Cheese');
const MenuItem = require('../models/MenuItem');
const Order = require('../models/Order');
const User = require('../models/User');
const Topping = require('../models/Topping');

function ensureUser(req, res, next) {
  if (req.session && req.session.user) {
    return next();
  } else {
    return res.redirect('/login');
  }
}

async function calculateCartPrices(cart) {
  let total = 0;

  if (!cart) return { total: 0 };

  for (const item of cart.items) {
    if (item.type === 'menuItem') {
      const dbItem = await MenuItem.findById(item.menuItem);
      if (dbItem) {
        item.calculatedPrice = dbItem.price;
        item.calculatedSubtotal = dbItem.price * item.quantity;
        total += item.calculatedSubtotal;
      } else {
        item.calculatedPrice = 0;
        item.calculatedSubtotal = 0;
      }
    } else if (item.type === 'pizza' && item.customPizza) {
      let basePrice = 0;
      const size = item.customPizza.size;

      const preset = await MenuItem.findOne({ name: size, isPizza: true });
      if (preset) {
        basePrice = preset.price;
      } else {
        basePrice =
          size === 'Small' ? 8.99 :
          size === 'Medium' ? 10.99 :
          12.99;
      }

      const crustDoc = await Crust.findOne({ image: item.customPizza.crust });
      const sauceDoc = await Sauce.findOne({ image: item.customPizza.sauce });
      const cheeseDoc = await Cheese.findOne({ image: item.customPizza.cheese });

      const crustPrice = crustDoc?.price || 0;
      const saucePrice = sauceDoc?.price || 0;
      const cheesePrice = cheeseDoc?.price || 0;

      let toppingsPrice = 0;
      if (item.customPizza.toppings && item.customPizza.toppings.length > 0) {
        const toppingDocs = await Topping.find({
          name: { $in: item.customPizza.toppings.map(t => t.name) }
        });
        toppingsPrice = toppingDocs.reduce(
          (sum, t) => sum + (t.price || 0),
          0
        );
      }

      const totalPrice = basePrice + crustPrice + saucePrice + cheesePrice + toppingsPrice;
      item.customPizza.price = totalPrice;
      item.calculatedPrice = totalPrice;
      item.calculatedSubtotal = totalPrice * item.quantity;
      total += item.calculatedSubtotal;
    }
  }

  return { total };
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

    const { total } = await calculateCartPrices(cart);

    const message = req.session.message || null;
    delete req.session.message;
    const danger = req.session.danger || null;
    delete req.session.danger;

    res.render('cart', { cart, total, message, danger });
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

    const { total } = await calculateCartPrices(cart);

    res.render('checkout', { cart, total });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
});

// Cart add with check if a matching item already exists
router.post('/add', ensureUser, async (req, res) => {
  try {
    let cart = await Cart.findOne({ user: req.session.user._id });
    if (!cart) {
      cart = new Cart({ user: req.session.user._id, items: [] });
    }

    if (req.body.menuItemId) {
      const menuItem = await MenuItem.findById(req.body.menuItemId);
      if (menuItem) {
        const existing = cart.items.find(
          i => i.type === 'menuItem' && i.menuItem.toString() === menuItem._id.toString()
        );

        if (existing) {
          existing.quantity += 1;
        } else {
          cart.items.push({
            type: 'menuItem',
            menuItem: menuItem._id,
            quantity: 1
          });
        }
      }
    }

    if (req.body.customPizza) {
      const customPizzaData = JSON.parse(req.body.customPizza);

      const existing = cart.items.find(i => {
        if (i.type !== 'pizza' || !i.customPizza) return false;

        const a = i.customPizza;
        const b = customPizzaData;

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
          customPizza: customPizzaData,
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
    req.session.message = 'Quantity updated!';
    res.redirect('/cart');
  } catch (err) {
    console.error(err);
    res.status(500).send('Error updating quantity');
  }
});

router.post('/checkout/complete', ensureUser, async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.session.user._id }).populate('items.menuItem');
    if (!cart) return res.redirect('/cart');

    const { total } = await calculateCartPrices(cart);

    const orderItems = cart.items.map(i => {
      if (i.type === 'pizza' && i.customPizza) {
        return {
          type: 'pizza',
          customPizza: i.customPizza,
          quantity: i.quantity
        };
      } else if (i.type === 'menuItem' && i.menuItem) {
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

    const pointsEarned = Math.floor(total / 10);
    if (pointsEarned > 0) {
      const user = await User.findById(req.session.user._id);
      if (user) {
        user.rewardsPoints += pointsEarned;
        await user.save();
        req.session.user = user;
      }
    }

    await Cart.deleteOne({ user: req.session.user._id });
    req.session.message = 'Order placed successfully!';
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
    req.session.danger = 'Item deleted!';
    res.redirect('/cart');
  } catch (err) {
    console.error(err);
    res.status(500).send('Error deleting item');
  }
});

router.post('/clear', ensureUser, async (req, res) => {
  try {
    await Cart.deleteOne({ user: req.session.user._id });
    req.session.danger = 'Cart cleared!';
    res.redirect('/cart');
  } catch (err) {
    console.error(err);
    res.status(500).send('Error clearing cart');
  }
});

module.exports = router;
