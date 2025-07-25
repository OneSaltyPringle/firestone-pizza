const mongoose = require('mongoose');

const menuCategorySchema = new mongoose.Schema({
    name: { type: String, required: true, unique: true },
    description: String
});

module.exports = mongoose.model('MenuCategory', menuCategorySchema);
