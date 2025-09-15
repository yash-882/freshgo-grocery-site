import CartModel from "../models/cart-model.js";

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
export const populateCart = async (userID, options={}) => {
    const {filter, sort, limit, skip} = options;

    const cart = await CartModel.findOne({...filter, user: userID }).populate({
        //a field of item of products field(array) in Cart schema that stores product ID
        path: 'products.product',
        model: 'product', // name of the referenced model
        select: 'name category price description quantity images inStock',
    })
    .sort(sort).limit(limit).skip(skip)

    return cart;
}