const mongoose = require('mongoose');

const agreementSchema = new mongoose.Schema({
    contractAddress: { type: String, required: true, unique: true },
    landlord: { type: String, required: true },
    tenant: { type: String, required: true },
    propertyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Property' },
    propertyAddress: { type: String },
    status: { type: String, enum: ['Created', 'Active', 'Terminated', 'Completed'], default: 'Created' },
    rentAmount: { type: Number },
    securityDeposit: { type: Number },
    startDate: { type: Date },
    endDate: { type: Date },
    transactions: [{
        hash: String,
        type: String,
        amount: Number,
        timestamp: Date
    }]
});

module.exports = mongoose.model('Agreement', agreementSchema);
