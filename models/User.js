const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  username: String,
  email: String,
  password: String,
  isAdmin: { type: Boolean, default: false },
  rewardsPoints: { type: Number, default: 0 },
  resetPasswordToken: String,
  resetPasswordExpires: Date,
  pendingNewEmail: String,
  emailChangeToken: String,
  emailChangeExpires: Date,
  deleteAccountToken: String,
  deleteAccountExpires: Date
});
module.exports = mongoose.model('User', UserSchema);