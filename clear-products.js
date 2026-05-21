require('dotenv').config();
const mongoose = require('mongoose');
const database = require('./config/database');
const Laptop = require('./models/Laptop');
const Accessory = require('./models/Accessory');

async function clearProducts() {
    try {
        console.log('Connecting to cloud database...');
        await database.connect();
        
        console.log('Wiping all laptops...');
        const laptopRes = await Laptop.deleteMany({});
        console.log(`Deleted ${laptopRes.deletedCount} laptops.`);
        
        console.log('Wiping all accessories...');
        const accessoryRes = await Accessory.deleteMany({});
        console.log(`Deleted ${accessoryRes.deletedCount} accessories.`);
        
        console.log('✅ Cloud cleanup complete!');
    } catch (e) {
        console.error('Error during cleanup:', e);
    } finally {
        await database.disconnect();
        process.exit(0);
    }
}

clearProducts();
