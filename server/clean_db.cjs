const mongoose = require('mongoose');

async function clean() {
    try {
        await mongoose.connect('mongodb://localhost:27017/land-blockchain');
        const collections = await mongoose.connection.db.collections();
        for (let collection of collections) {
            await collection.deleteMany({});
            console.log(`Cleared collection: ${collection.collectionName}`);
        }
        console.log('Database cleaned successfully');
        process.exit(0);
    } catch (err) {
        console.error('Cleanup error:', err);
        process.exit(1);
    }
}

clean();
