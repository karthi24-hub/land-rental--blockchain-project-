require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const Property = require('./models/Property');
const Agreement = require('./models/Agreement');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/land-blockchain';

mongoose.connect(MONGO_URI)
    .then(() => console.log('MongoDB connected'))
    .catch(err => console.error('MongoDB connection error:', err));

// Property Routes
app.get('/api/properties', async (req, res) => {
    try {
        const properties = await Property.find();
        res.json(properties);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/properties', async (req, res) => {
    try {
        const property = new Property(req.body);
        await property.save();
        res.status(201).json(property);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

app.get('/api/agreements', async (req, res) => {
    try {
        const agreements = await Agreement.find().populate('propertyId');
        res.json(agreements);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Agreement Routes
app.post('/api/agreements', async (req, res) => {
    try {
        if (mongoose.connection.readyState !== 1) {
            throw new Error('Database is not connected. Please ensure MongoDB is running.');
        }
        console.log('Received agreement creation request:', req.body);
        const agreement = new Agreement(req.body);
        await agreement.save();
        res.status(201).json(agreement);
    } catch (err) {
        console.error('Agreement creation failed:', err);
        res.status(400).json({ error: err.message });
    }
});

app.get('/api/agreements/:address', async (req, res) => {
    try {
        const address = req.params.address.toLowerCase();
        console.log('Searching for agreement matching address:', address);

        const agreement = await Agreement.findOne({
            $or: [
                { landlord: { $regex: new RegExp(`^${address}$`, 'i') } },
                { tenant: { $regex: new RegExp(`^${address}$`, 'i') } }
            ]
        }).populate('propertyId');

        if (!agreement) {
            console.log('Not found by landlord/tenant address. Trying direct search...');
            // Backup: check if it's the contract address itself
            const direct = await Agreement.findOne({ contractAddress: { $regex: new RegExp(`^${address}$`, 'i') } });
            if (direct) {
                console.log('Found as contract address');
                return res.json(direct);
            }
        }

        console.log('Search result:', agreement ? 'Found' : 'Not Found');
        res.json(agreement);
    } catch (err) {
        console.error('Search error:', err);
        res.status(500).json({ error: err.message });
    }
});

app.patch('/api/agreements/:contractAddress', async (req, res) => {
    try {
        const agreement = await Agreement.findOneAndUpdate(
            { contractAddress: req.params.contractAddress },
            req.body,
            { new: true }
        );
        res.json(agreement);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
