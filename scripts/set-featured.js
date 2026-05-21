require('dotenv').config();
const mongoose = require('mongoose');
const Laptop = require('../models/Laptop');
const Accessory = require('../models/Accessory');
const database = require('../config/database');

async function setFeatured() {
    try {
        await database.connect();
        
        console.log('Resetting all featured flags...');
        await Laptop.updateMany({}, { featured: false });
        await Accessory.updateMany({}, { featured: false });
        
        console.log('Marking top 12 laptops as featured with specific images...');
        const laptops = await Laptop.find().limit(12);
        
        const laptopImagePairs = [
            { brand: 'ASUS', model: 'ROG STRIX G16', img: 'images/ASUS ROG STRIX G16.webp' },
            { brand: 'Dell', model: 'Alienware R18', img: 'images/DELL ALIEANWARE.webp' },
            { brand: 'Apple', model: 'MacBook Pro M3', img: 'images/MACBOOK PRO.jpg' },
            { brand: 'Razer', model: 'Blade 16', img: 'images/RAZER BLADE 16.jpg' },
            { brand: 'ASUS', model: 'Zephyrus G14', img: 'images/ASUS ROG ZEPHYRUS.webp' },
            { brand: 'HP', model: 'OMEN MAX 16', img: 'images/HP OMEN MAX 16.webp' },
            { brand: 'Lenovo', model: 'Legion Pro 7', img: 'images/Lenovo Legion Pro 7.avif' },
            { brand: 'MSI', model: 'Raider GE78', img: 'images/MSI RAIDER.jpg' },
            { brand: 'Acer', model: 'Helios Neo 18', img: 'images/ACER HELIOS.jpg' },
            { brand: 'HP', model: 'Envy x360', img: 'images/HP ENVY.webp' },
            { brand: 'ASUS', model: 'ROG STRIX G16', img: 'images/ASUS ROG STRIX G16.webp' },
            { brand: 'Dell', model: 'Alienware m18', img: 'images/DELL ALIEANWARE.webp' }
        ];

        for (let i = 0; i < laptops.length; i++) {
            const laptop = laptops[i];
            const pair = laptopImagePairs[i] || laptopImagePairs[0];
            
            laptop.featured = true;
            laptop.brand = pair.brand;
            laptop.series = pair.model;
            laptop.image = pair.img;
            laptop.images = [pair.img];
            
            await laptop.save();
        }
        
        console.log('Marking top 12 accessories as featured...');
        const accessories = await Accessory.find().limit(12);
        for (const accessory of accessories) {
            accessory.featured = true;
            await accessory.save();
        }
        
        console.log('Successfully updated featured products with unique images!');
        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

setFeatured();
