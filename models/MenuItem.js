
const mongoose = require('mongoose');

const menuItemSchema = new mongoose.Schema({
    name: { type: String, required: true },
    description: String,
    price: { type: Number, required: true },
    imageUrl: String,
    category: { type: String, default: "Pizza" },
    isPizza: { type: Boolean, default: false }
});

module.exports = mongoose.model('MenuItem', menuItemSchema);
