// script to insert categories into the database

const CategoryModel = require("../models/productCategory.js");
const mongoose = require("mongoose");
require('../configs/loadEnv.js')
const productCategories = require("../constants/productCategories.js");


const insertCategories = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');
        
        await CategoryModel.create(productCategories);

        console.log('Script executed. No errors found.');
        console.log('Categories inserted successfully!');
    } catch (err) {
        console.error('Script failed to execute');
        console.error('Error inserting categories:', err);
    } finally { 
        mongoose.disconnect();
        console.log('Disconnected from MongoDB');
    }
}
insertCategories()