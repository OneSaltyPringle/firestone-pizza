
const express = require('express');
const router = express.Router();
const Topping = require('../models/Topping');
const MenuItem = require('../models/MenuItem');

function ensureAdmin(req, res, next) {
  if (req.session && req.session.user && req.session.user.isAdmin) {
    next();
  } else {
    res.redirect('/login');
  }
}

router.get('/', ensureAdmin, async (req, res) => {
  const toppings = await Topping.find();
  const menuItems = await MenuItem.find();
  res.render('admin', { toppings, menuItems });
});

router.post('/menu/add', ensureAdmin, async (req, res) => {
  const { name, description, price, imageUrl, isPizza } = req.body;
  await MenuItem.create({ name, description, price, imageUrl, isPizza: isPizza === 'on' });
  res.redirect('/admin');
});

router.post('/menu/delete/:id', ensureAdmin, async (req, res) => {
  await MenuItem.findByIdAndDelete(req.params.id);
  res.redirect('/admin');
});

module.exports = router;



router.post('/topping', ensureAdmin, async (req, res) => {
  const { name, image, price, category } = req.body;
  await Topping.create({ name, image, price, category });
  res.redirect('/admin');
});

router.post('/menu/edit/:id', ensureAdmin, async (req, res) => {
  const { name, description, price, imageUrl, isPizza } = req.body;
  await MenuItem.findByIdAndUpdate(req.params.id, { name, description, price, imageUrl, isPizza: isPizza === 'on' });
  res.redirect('/admin');
});


router.post('/topping/edit/:id', ensureAdmin, async (req, res) => {
  const { name, image, price, category } = req.body;
  await Topping.findByIdAndUpdate(req.params.id, {
    name,
    image,
    price,
    category
  });
  res.redirect('/admin');
});
