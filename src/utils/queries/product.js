const ProductModel = require("../../models/product.js");

// reusable util for retreiving products
const getProductsAgg = async ({
    filter = {},
    sort={},
    limit = 12,
    skip = 0,
    select={}
}, nearbyWarehouse, sortByHighlyPurchased = true) => {

    let quantity;

    // handle query for quantity
    if (filter.quantity) {
        quantity = filter.quantity;
        delete filter.quantity; //remove from the original filter (because its not a direct field in product)
    }
    else {
        quantity = { $gt: -1 } //default
    }

    return await ProductModel.aggregate([
        {
            $match: {
                ...filter,
                "warehouses.warehouse": nearbyWarehouse._id
            }
        },
        // get the products available in the nearby warehouse
        {
            $addFields: {
                matchedWarehouse: {
                    $first: {
                        $filter: {
                            input: "$warehouses",
                            as: "w",
                            cond: { $eq: ["$$w.warehouse", nearbyWarehouse._id] }
                        }
                    }
                }
            }
        },

        // add the product quantity available in the warehouse
        {
            $addFields: {
                quantity: "$matchedWarehouse.quantity"
            }
        },

        // quantity available in the warehouse 
        {
            $match: { quantity }
        },

        // default sort by most purchased and high-to-low quantity
        { 
            $sort: { 
            ...sort, 

            // sort by popularity if TRUE
           ...( sortByHighlyPurchased ? { score: -1 }  : {} ),  
            quantity: sort.quantity || -1 
        } 
    },

        { $skip: skip || 0 },
        { $limit: limit || 12 },

        // projection
        {
            $project: select && Object.keys(select).length ? select : {
                warehouses: 0,
                matchedWarehouse: 0,
                tags: 0,
                score: 0,
                __v: 0,
            }
        },
    ])

}

module.exports = { getProductsAgg };