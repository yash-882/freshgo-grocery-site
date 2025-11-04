import { Schema, model } from 'mongoose';
import productCategories from '../constants/productCategories.js';

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
    inStock: {
        type: Boolean,
        default: true,
    },
    quantity: {
        type: Number,
        required: true,
        min: 0,
        default: 1,
    },

    // popularity score (increments each time the product is ordered or added to the cart)
    score: {
        type: Number,
        default: 0,
        select: false
    },
    tags: {
        type: [String],
        required: [true, 'Tags are required'],
        trim: true,
        lowercase: true,
        validate: {
            validator: function (tags) {
                return tags.length >= 1 && tags.length <= 20
            },
            message: () => 'Tags (1-20 required)'
        }
    },
    images: {
        type: [String],
        required: true,
        validate: {
            validator: function (images) {
                return images.length >= 1 && images.length <= 5
            },
            message: () => 'Images (1-5 required)'
        }
    },
    seller: {
        type: Schema.Types.ObjectId,
        ref: 'user',
        immutable: true,
        required: [true, 'Seller is required'],
        select: false
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
    category: "text"
})

// pre hook
ProductSchema.pre('save', function (next) {

    // update stock when no quantity available
    if (this.quantity <= 0) {
        this.quantity = 0;
        this.inStock = false;
    }

    next()
})

const ProductModel = model('product', ProductSchema);

export default ProductModel;