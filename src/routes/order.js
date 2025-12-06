import { Router } from 'express'
import { 
    cancelOrder, 
    confirmDelivery, 
    createOrder, 
    getOrderByID, 
    getOrders, 
    razorpayVerify, } from '../controllers/order.js';
import { authorizeUser } from '../middlewares/auths.js';
import { handleQuery } from '../middlewares/query.js';
import { schemaRegistery } from '../constants/schemaRegistery.js';
import { findNearbyWarehouse } from '../middlewares/findNearbyWarehouse.js';

const orderRouter = Router()

// Razorpay makes a POST request on this handler/route for the payment result
orderRouter.post('/webhook-razorpay', razorpayVerify) //razorpay webhook

// authorize user
orderRouter.use(authorizeUser)

orderRouter.get('/', handleQuery(schemaRegistery.order), getOrders) // get order history

orderRouter.post('/create', findNearbyWarehouse, createOrder) //create order
orderRouter.patch('/cancel/:id', cancelOrder) //cancel order
orderRouter.post('/confirm-delivery/:id/:isAccepted', confirmDelivery) //accept or deny order

orderRouter.get('/:id', getOrderByID) //get order by ID


export default orderRouter;