const nextStatusMap = require("../../constants/orderNextStatuses.js");
const CustomError = require("../../error-handling/customError.js");
const ProductModel = require("../../models/product.js");

const reserveStock = async (products, user, warehouse, session) => {
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
        throw new CustomError(
            'BadRequestError',
            'Some products just went out of stock. Refresh your cart to continue.',
            400
        );
    }
}

// returns remaining delivery time in milliseconds
const getRemainingDeliveryTime = (orderStatus='placed') => {
   let deliveryRemainingTime = 0;
        let statuses = Object.keys(nextStatusMap);
        
        // get further statuses
        const remainingStatuses = statuses.slice(statuses.indexOf(orderStatus))

        // process completed
        if(remainingStatuses.length === 0) 
            return; 
        
        // calculate remaining delivery time
        remainingStatuses.forEach(status => {
            deliveryRemainingTime += nextStatusMap[status].finishesIn
        })

        return deliveryRemainingTime
}

module.exports = { reserveStock, getRemainingDeliveryTime };