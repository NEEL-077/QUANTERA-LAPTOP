const mongoose = require('mongoose');

class Database {
    constructor() {
        this.connection = null;
    }

    async connect() {
        try {
            const mongoUri = process.env.MONGODB_URI;
            
            if (!mongoUri) {
                throw new Error('MONGODB_URI environment variable is not set');
            }

            const options = {
                maxPoolSize: 10,
                serverSelectionTimeoutMS: 5000,
                socketTimeoutMS: 45000,
            };

            this.connection = await mongoose.connect(mongoUri, options);
            
            const isLocal = mongoUri.includes('localhost') || mongoUri.includes('127.0.0.1');
            console.log(`✅ Connected to MongoDB ${isLocal ? 'Locally' : 'Atlas Server'}`);
            console.log(`📊 Database: ${this.connection.connection.name}`);
            console.log(`🌐 Host: ${this.connection.connection.host}`);
            
            // Handle connection events
            mongoose.connection.on('error', (err) => {
                console.error('❌ MongoDB connection error:', err);
            });

            mongoose.connection.on('disconnected', () => {
                console.warn('⚠️  MongoDB disconnected');
            });

            mongoose.connection.on('reconnected', () => {
                console.log('🔄 MongoDB reconnected');
            });

            return this.connection;
        } catch (error) {
            console.error('❌ Failed to connect to MongoDB:', error.message);
            
            if (error.message.includes('authentication failed') || error.message.includes('bad auth')) {
                console.error('🔑 Atlas Authentication Failed. Please verify your Mongo DB username and password.');
            } else if (error.message.includes('network') || error.message.includes('selection timeout') || error.message.includes('IP')) {
                console.error('🌐 Network Connection error. If using Atlas, verify your IP is whitelisted under Network Access in MongoDB Atlas Console.');
            }
            
            throw error;
        }
    }

    async disconnect() {
        if (this.connection) {
            const isLocal = this.connection.connection.host.includes('127.0.0.1') || this.connection.connection.host.includes('localhost');
            await mongoose.disconnect();
            console.log(`🔌 Disconnected from MongoDB ${isLocal ? 'Local' : 'Atlas'}`);
        }
    }

    isConnected() {
        return mongoose.connection.readyState === 1;
    }

    getConnection() {
        return this.connection;
    }
}

module.exports = new Database();