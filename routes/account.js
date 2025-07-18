const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const getTransporter = require('../utils/mailer');
const Order = require('../models/Order');
const Crust = require('../models/Crust');
const Sauce = require('../models/Sauce');
const Cheese = require('../models/Cheese');
const MenuItem = require('../models/MenuItem');
const Cart = require('../models/Cart');
const User = require('../models/User');

function ensureUser(req, res, next) {
  if (req.session && req.session.user) {
    return next();
  } else {
    return res.redirect('/login');
  }
}

router.get('/', ensureUser, async (req, res) => {
  try {
    const orders = await Order.find({ user: req.session.user._id })
      .sort({ createdAt: -1 })
      .populate('items.menuItem');

    const crusts = await Crust.find();
    const sauces = await Sauce.find();
    const cheeses = await Cheese.find();

    const crustMap = {};
    crusts.forEach(c => crustMap[c.image] = c.name);

    const sauceMap = {};
    sauces.forEach(s => sauceMap[s.image] = s.name);

    const cheeseMap = {};
    cheeses.forEach(ch => cheeseMap[ch.image] = ch.name);

    orders.forEach(order => {
      order.items.forEach(i => {
        if (i.type === 'pizza' && i.customPizza) {
          i.customPizza.crust = crustMap[i.customPizza.crust] || i.customPizza.crust;
          i.customPizza.sauce = sauceMap[i.customPizza.sauce] || i.customPizza.sauce;
          i.customPizza.cheese = cheeseMap[i.customPizza.cheese] || i.customPizza.cheese;
        }
      });
    });

    const message = req.session.message || null;
    delete req.session.message;

    const error = req.session.error || null;
    delete req.session.error;

    res.render('account', {
      orders,
      message,
      error
    });

  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
});

//Reorder logic with cart existing item check
//TODO Move item check to its own utils script to be called in account/pizza/cart routes
router.post('/reorder/:id', ensureUser, async (req, res) => {
  try {
    const orderId = req.params.id;
    const order = await Order.findById(orderId).populate('items.menuItem');
    if (!order) {
      req.session.error = 'Order not found.';
      return res.redirect('/account');
    }

    let cart = await Cart.findOne({ user: req.session.user._id });
    if (!cart) {
      cart = new Cart({ user: req.session.user._id, items: [] });
    }

    for (let item of order.items) {
      if (item.type === 'menuItem' && item.menuItem) {
        const existing = cart.items.find(
          i => i.type === 'menuItem' && i.menuItem.toString() === item.menuItem._id.toString()
        );

        if (existing) {
          existing.quantity += item.quantity;
        } else {
          cart.items.push({
            type: 'menuItem',
            menuItem: item.menuItem._id,
            quantity: item.quantity
          });
        }
      } else if (item.type === 'pizza' && item.customPizza) {
        const existing = cart.items.find(i => {
          if (i.type !== 'pizza' || !i.customPizza) return false;

          const a = i.customPizza;
          const b = item.customPizza;

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
          existing.quantity += item.quantity;
        } else {
          cart.items.push({
            type: 'pizza',
            customPizza: item.customPizza,
            quantity: item.quantity
          });
        }
      }
    }

    await cart.save();

    req.session.message = 'Items added to your cart.';
    res.redirect('/cart');
  } catch (error) {
    console.error(error);
    req.session.error = 'Something went wrong while reordering.';
    res.redirect('/account');
  }
});

// Manage Account routes
router.post('/update-email', ensureUser, async (req, res) => {
  try {
    const newEmail = req.body.email;
    if (!newEmail) {
      req.session.error = "Please enter a valid email.";
      return res.redirect('/account');
    }

    const existingUser = await User.findOne({ email: newEmail });
    if (existingUser) {
      req.session.error = "That email is already in use.";
      return res.redirect('/account');
    }

    const token = crypto.randomBytes(20).toString('hex');
    const user = await User.findById(req.session.user._id);

    user.pendingNewEmail = newEmail;
    user.emailChangeToken = token;
    user.emailChangeExpires = Date.now() + 3600000;
    await user.save();

    const confirmURL = `http://${req.headers.host}/account/confirm-email/${token}`;

    const mailOptions = {
      to: user.email,
      from: process.env.EMAIL_USER,
      subject: 'Confirm Your Email Change - Firestone Pizza',
      text: `You requested to change your email to ${newEmail}.\n\nClick the link below to confirm:\n\n${confirmURL}\n\nIf you did not request this, please ignore this email.`,
    };

    const transporter = getTransporter();

    transporter.sendMail(mailOptions, (err) => {
      if (err) {
        console.error(err);
        req.session.error = "Could not send confirmation email. Please try again.";
        return res.redirect('/account');
      }

      req.session.message = "Confirmation email sent to your current address.";
      return res.redirect('/account');
    });

  } catch (err) {
    console.error(err);
    req.session.error = "An error occurred while updating your email.";
    res.redirect('/account');
  }
});

router.get('/confirm-email/:token', async (req, res) => {
  try {
    const user = await User.findOne({
      emailChangeToken: req.params.token,
      emailChangeExpires: { $gt: Date.now() }
    });

    if (!user) {
      req.session.error = "Email change token is invalid or expired.";
      return res.redirect('/account');
    }

    if (!user.pendingNewEmail) {
      req.session.error = "No pending email change found.";
      return res.redirect('/account');
    }

    const oldEmail = user.email;
    user.email = user.pendingNewEmail;
    user.pendingNewEmail = undefined;
    user.emailChangeToken = undefined;
    user.emailChangeExpires = undefined;
    await user.save();

    req.session.user.email = user.email;

    const transporter = getTransporter();

    transporter.sendMail({
      to: oldEmail,
      from: process.env.EMAIL_USER,
      subject: 'Your Firestone Pizza Email Was Changed',
      text: `Your Firestone Pizza email has been changed from ${oldEmail} to ${user.email}. If this wasn't you, contact support immediately.`,
    });

    transporter.sendMail({
      to: user.email,
      from: process.env.EMAIL_USER,
      subject: 'Your New Firestone Pizza Email is Active',
      text: `Your new email ${user.email} is now active on your Firestone Pizza account.`,
    });

    req.session.message = "Your email has been updated successfully!";
    res.redirect('/account');
  } catch (err) {
    console.error(err);
    req.session.error = "An error occurred while confirming your email change.";
    res.redirect('/account');
  }
});

router.post('/change-password', ensureUser, async (req, res) => {
  try {
    const newPassword = req.body.password;
    if (!newPassword) {
      req.session.error = "Please enter a valid password.";
      return res.redirect('/account');
    }

    const hashed = await bcrypt.hash(newPassword, 10);
    await User.findByIdAndUpdate(req.session.user._id, { password: hashed });

    const transporter = getTransporter();

    transporter.sendMail({
      to: req.session.user.email,
      from: process.env.EMAIL_USER,
      subject: 'Your Firestone Pizza Password Was Changed',
      text: `This is a confirmation that your Firestone Pizza password was changed. If you did not request this, please contact us immediately.`,
    });

    req.session.message = "Password updated successfully.";
    res.redirect('/account');
  } catch (err) {
    console.error(err);
    req.session.error = "An error occurred while changing your password.";
    res.redirect('/account');
  }
});

// Request account deletion (send email with token)
router.post('/delete', ensureUser, async (req, res) => {
  try {
    const token = crypto.randomBytes(20).toString('hex');

    const user = await User.findById(req.session.user._id);
    user.deleteAccountToken = token;
    user.deleteAccountExpires = Date.now() + 3600000;
    await user.save();

    const confirmURL = `http://${req.headers.host}/account/confirm-delete/${token}`;

    const transporter = getTransporter();

    transporter.sendMail({
      to: user.email,
      from: process.env.EMAIL_USER,
      subject: 'Confirm Account Deletion - Firestone Pizza',
      text: `You requested to delete your Firestone Pizza account.\n\nClick this link to confirm deletion:\n\n${confirmURL}\n\nIf you did not request this, please ignore this email.`,
    });

    req.session.message = "A confirmation email has been sent. Click the link there to finalize deletion.";
    res.redirect('/account');
  } catch (err) {
    console.error(err);
    req.session.error = "An error occurred while preparing account deletion.";
    res.redirect('/account');
  }
});

// Confirm account deletion
router.get('/confirm-delete/:token', async (req, res) => {
  try {
    const user = await User.findOne({
      deleteAccountToken: req.params.token,
      deleteAccountExpires: { $gt: Date.now() }
    });

    if (!user) {
      req.session.error = "Account deletion token is invalid or has expired.";
      return res.redirect('/account');
    }

    const userEmail = user.email;

    await User.findByIdAndDelete(user._id);

    const transporter = getTransporter();

    transporter.sendMail({
      to: userEmail,
      from: process.env.EMAIL_USER,
      subject: 'Your Firestone Pizza Account Was Deleted',
      text: `Your Firestone Pizza account has been deleted. If you did not request this, please contact us immediately.`,
    });

    req.session.destroy(() => {
      res.redirect('/');
    });
  } catch (err) {
    console.error(err);
    req.session.error = "An error occurred while confirming account deletion.";
    res.redirect('/account');
  }
});

module.exports = router;
