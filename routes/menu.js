const express = require('express');
const router = express.Router();
const MenuItem = require('../models/MenuItem');
const MenuCategory = require('../models/MenuCategory');

router.get('/', async (req, res) => {
  try {
    const categories = await MenuCategory.find();
    let items = await MenuItem.find();

    const sortOption = req.query.sort || 'name_asc';
    const activeTab = req.query.tab || '';

    // Sort items server-side
    switch (sortOption) {
      case 'name_asc':
        items.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'name_desc':
        items.sort((a, b) => b.name.localeCompare(a.name));
        break;
      case 'price_asc':
        items.sort((a, b) => (a.price || 0) - (b.price || 0));
        break;
      case 'price_desc':
        items.sort((a, b) => (b.price || 0) - (a.price || 0));
        break;
      default:
        items.sort((a, b) => a.name.localeCompare(b.name));
    }

    // Find uncategorized items
    const uncategorizedItems = items.filter(item => {
      return !item.category ||
             !categories.some(c => {
               return c._id?.toString() === item.category?.toString();
             });
    });

    res.render('menu', {
      items,
      categories,
      uncategorizedItems,
      sortOption,
      activeTab,
      title: 'Menu'
    });

  } catch (err) {
    console.error('Menu error:', err);
    res.status(500).send('Unable to load menu');
  }
});

module.exports = router;
