const mongoose = require('mongoose');
const { Schema, model } = mongoose;
const productCategories = require('../constants/productCategories.js');
const CustomError = require('../error-handling/customError.js');

// Part of product schema field
const warehouse = new Schema({
    warehouse: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'warehouse',
        required: [true, 'Warehouse ID is required'],
        trim: true,
        lowercase: true,
    }, 
    quantity: {
        type: Number,
        required: [true, 'Product quantity is required'],
        min: [0, 'Quantity cannot be negative'],
    }
})

// PRODUCT SCHEMA
const ProductSchema = new Schema({
    name: {
        type: String,
        required: true,
        trim: true,
        validate: {
            validator: function (name) {
                return name.length < 50 && name.length > 2;
            },
            message: () => 'Name length must be between 2 and 50'
        }
    },

    category: {
        type: String,
        required: true,
        trim: true,
        lowercase: true,
        enum: {
            values: [
                ...new Set(
                    productCategories.map(category => category?.name?.toLowerCase() || ''))
            ],
            message: "Invalid category! '{VALUE}'"
        }
    },
    subcategory: {
        type: String,
        required: true,
        trim: true,
        lowercase: true,
        validate: {
            // ensures subcategory belongs to its valid category 
            // Incorrect:( Fruits: Chips)
            // Correct: (Fruits: Apple)
            validator: function (subcategory) {
                const category = productCategories.find(categ => 
                    categ.name.toLowerCase() === this.category.toLowerCase()
                );

                if (!category) return false;
                return category.subcategories.includes(subcategory);
            },
            message: () => 'Invalid subcategory!'
        }
    },
    price: {
        type: Number,
        required: true,
        min: 0,
    },

    description: {
        type: String,
        required: true,
        trim: true,
        minlength: [20, 'Min 20 characters are required for the description!'],
        maxlength: [500, 'Max 500 characters are allowed for the description!'],
    },

    // popularity score (increments each time the product is ordered or added to the cart)
    score: {
        type: Number,
        default: 0,
        select: false
    },
    tags: {
        type: [String],
        trim: true,
        lowercase: true,
        default: [],
        validate: {
            validator: function (tags=[]) {
                return tags.length <= 10
            },
            message: () => 'Max 10 Tags are allowed.'
        }
    },
    images: {
        type: [String],
        defauly: [],
        validate: {
            validator: function (images=[]) {
                return images.length <= 5
            },
            message: () => 'Max 5 Images are allowed.'
        }
    },

    // for maintaining quanitity of products for each warehouse
    warehouses: {
        type: [warehouse],
        default: [],
        required: [true, 'Warehouses are required for the product'],
    },

    createdAt: {
        type: Date,
        default: Date.now,
        immutable: true
    },
})


// category + Price (filter & sort by price)
ProductSchema.index({ category: 1, price: 1 });

// product searching 
ProductSchema.index({
    name: "text",
    tags: "text",
    category: "text",
    subcategory: "text"
})

ProductSchema.pre(['findOneAndUpdate', 'updateOne', 'updateMany'], 
    async function(next) {
        const updates = this.getUpdate(); //changes for updation

        const forbiddenFields = []
        const allowedForUpdation = ['warehouses']

        // check forbidden fields 
        for (const operator of ['$set', '$pull', '$push', '$inc']) {
            if (updates[operator]) {
                const keys = Object.keys(updates[operator]);
                keys.forEach(key => {
                    if (!allowedForUpdation.includes(key)) {
                        forbiddenFields.push(key);
                    }
                });
            }
        }

        if (!updates.byAdmin && forbiddenFields.length > 0) {
            return next(
                new CustomError('ForbiddenError',
                    `You are not allowed to update: ${forbiddenFields.join(', ')}`, 403)
            );
        }

        // optionally clean helper flag
        delete updates.byAdmin;

next();
    })


const ProductModel = model('product', ProductSchema);

module.exports = ProductModel;