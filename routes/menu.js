
const express = require('express');
const router = express.Router();
const MenuItem = require('../models/MenuItem');

router.get('/', async (req, res) => {
  try {
    const items = await MenuItem.find();
    res.render('menu', { items, title: 'Menu' });
  } catch (err) {
    console.error('Menu error:', err);
    res.status(500).send('Unable to load menu');
  }
});

module.exports = router;
