const express = require('express');
const router = express.Router();
const Topping = require('../models/Topping');
const MenuItem = require('../models/MenuItem');
const MenuCategory = require('../models/MenuCategory');
const Crust = require('../models/Crust');
const Sauce = require('../models/Sauce');
const Cheese = require('../models/Cheese');

// Page Security
function ensureAdmin(req, res, next) {
  if (req.session && req.session.user && req.session.user.isAdmin) {
    next();
  } else {
    res.redirect('/login');
  }
}

// Admin dashboard
router.get('/', ensureAdmin, async (req, res) => {
  try {
    const [toppings, menuItems, categories, crusts, sauces, cheeses] = await Promise.all([
      Topping.find(),
      MenuItem.find().populate('category'),
      MenuCategory.find(),
      Crust.find(),
      Sauce.find(),
      Cheese.find()
    ]);

    res.render('admin', { toppings, menuItems, categories, crusts, sauces, cheeses });
  } catch (err) {
    console.error(err);
    res.status(500).send("Error loading admin panel");
  }
});

router.post('/menu/add', ensureAdmin, async (req, res) => {
  const { name, description, price, imageUrl, isPizza, category } = req.body;
  await MenuItem.create({ name, description, price, imageUrl, isPizza: isPizza === 'on', category });
  res.redirect('/admin');
});

router.post('/menu/delete/:id', ensureAdmin, async (req, res) => {
  await MenuItem.findByIdAndDelete(req.params.id);
  res.redirect('/admin');
});

router.post('/category/add', ensureAdmin, async (req, res) => {
  const { name, description } = req.body;
  await MenuCategory.create({ name, description });
  res.redirect('/admin')
});

router.post('/category/delete/:id', ensureAdmin, async (req, res) => {
  await MenuCategory.findByIdAndDelete(req.params.id);
  res.redirect('/admin')
});

router.post('/crust', ensureAdmin, async (req, res) => {
  await Crust.create({ name: req.body.name, image: req.body.image, price: parseFloat(req.body.price) || 0, category: req.body.category });
  res.redirect('/admin');
});

router.post('/sauce', ensureAdmin, async (req, res) => {
  await Sauce.create({ name: req.body.name, image: req.body.image, price: parseFloat(req.body.price) || 0, category: req.body.category });
  res.redirect('/admin');
});

router.post('/cheese', ensureAdmin, async (req, res) => {
  await Cheese.create({ name: req.body.name, image: req.body.image, price: parseFloat(req.body.price) || 0, category: req.body.category });
  res.redirect('/admin');
});

module.exports = router;

router.post('/topping', ensureAdmin, async (req, res) => {
  const { name, image, price, category } = req.body;
  await Topping.create({ name, image, price, category });
  res.redirect('/admin');
});

router.post('/menu/edit/:id', ensureAdmin, async (req, res) => {
  const { name, description, price, imageUrl, category, isPizza } = req.body;
  await MenuItem.findByIdAndUpdate(req.params.id, { name, description, price, imageUrl, category, isPizza: isPizza === 'on' });
  res.redirect('/admin');
});

router.post('/category/update/:id', ensureAdmin, async (req, res) => {
  const { name, description } = req.body;
  await MenuCategory.findByIdAndUpdate(req.params.id, { name, description });
  res.redirect('/admin')
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

router.post('/crust/delete/:id', ensureAdmin, async (req, res) => {
  await Crust.findByIdAndDelete(req.params.id);
  res.redirect('/admin');
});

router.post('/sauce/delete/:id', ensureAdmin, async (req, res) => {
  await Sauce.findByIdAndDelete(req.params.id);
  res.redirect('/admin');
});

router.post('/cheese/delete/:id', ensureAdmin, async (req, res) => {
  await Cheese.findByIdAndDelete(req.params.id);
  res.redirect('/admin');
});

router.post('/crust/update/:id', ensureAdmin, async (req, res) => {
  await Crust.findByIdAndUpdate(req.params.id, { name: req.body.name, image: req.body.image, price: parseFloat(req.body.price) || 0, category: req.body.category });
  res.redirect('/admin');
});

router.post('/sauce/update/:id', ensureAdmin, async (req, res) => {
  await Sauce.findByIdAndUpdate(req.params.id, { name: req.body.name, image: req.body.image, price: parseFloat(req.body.price) || 0, category: req.body.category });
  res.redirect('/admin');
});

router.post('/cheese/update/:id', ensureAdmin, async (req, res) => {
  await Cheese.findByIdAndUpdate(req.params.id, { name: req.body.name, image: req.body.image, price: parseFloat(req.body.price) || 0, category: req.body.category });
  res.redirect('/admin');
});
