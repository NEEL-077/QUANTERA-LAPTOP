require('dotenv').config();
const database = require('../config/database');
const mongoose = require('mongoose');

const User = require('../models/User');
const Newsletter = require('../models/Newsletter');
const Order = require('../models/Order');

async function run() {
    try {
        console.log('Connecting...');
        await database.connect();
        console.log('Connected. Gathering counts...');

        const userCount = await User.countDocuments();
        const newsletterCount = await Newsletter.countDocuments();
        const orderCount = await Order.countDocuments();

        console.log(`Users: ${userCount}`);
        console.log(`Newsletter signups: ${newsletterCount}`);
        console.log(`Orders: ${orderCount}`);

        await database.disconnect();
        process.exit(0);
    } catch (err) {
        console.error('Error during DB check:', err.message || err);
        try { await database.disconnect(); } catch(e){}
        process.exit(1);
    }
}

run();
