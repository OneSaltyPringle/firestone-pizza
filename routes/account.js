
const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const MenuItem = require('../models/MenuItem');

function ensureUser(req, res, next) {
  if (req.session && req.session.user) {
    return next();
  } else {
    return res.redirect('/login');
  }
}

router.get('/', ensureUser, async (req, res) => {
  const orders = await Order.find({ user: req.session.user._id }).sort({ createdAt: -1 }).populate('items.menuItem');
  res.render('account', { orders });
});

module.exports = router;
