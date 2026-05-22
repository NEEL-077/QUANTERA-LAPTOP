const mongoose = require('mongoose');

class Database {
    constructor() {
        this.client = null;
    }

    async connect() {
        if (this.client) return this.client;

        const uri = process.env.MONGO_URI || process.env.MONGODB_URI;
        if (!uri) {
            throw new Error('MONGO_URI or MONGODB_URI must be set in your environment');
        }

        this.client = await mongoose.connect(uri);

        console.log('✅ Connected to MongoDB');
        return this.client;
    }

    async disconnect() {
        if (mongoose.connection.readyState !== 0) {
            await mongoose.disconnect();
        }
        this.client = null;
    }

    isConnected() {
        return mongoose.connection.readyState === 1;
    }
}

module.exports = new Database();
