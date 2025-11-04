// script to insert categories into the database

import CategoryModel from "../models/productCategory.js";
import mongoose from "mongoose";
import '../configs/loadEnv.js'
import productCategories from "../constants/productCategories.js";


const insertCategories = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        await CategoryModel.deleteMany({}); //avoid duplication
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