const mongoose = require("mongoose");
const CustomError = require("../../error-handling/customError.js");
const CartModel = require("../../models/cart.js");

// throws an error if the product is out of stock or requested quantity exceeds available stock.
const validateStock = (product, requestedQuantity = 1, nearbyWarehouse) => {

  // find the product in the specified warehouse
  const warehouse = product.warehouses.find(
    item => item.warehouse.toString() === nearbyWarehouse._id.toString()); 

    // product is unavailable for user's location
    if(!warehouse){
      throw new CustomError(
            'BadRequestError', `Product is unavailable for the current location.`, 400);
    }

    // out of stock for user's location
    else if(warehouse.quantity === 0){
      throw new CustomError(
            'BadRequestError', `Out of stock. Try a different location.`, 400);
    }

    // not enough stock to add up more quantity
    else if (warehouse.quantity < requestedQuantity)
        throw new CustomError(
            'BadRequestError', `Cannot add more than ${warehouse.quantity} units of this item.`, 400);
}

// get user cart with added products
// run pipeline to get sorted products by quantity (in descending order)
const populateCart = async (user, nearbyWarehouse) => {

    const cart = await CartModel.findOne({user: user._id});
    if(!cart) return null;

  const cartProducts = await CartModel.aggregate([
  {
    $match: { user: new mongoose.Types.ObjectId(user._id) }
  },

  {
    $unwind: "$products"
  },

  {
    $lookup: {
      from: "products",
      let: { pid: "$products.product" },
      pipeline: [
        {
          $match: {
            $expr: { $eq: ["$_id", "$$pid"] }
          }
        }
      ],
      as: "productDetails"
    }
  },

  { $unwind: "$productDetails" },

  // Extract quantity for the specific warehouse
  {
    $addFields: {
      warehouseQuantity: {
        $reduce: {
          input: "$productDetails.warehouses",
          initialValue: 0,
          in: {
            $cond: [
              { $eq: ["$$this.warehouse", new mongoose.Types.ObjectId(nearbyWarehouse._id)] },
              "$$this.quantity",
              "$$value"
            ]
          }
        }
      },
      requestedQuantity: "$products.quantity"
    }
  },

  // Sort products by stock availability
  {
    $sort: { warehouseQuantity: -1 }
  },
  {
    $project: {
       warehouses: 0,
      'productDetails.warehouses': 0,
      'productDetails.score': 0,
      'productDetails.createdAt': 0,
      'productDetails.updatedAt': 0,
      'productDetails.__v': 0,
      __v: 0,
      user:0,
      products:0
    }
  }
]);

    return {
        products: cartProducts
    };
}


// get cart summary (charges, total, e.t.c) 
const getCartSummary = (products=[]) => {
    // cart is empty
  if (products.length === 0)
    return {
      totalItems: 0,
      cartTotal: 0,
      deliveryCharges: 0,
      grandTotal: 0
    };

    const cartSummary = products.reduce((cartSummary, item) => {

        // exclude out of stock products
        if(item.warehouseQuantity === 0)
            return cartSummary

        // calculate total price and add to cartSummary
        cartSummary.cartTotal += item.productDetails.price * item.requestedQuantity
        return cartSummary

    }, {cartTotal: 0, deliveryCharges: 0, grandTotal: 0})

    // apply delivery charges if the total price is lower than to the given amount 
    if(cartSummary.cartTotal < 200){
        cartSummary.deliveryCharges = 50
    }
    
    // grand total
    cartSummary.grandTotal = cartSummary.cartTotal + cartSummary.deliveryCharges

    return {
        totalItems: products.filter(item => item.warehouseQuantity > 0).length,
        cartTotal: Number((cartSummary.cartTotal).toFixed(2)),
        deliveryCharges: cartSummary.deliveryCharges,
        grandTotal: Number((cartSummary.cartTotal + cartSummary.deliveryCharges).toFixed(2))
    }
}

module.exports = { validateStock, populateCart, getCartSummary };