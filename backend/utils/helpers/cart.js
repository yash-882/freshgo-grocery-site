import mongoose from "mongoose";
import CustomError from "../../error-handling/customError.js";
import CartModel from "../../models/cart.js";

// throws an error if the product is out of stock or requested quantity exceeds available stock.
export const validateStock = (product, requestedQuantity = 1) => {

    if (product.inStock === false || product.quantity === 0)
        throw new CustomError(
            'BadRequestError', `Product is out of stock!`, 400);

    else if (product.quantity < requestedQuantity)
        throw new CustomError(
            'BadRequestError', `Only ${product.quantity} units are available in stock!`, 400);
}

// get user cart with added products
export const populateCart = async (userID) => {
    // run pipeline to get sorted inStock (stock available to stock unavailable)
  const cart = await CartModel.aggregate([
  { $match: { user: new mongoose.Types.ObjectId(userID) } },
  { $unwind: "$products" },
  {
    $lookup: {
      from: "products",
      localField: "products.product",
      foreignField: "_id",
      as: "productInfo"
    }
  },
  { $unwind: "$productInfo" },
  { $sort: { "productInfo.inStock": -1 } }, //sort by inStock
  {
    $group: {
      _id: "$_id",
      user: { $first: "$user" },
      products: { $push: { product: "$productInfo", quantity: "$products.quantity" } }
    }
  }
]);

    return cart[0];
}


// get cart summary (charges, total, e.t.c) 
export const getCartSummary = (products=[]) => {
    // cart is empty
    if(products.length === 0)
        return;

    const cartSummary = products.reduce((cartSummary, item) => {

        // exclude out of stock products
        if(item.product.inStock === false || item.product.quantity === 0)
            return cartSummary

        // calculate total price and add to cartSummary
        cartSummary.cartTotal += item.product.price * item.quantity
        return cartSummary

    }, {cartTotal: 0, deliveryCharges: 0, grandTotal: 0})

    // apply delivery charges if the total price is lower than to the given amount 
    if(cartSummary.cartTotal < 200){
        cartSummary.deliveryCharges = 50
    }
    
    // grand total
    cartSummary.grandTotal = cartSummary.cartTotal + cartSummary.deliveryCharges

    return {
        totalItems: products.filter(item => item.product.inStock === true && item.product.quantity > 0).length,
        cartTotal: Number((cartSummary.cartTotal).toFixed(2)),
        deliveryCharges: cartSummary.deliveryCharges,
        grandTotal: Number((cartSummary.cartTotal + cartSummary.deliveryCharges).toFixed(2))
    }
}