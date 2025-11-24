// script to insert warehouses into the database
import "../configs/loadEnv.js";
import WarehouseModel from "../models/warehouse.js";
import mongoose from "mongoose";

const insertWarehouses = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        await WarehouseModel.create([{
            location: {
                type: 'Point',
                coordinates: [72.8777, 19.0760] // [longitude, latitude]
            },
            street: '123 Main St',
            city: 'Mumbai',
            state: 'Maharashtra',
            pinCode: '400001',
            manager: null
        },
        {
            location: {
                type: 'Point',
                coordinates: [77.2090, 28.6139] // [longitude, latitude]
            },
            street: '456 Park Ave',
            city: 'Delhi',
            state: 'Delhi',
            pinCode: '110001',
            manager: new mongoose.Types.ObjectId("68c42f02b21115ce741dfb85")

        },
        {
            location: {
                type: 'Point',
                coordinates: [77.5946, 12.9716] // [longitude, latitude]
            },
            street: '789 High St',
            city: 'Bangalore',
            state: 'Karnataka',
            pinCode: '560001',
            manager: null
        }
        ]);

        console.log('Script executed. No errors found.');
        console.log('Warehouses inserted successfully!');
    } catch (err) {
        console.error('Script failed to execute');
        console.error('Error inserting warehouses:', err);
    } finally {
        mongoose.disconnect();
        console.log('Disconnected from MongoDB');
    }
}
insertWarehouses()
