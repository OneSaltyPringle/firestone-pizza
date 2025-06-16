const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: String,
  password: String,
  isAdmin: { type: Boolean, default: false },
  rewardsPoints: { type: Number, default: 0 }
});

module.exports = mongoose.model('User', userSchema);
