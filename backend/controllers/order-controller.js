import OrderModel from "../models/order-model.js";
import CustomError from "../error-handling/custom-error-class.js";
import controllerWrapper from "../utils/controller-wrapper.js";
import sendApiResponse from "../utils/api-response.js";
import CartModel from "../models/cart-model.js";
import ProductModel from "../models/product-model.js";
import { getCartSummary, populateCart } from '../utils/cart-helpers.js';
import mongoose from "mongoose";

// create new order (currently accepts cash_on_delivery method for orders)
export const createOrder = controllerWrapper(async (req, res, next) => {
    const { addressID, cashOnDelivery } = req.body;
    const user = req.user;

    // get user cart
    const cart = await populateCart(user._id);

    // cart is empty
    if (!cart || cart.products.length === 0) {
        return next(
            new CustomError(
                'BadRequestError',
                'Orders cannot be placed with an empty cart!',
                400
            )
        );
    }

    if (!addressID) {
        return next(
            new CustomError('BadRequestError', 'Address ID is required', 400)
        );
    }

    if (user.addresses.length === 0) {
        return next(
            new CustomError(
                'BadRequestError',
                'Please add a shipping address before placing order',
                400
            )
        );
    }

    // `find` address
    const shippingAddress = user.addresses.find(address =>
        address._id.equals(addressID)
    );

    if (!shippingAddress) {
        return next(
            new CustomError(
                'BadRequestError',
                'The provided address was not found in your saved addresses',
                400
            )
        );
    }

    if (cashOnDelivery !== true) {
        return next(
            new CustomError(
                'BadRequestError',
                'Currently accepting cash on delivery only',
                400
            )
        );
    }

    const grandTotal = getCartSummary(cart.products).grandTotal;
    let newOrder;

    const session = await mongoose.startSession();

    try {
        await session.withTransaction(async () => {
            // create order
            newOrder = (
                await OrderModel.create(
                    [{
                        shippingAddress,
                        user: user._id,
                        paymentMethod: 'cash_on_delivery',
                        orderStatus: 'processing',
                        products: cart.products.map(item => ({
                            product: item.product,
                            quantity: item.quantity
                        })),
                        totalAmount: grandTotal
                    }],
                    { session }
                )
            )[0];

            // decrease stock
            // (loop through each product in the cart and decrease its quantity in the ProductModel)
            await Promise.all(
                cart.products.map(async cartItem => {
                    const updatedProduct = await ProductModel.findOneAndUpdate(
                        {
                            _id: cartItem.product,
                            quantity: { $gte: cartItem.quantity } // ensure enough stock
                        },
                        [
                            {
                                $set: {
                                    // decrease stock
                                    quantity: { $subtract: ["$quantity", cartItem.quantity] },

                                    // increase score on purchase
                                    score: { $add: ["$score", 1] },

                                    // evaluates to TRUE or FALSE for stock availability
                                    inStock: { $gt: [{ $subtract: ["$quantity", cartItem.quantity] }, 0] }
                                }
                            }
                        ],
                        { new: true, runValidators: true, session }
                    );

                    // product just went out of stock while creating the current user's order
                    if (!updatedProduct) {
                        throw new CustomError(
                            'BadRequestError',
                            'Some products just went out of stock. Refresh your cart to continue.',
                            400
                        );
                    }
                })
            );

            // clear cart after creating order
            await CartModel.findOneAndUpdate(
                { user: user._id },
                { products: [] },
                { runValidators: true, session }
            );
        });
    } catch (err) {
        return next(err);
    } finally {
        // session end
        await session.endSession();
    }

    // order placed successfully
    return sendApiResponse(res, 201, {
        message: 'Order confirmed 😄✅',
        data: newOrder
    });
});

export const getOrders = controllerWrapper(async (req, res, next) => {
    const user = req.user;

    // get recent orders (with any orderStatus)
    const orders = await OrderModel.find({ user: user._id }).populate({
        path: 'products.product',
        model: 'product',
        select: 'name price category'
    });

    // no order found
    if (orders.length === 0) {
        return next(
            new CustomError('NotFoundError', 'No recent orders found', 404)
        );
    }

    sendApiResponse(res, 200, {
        data: orders
    });
});
