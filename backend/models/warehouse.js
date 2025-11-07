import { Schema, model } from 'mongoose';

// Each product in the Products collection has a 'warehouses' field to track its availability in the listed warehouses
const WarehouseSchema = new Schema({
    location: {
    type: {
      type: String,
      enum: ['Point'],
      required: true
    },
    coordinates: {
      type: [Number],
      required: true,
      validate: {
        validator: function(coords) {
          return coords[0] >= 68 && coords[0] <= 97 &&
                 coords[1] >= 8 && coords[1] <= 37;
        },
        message: 'Coordinates must be within India (longitude 68-97, latitude 8-37)'
      }
    }
  },
    street: { type: String, required: [true, 'Street is required'], trim: true },
    city: { type: String, required: [true, 'City is required'], trim: true },
    state: { type: String, required: [true, 'State is required'], trim: true },
    pinCode: { 
        type: String, 
        required: [true, 'Pin code is required'], 
        trim: true,
        validate: {
            validator: pinCode => /^[0-9]{6}$/.test(pinCode),
            message: 'Invalid pin code!'
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

// geospatial index for storing GeoJSON objects
WarehouseSchema.index({location: '2dsphere'})

const WarehouseModel = model('warehouse', WarehouseSchema);

export default WarehouseModel;