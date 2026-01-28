const mongoose = require('mongoose');

const propertySchema = new mongoose.Schema({
    owner: { type: String, required: true },
    address: { type: String, required: true },
    description: { type: String },
    price: { type: Number, required: true },
    imageUrl: { type: String },
    status: { type: String, enum: ['Available', 'Rented'], default: 'Available' }
});

module.exports = mongoose.model('Property', propertySchema);
