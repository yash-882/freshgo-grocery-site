// handlers for managing user's cart

import CartModel from '../models/cart.js';
import CustomError from '../error-handling/customError.js';
import controllerWrapper from '../utils/controllerWrapper.js';
import sendApiResponse from '../utils/apiResponse.js';
import ProductModel from '../models/product.js';
import { getCartSummary, populateCart, validateStock } from '../utils/helpers/cart.js';

// get user's cart
export const getCart = controllerWrapper(async (req, res, next) => {
    const userID = req.user.id;

    // get current user's cart with products
    let cart = await populateCart(userID);

    // cart not found
    if (!cart) {
        cart = new CartModel({ user: userID, products: [] });
        await cart.save() //create new cart for user
    }

    let shouldSave = false;

    cart.products.forEach((item, index) => {

        // adjust quantities if they exceed stock
        if (item.product.quantity < item.quantity) {
            cart.products[index].quantity = item.product.quantity
            shouldSave = true
        }
    })

    shouldSave && await cart.save()

    sendApiResponse(res, 200, {
        data: {
            cart,
            cartSummary: getCartSummary(cart?.products)
        },
        message: cart.products.length === 0 ? "No items in your cart yet" : undefined,

    });
});

// add product to cart
export const addToCart = controllerWrapper(async (req, res, next) => {
    const userID = req.user.id;
    const { productID, quantity=1 } = req.body;

    // quantity or product id is not provided
    if (!productID) {
        return next(new CustomError('BadRequestError', 'Product ID is required', 400));
    }

    // if the product is not found
    const product = await ProductModel.findById(productID);

    if (!product) {
        return next(new CustomError('NotFoundError', 'Product not found', 404));
    }

    let cart = await CartModel.findOne({ user: userID });

    if (!cart) {
        // create a new cart if one doesn't exist for the user
        cart = new CartModel({ user: userID, products: [] });
    }

    // find if product is already exist
    const itemIndex = cart.products
    .findIndex(item => item.product.toString() === productID);;
    
    if (itemIndex !== -1) {
        const totalQuantity = cart.products[itemIndex].quantity + quantity;
        //throws error if requestedQuantity exceeds available product quantity
      validateStock( product, totalQuantity)

        // add up more quantity to the existing product
        cart.products[itemIndex].quantity += quantity;
    }

    else{

    //throws error if requestedQuantity exceeds available product quantity
    validateStock( product, quantity)

    // add new product to cart
    cart.products.push({ product: productID, quantity });
    }

    // save cart
    await cart.save();

    sendApiResponse(res, 200, {
        message: 'Added to cart successfully',
    });
});
// clear cart   
export const clearCart = controllerWrapper(async (req, res, next) => {
    const userID = req.user.id;

    const cart = await CartModel.findOne({ user: userID });

    if (!cart || cart.products.length === 0) {
        return next(new CustomError('NotFoundError', 'Cart is already empty', 404));
    }

    // empty product list
    cart.products = []

    // save cart
    await cart.save();

    sendApiResponse(res, 200, {
        cart,
        message: 'Cart cleared successfully',
    });
});

// remove product from cart
export const removeFromCart = controllerWrapper(async (req, res, next) => {
    const userID = req.user.id;
    const productID = req.params.id;

    if (!productID)
        return next(new CustomError('BadRequestError', 'Product ID is required', 400))

    const cart = await CartModel.findOne({ user: userID });

    if (!cart) {
        return next(new CustomError('NotFoundError', 'Cart is already empty', 404));
    }

    // extracting IDs of wanting products
    const initialProductCount = cart.products.length;
    cart.products = cart.products.filter(item => item.product.toString() !== productID);

    if (cart.products.length === initialProductCount) {
        return next(new CustomError('NotFoundError', 'Product not found in cart', 404));
    }

    // update cart
    await cart.save();

    sendApiResponse(res, 200, {
        message: 'Product removed from cart successfully',
        data: cart
    });
});


//  /cart/:productId/:operation
// operation = 'inc' or 'dec'
export const updateCartItemQuantity = controllerWrapper(async (req, res, next) => {
    const { productID, operation } = req.params;

    if (!productID)
        return next(new CustomError('BadRequestError', 'Product ID is required', 400));

    // invalid operation
    if (operation !== 'inc' && operation !== 'dec')
        return next(new CustomError('BadRequestError', 'Invalid operation!', 400));

    // product is not found
    const product = await ProductModel.findById(productID);
    if (!product)
        return next(new CustomError('NotFoundError', 'Product not found!', 404));

    // first query: increment/decrement the quantity
    const updatedCart = await CartModel.findOneAndUpdate(
        {
            user: req.user.id,
            products: {
                $elemMatch: {
                    product: productID,
                    quantity: operation === 'inc' ? { $lt: product.quantity } : { $gt: 0 }
                }
            }
        },
        {
            $inc: { 'products.$.quantity': operation === 'inc' ? 1 : -1 }
        },
        { new: true, runValidators: true }
    );

    // product not found in cart or max quantity reached
    if (!updatedCart && operation === 'inc') {
        return next(new CustomError('BadRequestError', 'Product missing in cart or max quantity reached', 400));
    }

    // only run $pull if we decremented
    let finalCart = updatedCart;
    if (operation === 'dec') {
        finalCart = await CartModel.findOneAndUpdate(
            { user: req.user.id },
            { $pull: { products: { quantity: { $lte: 0 } } } }, //remove product if the quanity becomes 0
            { new: true }
        );
    }

    sendApiResponse(res, 200, {
        data: finalCart,
        message: finalCart.products.length === 0 ? 'Cart is empty' : undefined,
    });
});
