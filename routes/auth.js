const express = require('express');
const bcrypt = require('bcrypt');
const User = require('../models/User');
const router = express.Router();

router.get('/', (req, res) => res.render('home'));
router.get('/login', (req, res) => res.render('login'));
router.get('/register', (req, res) => res.render('register'));

router.post('/register', async (req, res) => {
  const hashed = await bcrypt.hash(req.body.password, 10);
  await User.create({ username: req.body.username, password: hashed });
  res.redirect('/login');
});

router.post('/login', async (req, res) => {
  const user = await User.findOne({ username: req.body.username });
  if (user && await bcrypt.compare(req.body.password, user.password)) {
    req.session.user = user;
    res.redirect('/');
  } else {
    res.send('Login failed');
  }
});

router.get('/logout', (req, res) => {
  req.session.destroy(() => res.redirect('/'));
});

module.exports = router;
