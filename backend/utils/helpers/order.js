import CustomError from "../../error-handling/customError.js";
import ProductModel from "../../models/product.js";

export const reserveStock = async (products, user, warehouse, session) => {
    // update product stock
    const productsUpdates = products.map(item => ({
        updateOne: {
            // ensures enough stock
            filter: {
                _id: item.productDetails._id,
                warehouses: {
                    $elemMatch: {
                        warehouse: warehouse._id,
                        quantity: { $gte: item.requestedQuantity }
                    }
                }
            },
            update: {
                $inc: {
                    'warehouses.$.quantity': -item.requestedQuantity,
                }

            }
        }
    }));
     
    // execute bulk write
    const bulkResult = await ProductModel.bulkWrite(productsUpdates, { session });

    // if some products could not be updated due to insufficient stock
    if (bulkResult.matchedCount < products.length) {

        log('reserve stock: insufficient stock, throwing error');
        throw new CustomError(
            'BadRequestError',
            'Some products just went out of stock. Refresh your cart to continue.',
            400
        );
    }
}