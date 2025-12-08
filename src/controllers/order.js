// authenticated-only

const mongoose = require("mongoose");
const OrderModel = require("../models/order.js");
const CustomError = require("../error-handling/customError.js");
const sendApiResponse = require("../utils/apiResponse.js");
const CartModel = require("../models/cart.js");
const { getCartSummary, populateCart, validateStock } = require('../utils/helpers/cart.js');
const { startOrderProcessing } = require("../queues/order.js");
const { addEmailToQueue } = require("../queues/email.js");
const { updateProductsOnCancellation, updateProductsOnDelivery } = require("../utils/helpers/product.js");
const razorpay = require("../configs/razorpay.js");
const crypto = require("crypto");
const { getRemainingDeliveryTime, reserveStock } = require("../utils/helpers/order.js");


// create new order (currently supports only cash_on_delivery)
const createOrder = async (req, res, next) => {
    const { addressID, paymentMethod } = req.body;
    const user = req.user;

    const cart = await populateCart(user, req.nearbyWarehouse);

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


    // exclude out of stock products
    const products = cart.products.filter(item => item.warehouseQuantity > 0)

    if(products.length === 0){
         return next(
            new CustomError('BadRequestError', 'All items in your cart are out of stock!', 400));
    }
    
    // get total amount of the cart
    const grandTotal = getCartSummary(products).grandTotal;

    const paymentMethodEnums = OrderModel.schema.path('paymentMethod').enumValues

    if(!paymentMethodEnums.includes(paymentMethod)){
        return next(new CustomError('BadRequestError', 'Invalid payment method!', 400));
    }

    let razorpayOrder;
    if (paymentMethod !== 'cash_on_delivery') {
        razorpayOrder = await razorpay.orders.create({
            amount: grandTotal * 100, // in paise
            receipt: 'reciept#1',
            method: paymentMethod,
            payment_capture: 1,
        })
    }
    
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
                        paymentMethod,
                        orderStatus: paymentMethod === 'cash_on_delivery' ? 'placed' : 'pending',
                        razorpayOrderID: paymentMethod === 'cash_on_delivery' ? null : razorpayOrder.id,
                        products: products.map(item => ({
                            product: item.productDetails._id,
                            quantity: item.requestedQuantity,
                            priceAtPurchase: item.productDetails.price,
                        })),
                        warehouse: req.nearbyWarehouse._id,
                        totalAmount: grandTotal,
                        expectedDeliveryAt: paymentMethod === 'cash_on_delivery' ? 
                         new Date(Date.now() + getRemainingDeliveryTime('placed')) : null
                    }],
                    { session }
                )
            )[0];
            
            // reserve stock and clear cart
            await reserveStock(products, user, req.nearbyWarehouse, session);

            // clear cart
            await CartModel.findOneAndUpdate(
                    { user: user._id },
                    { products: [] },
                    { runValidators: true, session }
                );

            if (paymentMethod === 'cash_on_delivery') {
            
            // begin order flow ('processing' to 'delivered')
                await startOrderProcessing({
                    orderID: newOrder._id,
                    productsName: products.map(item => item.productDetails.name),
                    email: user.email,
                    createdAt: newOrder.createdAt
                })

                return sendApiResponse(res, 201, {
                    message: 'Order placed successfully ✅',
                    data: newOrder
                })
            }

            else{
                return sendApiResponse(res, 201, {
                    message: 'Order creation initiated',
                    data: {
                        razorpayOrderID: razorpayOrder.id,
                        amount: razorpayOrder.amount,
                        orderDB: newOrder,
                    }
                })
            }
        });
    } catch (err) {
        return next(err);
    } finally {
        await session.endSession();
    }
}

// Razorpay makes a POST request on this handler/route for the payment result
const razorpayVerify = async (req, res, next) => {
    const payload = req.body
    const razorpaySignature = req.headers["x-razorpay-signature"];

    console.log( 'payload',payload.payload);
    console.log( 'id',payload.payload?.payment?.entity?.order_id);

    const order = await OrderModel.findOne(
        { razorpayOrderID: payload.payload?.payment?.entity?.order_id })
        .populate({
            model: 'user',
            path: 'user',
            select: 'email _id warehouse'
        });
        

        if (!order) {
            return next(new CustomError('NotFoundError', 'Order not found', 404))
        }
 
    
    const cart = await populateCart(order.user, {_id: order.warehouse});

    // generate expected signature
    const expectedSignature = crypto.createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET)
        .update(JSON.stringify(payload))
        .digest('hex');


        // if signatures don't match
    if (expectedSignature !== razorpaySignature) {
        return next(new CustomError('BadRequestError', 'Invalid signature', 400))
    }

    // update order based on event
    let session;

    if (payload.event === 'payment.failed') {
        console.log('payment failed');

        // only update if not already failed
        if (order.paymentStatus !== 'failed') {

            session = await mongoose.startSession();

            try {
                await session.withTransaction(async () => {
                    // restore stock
                    await updateProductsOnCancellation(order.products, order.warehouse);

                    order.paymentStatus = 'failed';

                    await order.save();
                });
            }
            catch (err) {
                return next(err);
            }
            finally {
                await session.endSession();
            }
        }

        // notify user about payment failure
        await addEmailToQueue(
            order.user.email,
            'Payment Failed',
            `Payment for your order placed on ${order.createdAt.toLocaleString()} has failed. Please try placing the order again.`
        )
    }

    else if (payload.event === 'payment.captured') {
        console.log('payment captured');
        order.paymentStatus = 'paid';
        order.orderStatus = 'placed';

        // set remaining delay
        order.expectedDeliveryAt = new Date(Date.now() + getRemainingDeliveryTime('placed'))

        await order.save({ session: session });

        // begin order flow ('processing' to 'delivered')
        await startOrderProcessing({
            orderID: order._id,
            productsName: cart.products.map(item => item.productDetails.name),
            email: order.user.email,
            createdAt: order.createdAt
        })
    }

    sendApiResponse(res, 201, {
        message: 'OK'
    })
}

// get orders
const getOrders = async (req, res, next) => {
    const user = req.user;
    const {filter, sort, limit, skip, select} = req.sanitizedQuery;
    
    // get recent orders
    const orders = await OrderModel.find({...filter, user: user._id }).populate({
        path: 'products.product',
        model: 'product',
        select: 'name price images'
    })
    .sort(sort)
    .limit(limit)
    .skip(skip)
    .select(select);

    
    // sort orders by status (out_for_delivery > placed > pending > cancelled)
    const statusOrder = {
        out_for_delivery: 1,
        placed: 2,
        pending: 3,
        delivered: 4,
        cancelled: 5
    };

    const sortedOrders = orders.length > 0 ? orders
    .sort((a, b) => statusOrder[a.orderStatus] - statusOrder[b.orderStatus])
    : [];

    sendApiResponse(res, 200, {
        data: sortedOrders
    });
}

// get order by ID
const getOrderByID = async (req, res, next) => {
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
}

// cancel order (single order)
const cancelOrder = async (req, res, next) => {
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
            await updateProductsOnCancellation(orderToCancel.products, orderToCancel.warehouse);

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
}

// handles acceptance or rejection of delivery when the order status is 'reached_destination'
const confirmDelivery = async (req, res, next) => {
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
                order.paymentStatus = 'refunded';
                await updateProductsOnCancellation(order.products, order.warehouse)
                
            } else {
                // accept order
                order.orderStatus = 'delivered';
                await updateProductsOnDelivery(order.products)
                order.paymentStatus = 'paid';
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
}

module.exports = { createOrder, razorpayVerify, getOrders, getOrderByID, cancelOrder, confirmDelivery }
