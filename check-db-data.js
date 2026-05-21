require('dotenv').config();
const mongoose = require('mongoose');
const database = require('./config/database');
const Laptop = require('./models/Laptop');

async function testConnection() {
    try {
        await database.connect();
        
        const count = await Laptop.countDocuments();
        console.log('===================================');
        console.log(`💻 Laptops found in the database: ${count}`);
        console.log('===================================');

        if (count === 0) {
            console.log('The database "Quantera_Laptop_db" is currently EMPTY.');
            console.log('This is why the brand/laptop grid is not visible in the UI!');
        } else {
            const sample = await Laptop.findOne();
            console.log('Sample laptop:', sample.brand);
        }

    } catch (e) {
        console.error('Error during test:', e);
    } finally {
        await database.disconnect();
        process.exit(0);
    }
}

testConnection();
