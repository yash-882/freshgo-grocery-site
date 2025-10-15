import { Router } from 'express'
import { 
    cancelOrder, 
    confirmDelivery, 
    createOrder, 
    getOrderByID, 
    getOrders } from '../controllers/order.js';
import { authorizeUser } from '../middlewares/auths.js';
import { handleQuery } from '../middlewares/query.js';
import { schemaRegistery } from '../constants/schemaRegistery.js';

const orderRouter = Router()

// authorize user
orderRouter.use(authorizeUser)

orderRouter.route('/')
.post(createOrder) //create order
.get(handleQuery(schemaRegistery.order), getOrders) //get recent orders

orderRouter.route('/cancel/:id')
.patch(cancelOrder) //cancel order

orderRouter.route('/confirm-delivery/:id/:isAccepted')
.post(confirmDelivery) //accept or deny order

orderRouter.route('/:id')
.get(getOrderByID) //get order by ID


export default orderRouter;