const express = require('express');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const axios = require('axios');
const User = require('../models/User');
const getTransporter = require('../utils/mailer');
const router = express.Router();

router.get('/', (req, res) => res.render('home'));

router.get('/login', (req, res) => {
  res.render('login', { message: null, username: '' });
});

router.get('/register', (req, res) => {
  res.render('register', {
    message: null,
    username: '',
    email: ''
  });
});

router.get('/forgot', (req, res) => {
  res.render('forgot-password', { message: null });
});

router.get('/reset/:token', async (req, res) => {
  const user = await User.findOne({
    resetPasswordToken: req.params.token,
    resetPasswordExpires: { $gt: Date.now() },
  });

  if (!user) {
    return res.render('forgot-password', {
      message: 'Password reset token is invalid or has expired.',
    });
  }

  res.render('reset-password', { token: req.params.token, message: null });
});

router.post('/register', async (req, res) => {
  const recaptchaResponse = req.body['g-recaptcha-response'];

  if (!recaptchaResponse) {
    return res.render('register', {
      message: 'Please complete the reCAPTCHA.',
      username: req.body.username || '',
      email: req.body.email || ''
    });
  }

  const secret = process.env.RECAPTCHA_SECRET;
  const verifyUrl = `https://www.google.com/recaptcha/api/siteverify?secret=${secret}&response=${recaptchaResponse}`;

  try {
    const response = await axios.post(verifyUrl);
    if (!response.data.success) {
      return res.render('register', {
        message: 'reCAPTCHA verification failed. Try again.',
        username: req.body.username || '',
        email: req.body.email || ''
      });
    }
  } catch (error) {
    console.error(error);
    return res.render('register', {
      message: 'Error verifying reCAPTCHA. Please try again.',
      username: req.body.username || '',
      email: req.body.email || ''
    });
  }

  const existingUser = await User.findOne({
    $or: [
      { username: req.body.username },
      { email: req.body.email }
    ]
  });

  if (existingUser) {
    return res.render('register', {
      message: 'An account with that username or email already exists. <a href="/forgot">Reset password here.</a>',
      username: req.body.username,
      email: req.body.email
    });
  }

  const hashed = await bcrypt.hash(req.body.password, 10);
  await User.create({
    username: req.body.username,
    email: req.body.email,
    password: hashed,
  });

  res.redirect('/login');
});

router.post('/reset/:token', async (req, res) => {
  const user = await User.findOne({
    resetPasswordToken: req.params.token,
    resetPasswordExpires: { $gt: Date.now() },
  });

  if (!user) {
    return res.render('forgot-password', {
      message: 'Password reset token is invalid or has expired.',
    });
  }

  const hashed = await bcrypt.hash(req.body.password, 10);
  user.password = hashed;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpires = undefined;

  await user.save();

  res.redirect('/login');
});

router.post('/forgot', async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email });

  if (!user) {
    return res.render('forgot-password', {
      message: 'No account found with that email.',
    });
  }

  const token = crypto.randomBytes(20).toString('hex');

  user.resetPasswordToken = token;
  user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
  await user.save();

  const transporter = getTransporter();

  const resetURL = `http://${req.headers.host}/reset/${token}`;

  const mailOptions = {
    to: user.email,
    from: process.env.EMAIL_USER,
    subject: 'Firestone Pizza - Password Reset',
    text: `You requested a password reset. Click the link below:\n\n${resetURL}\n\nIf you did not request this, ignore this email.`,
  };

  transporter.sendMail(mailOptions, (err) => {
    if (err) {
      console.error(err);
      return res.render('forgot-password', {
        message: 'Error sending email. Try again later.',
      });
    }
    res.render('forgot-password', {
      message: 'An email has been sent with further instructions.',
    });
  });
});

// Login POST logic with errors:
router.post('/login', async (req, res) => {
  const user = await User.findOne({ username: req.body.username });
  if (user && await bcrypt.compare(req.body.password, user.password)) {
    req.session.user = user;
    res.redirect('/');
  } else {
    res.render('login', {
      message: 'Invalid username or password.',
      username: req.body.username
    });
  }
});

router.get('/logout', (req, res) => {
  req.session.destroy(() => res.redirect('/'));
});

module.exports = router;
