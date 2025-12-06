import { model, Schema } from "mongoose";
import productCategories from "../constants/productCategories.js";


const CategorySchema = new Schema({
    name: {
        type: String,
        required: true,
        trim: true,
        unique: true,
        enums: [
            ...new Set(
                productCategories.map(category => category?.name?.toLowerCase() || ''))
        ],
        lowercase: true,
    },
    subcategories: {
        type: [String],
        required: true,
        trim: true,
        lowercase: true,
    },
    imageUrl: {
        type: String,
        default: null,
        trim: true,
        lowercase: true,
    },
})

// hook to prevent duplicate subcategories
CategorySchema.pre('save', function(next) {
  if (this.subcategories.length !== new Set(this.subcategories).size) {
    return next(new Error('Duplicate subcategories not allowed.'));
  }

  next();
});


const CategoryModel = model('category', CategorySchema);

export default CategoryModel;