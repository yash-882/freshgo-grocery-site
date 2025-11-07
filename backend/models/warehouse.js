import { Schema, model } from 'mongoose';

// Each product in the Products collection has a 'warehouses' field to track its availability in the listed warehouses
const WarehouseSchema = new Schema({
    location: {
        street: { type: String, required: [true, 'Street is required'], trim: true },
        city: { type: String, required: [true, 'City is required'], trim: true },
        state: { type: String, required: [true, 'State is required'], trim: true },
        zipCode: { 
            type: String, 
            required: [true, 'Zip code is required'], 
            trim: true, 
            match: /^\d{6}$/ 
        },
        coordinates: {
            type: [Number],
            required: [true, 'Coordinates are required'],
            index: '2dsphere', //geospatial index for fast queries
            // within india
            validate:{
                validator: function(coordinates){
                    return (
                    coordinates[0] >= 68 && 
                    coordinates[0] <= 97 && coordinates[1] >= 8 && 
                    coordinates[1] <= 37
                )
                },
                message: 'Coordinates must be within India (longitude 68-97, latitude 8-37)'
            }
        }
    },
    manager: {
        type: Schema.Types.ObjectId,
        ref: 'user',
        default: null, // A warehouse might not have a manager initially
    },
    createdAt: {
        type: Date,
        default: Date.now,
        immutable: true,
    },
})

// single indexing
WarehouseSchema.index({ 'address.zipCode': 1 });
WarehouseSchema.index({ 'address.state': 1 });

const WarehouseModel = model('warehouse', WarehouseSchema);

export default WarehouseModel;