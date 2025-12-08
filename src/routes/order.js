const { Router } = require('express')
const { 
    cancelOrder, 
    confirmDelivery, 
    createOrder, 
    getOrderByID, 
    getOrders, 
    razorpayVerify, } = require('../controllers/order.js');
const { authorizeUser } = require('../middlewares/auths.js');
const { handleQuery } = require('../middlewares/query.js');
const { schemaRegistery } = require('../constants/schemaRegistery.js');
const findNearbyWarehouse = require('../middlewares/findNearbyWarehouse.js');

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


module.exports = orderRouter;