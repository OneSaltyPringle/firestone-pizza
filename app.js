
const express = require('express');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const expressLayouts = require('express-ejs-layouts');
const bcrypt = require('bcrypt');

const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/admin');
const cartRoutes = require('./routes/cart');
const accountRoutes = require('./routes/account');
const pizzaRouter = require('./routes/pizza');
const menuRouter = require('./routes/menu');

dotenv.config();
const app = express();


app.use(session({
    secret: 'your_secret_key',
    resave: false,
    saveUninitialized: false
}));


app.use((req, res, next) => {
    res.locals.user = req.user || null;
    next();
});

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.log(err));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.use(session({
  secret: process.env.SESSION_SECRET || 'fallbacksecret',
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({ mongoUrl: process.env.MONGO_URI }),
}));

app.set('view engine', 'ejs');
app.use(expressLayouts);
app.set('layout', 'layout');

app.use((req, res, next) => {
  res.locals.user = req.session.user;
  next();
});

app.use('/', authRoutes);
app.use('/admin', adminRoutes);
app.use('/cart', cartRoutes);
app.use('/menu', menuRouter);
app.use('/pizza', pizzaRouter);
app.use('/account', accountRoutes);

app.listen(3000, () => console.log("Firestone Pizza running on http://localhost:3000"));