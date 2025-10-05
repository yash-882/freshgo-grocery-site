import { Router } from 'express'
import { 
    cancelOrder, 
    createOrder, 
    getOrderByID, 
    getOrders } from '../controllers/order-controller.js';
import { authorizeUser } from '../middlewares/auth-middleware.js';
import { handleQuery } from '../middlewares/query-middleware.js';
import { schemaRegistery } from '../constants/schema-registery.js';

const orderRouter = Router()

// authorize user
orderRouter.use(authorizeUser)

orderRouter.route('/')
.post(createOrder) //create order
.get(handleQuery(schemaRegistery.order), getOrders) //get recent orders

orderRouter.route('/cancel/:id')
.patch(cancelOrder) //cancel order

orderRouter.route('/:id')
.get(getOrderByID) //get order by ID


export default orderRouter;