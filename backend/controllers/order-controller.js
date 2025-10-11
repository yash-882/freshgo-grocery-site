// authenticated-only

import mongoose from "mongoose";
import OrderModel from "../models/order-model.js";
import CustomError from "../error-handling/custom-error-class.js";
import controllerWrapper from "../utils/controller-wrapper.js";
import sendApiResponse from "../utils/api-response.js";
import CartModel from "../models/cart-model.js";
import ProductModel from "../models/product-model.js";
import { getCartSummary, populateCart } from '../utils/cart-helpers.js';
import { startOrderProcessing } from "../queues/order/order-status.js";
import { addEmailToQueue } from "../queues/email-queue.js";
import { updateProductsOnCancellation, updateProductsOnDelivery } from "../utils/product-helpers.js";


// create new order (currently supports only cash_on_delivery)
export const createOrder = controllerWrapper(async (req, res, next) => {
    const { addressID, cashOnDelivery } = req.body;
    const user = req.user;

    const cart = await populateCart(user._id);

    if (!cart || cart.products.length === 0) {
        return next(new CustomError(
            'BadRequestError', 'Orders cannot be placed with an empty cart!', 400));
    }

    if (!addressID) {
        return next(new CustomError('BadRequestError', 'Address ID is required', 400));
    }

    if (user.addresses.length === 0) {
        return next(
            new CustomError('BadRequestError', 
                'Please add a shipping address before placing an order', 400));
    }

    const shippingAddress = user.addresses.find(addr => addr._id.equals(addressID));
    if (!shippingAddress) {
        return next(
            new CustomError('BadRequestError', 
                'The provided address was not found in your saved addresses', 400));
    }

    if (cashOnDelivery !== true) {
        return next(
            new CustomError('BadRequestError', 
                'Currently accepting cash on delivery only', 400));
    }

    // get total amount of the cart
    const grandTotal = getCartSummary(cart.products).grandTotal;

    let newOrder;

    // start session
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
                        orderStatus: 'placed',
                        products: cart.products.map(item => ({
                            product: item.product,
                            quantity: item.quantity
                        })),
                        totalAmount: grandTotal
                    }],
                    { session }
                )
            )[0];

            // update product stock
            const productsUpdates = cart.products.map(item => ({
                updateOne: {
                    filter: {
                        _id: item.product,
                        quantity: { $gte: item.quantity } // ensures enough stock
                    },
                    update: [
                        {
                            $set: {
                                quantity: { $subtract: ["$quantity", item.quantity] },
                                inStock: { $gt: [{ $subtract: ["$quantity", item.quantity] }, 0] }
                            }
                        }
                    ]
                }
            }));

            const bulkResult = await ProductModel.bulkWrite(productsUpdates, { session });

            if (bulkResult.matchedCount < cart.products.length) {
                throw new CustomError(
                    'BadRequestError',
                    'Some products just went out of stock. Refresh your cart to continue.',
                    400
                );
            }

            //  clear cart
            await CartModel.findOneAndUpdate(
                { user: user._id },
                { products: [] },
                { runValidators: true, session }
            );
            
            // begin order flow ('processing' to 'delivered')
            await startOrderProcessing({
                orderID: newOrder._id, 
                productsName: cart.products.map(item => item.product.name),
                email: user.email,
                createdAt: newOrder.createdAt
            })
        });
    } catch (err) {
        return next(err);
    } finally {
        await session.endSession();
    }

    return sendApiResponse(res, 201, {
        message: 'Order confirmed 😄✅',
        data: newOrder
    });
});

// get orders
export const getOrders = controllerWrapper(async (req, res, next) => {
    const user = req.user;
    const {filter, sort, limit, skip, select} = req.sanitizedQuery;
    
    // get recent orders
    const orders = await OrderModel.find({...filter, user: user._id }).populate({
        path: 'products.product',
        model: 'product',
        select: 'name price category'
    })
    .sort(sort)
    .limit(limit)
    .skip(skip)
    .select(select);

    // no order found
    if (orders.length === 0) {
        return next(
            new CustomError('NotFoundError', 'No recent orders found', 404)
        );
    }
    
    // sort orders by status (out_for_delivery > placed > pending > cancelled)
    const statusOrder = {
        out_for_delivery: 1,
        placed: 2,
        pending: 3,
        delivered: 4,
        cancelled: 5
    };

    const sortedOrders = orders
    .sort((a, b) => statusOrder[a.orderStatus] - statusOrder[b.orderStatus]);

    sendApiResponse(res, 200, {
        data: sortedOrders
    });
});

// get order by ID
export const getOrderByID = controllerWrapper(async (req, res, next) => {
    const orderID = req.params.id;
    const user = req.user;

    if (!orderID) {
        return next(
            new CustomError('BadRequestError', 'Order ID is required', 400)
        );
    }

    const order = await OrderModel.findOne({ _id: orderID, user: user._id }).populate({
        path: 'products.product',
        model: 'product',
        select: 'name price category'
    });

    if (!order) {
        return next(
            new CustomError('NotFoundError', 'Order not found', 404)
        );
    }

    sendApiResponse(res, 200, {
        data: order
    });
});

// cancel order (single order)
export const cancelOrder = controllerWrapper(async (req, res, next) => {
    const orderID = req.params.id;
    const user = req.user;

    if(!orderID){
        return next(
            new CustomError('BadRequestError', 'Order ID is required for cancellation', 400)
        );
    }
    
    let orderToCancel;
    let session;

    try{
        session = await mongoose.startSession();

        await session.withTransaction(async () => {
            orderToCancel = await OrderModel.findOne({
                _id: orderID,
                user: user._id
            })
            .session(session);

            // order was never made
            if(!orderToCancel){
                throw new CustomError('NotFoundError', 'Order not found for cancellation', 404)
            } 

            // already cancelled
            else if(orderToCancel.orderStatus === "cancelled"){
                throw new CustomError('BadRequestError', 'Order is already cancelled', 400)
            }

            // cannot cancel the order once it is out for delivery
            else if (orderToCancel.orderStatus === 'out_for_delivery') {
                throw new CustomError(
                    'BadRequestError',
                    `Orders can't be cancelled once out for delivery; you can refuse them at the door.`,
                    400)
            }

            // cancel the order and save
            orderToCancel.orderStatus = 'cancelled';
            await orderToCancel.save({session});

            // update products (restore stock, etc)
            await updateProductsOnCancellation(orderToCancel.products);

        })
    }
    catch(err){
        return next(err);
    }
    finally{
        await session.endSession();
    }

    sendApiResponse(res, 200, {
        message: 'Order cancelled successfully',
        data: orderToCancel
    });
})

// handles acceptance or rejection of delivery when the order status is 'reached_destination'
export const confirmDelivery = controllerWrapper(async (req, res, next) => {
    const user = req.user;
    const { isAccepted, id: orderID } = req.params;

    if (!orderID) {
        return next(new CustomError('BadRequestError', 'Order ID is required', 400));
    }

    let session, order;
    try {
        session = await mongoose.startSession();

        await session.withTransaction(async () => {
            order = await OrderModel.findOne({ _id: orderID, user: user._id })
                .populate('products.product', 'name')
                .session(session);

            // verify order    

            if (!order) 
                throw new CustomError('NotFoundError', 'Order not found', 404);
            

            if (['cancelled', 'delivered'].includes(order.orderStatus)) 
                throw new CustomError('BadRequestError', 'Order has already been delivered or cancelled', 400);
            

            if (order.orderStatus !== 'reached_destination') 
                throw new CustomError('BadRequestError', "You can’t confirm the order until the delivery partner reaches the destination", 400)
            
            // if the order is accepted by the user
            if (isAccepted === 'false') {
                // deny order
                order.orderStatus = 'cancelled';
                await updateProductsOnCancellation(order.products)
                
            } else {
                // accept order
                order.orderStatus = 'delivered';
                await updateProductsOnDelivery(order.products)
            }

            await order.save({ session });
        }); 

        // after transaction, prepare email and respond
        const productsName = order.products.map(p => p.product.name).join(', ');
        const emailDetails = {
            to: user.email,
            subject: order.orderStatus === 'cancelled' ? 'Order Cancelled' : 'Order Delivered',
            text: `Order for "${productsName}", placed on ${order.createdAt.toLocaleDateString()} has been ${order.orderStatus}.`
        };

        // add to the queue
        await addEmailToQueue(emailDetails.to, emailDetails.subject, emailDetails.text);

        return sendApiResponse(res, 200, {
            message: order.orderStatus === 'cancelled'
                ? 'Order has been cancelled as per your request'
                : 'Order confirmed and delivered successfully✅',
            data: order
        });

    } catch (err) {
        return next(err);
    } finally {
        await session.endSession();
    }
});
