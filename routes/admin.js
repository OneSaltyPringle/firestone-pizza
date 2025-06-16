const express = require('express');
const router = express.Router();
const Topping = require('../models/Topping');

router.get('/', async (req, res) => {
  const toppings = await Topping.find();
  res.render('admin', { toppings });
});

router.post('/topping', async (req, res) => {
  await Topping.create({ name: req.body.topping });
  res.redirect('/admin');
});

module.exports = router;
