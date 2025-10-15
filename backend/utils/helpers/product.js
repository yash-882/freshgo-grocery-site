// operations for product management

import mongoose from "mongoose";
import ProductModel from "../../models/product.js";

// updates products after successful delivery
export const updateProductsOnDelivery = async products => {
    await ProductModel.updateMany(
        // product IDs
        { _id: { $in: products.map(p => p.product) } },
        {
            // increase score
            $inc: {
                score: 1,
            }
        }
    );
};

// updates cancelled products
export const updateProductsOnCancellation = async products => {
    const operations = products.map(item => ({
        updateOne: {
            filter: { _id: new mongoose.Types.ObjectId(item.product._id) },
            update: {
                // restore quantity
                $set: {
                    inStock: true
                },
                $inc: {
                    quantity: item.quantity,
                }
            }
        }
    }));

    // run updation...
    await ProductModel.bulkWrite(operations);
}

