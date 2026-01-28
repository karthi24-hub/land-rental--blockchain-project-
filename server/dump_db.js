const mongoose = require('mongoose');
const Agreement = require('./models/Agreement');

async function dump() {
    await mongoose.connect('mongodb://localhost:27017/land-blockchain');
    const all = await Agreement.find();
    console.log(JSON.stringify(all, null, 2));
    process.exit();
}

dump();
