const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Order = require('../models/Order');

router.get('/', async (req, res) => {
  if (!req.session.user) return res.redirect('/login');
  const orders = await Order.find({ userId: req.session.user._id });
  res.render('account', {
    title: 'My Account',
    user: req.session.user,
    orders
  });
});

module.exports = router;
