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
import { findNearbyWarehouse } from '../middlewares/findNearbyWarehouse.js';

const orderRouter = Router()

// authorize user
orderRouter.use(authorizeUser)

orderRouter.get('/', handleQuery(schemaRegistery.order), getOrders) // get order history

orderRouter.post('/', findNearbyWarehouse, createOrder) //create order
orderRouter.patch('/cancel/:id', cancelOrder) //cancel order
orderRouter.post('/confirm-delivery/:id/:isAccepted', confirmDelivery) //accept or deny order

orderRouter.get('/:id', getOrderByID) //get order by ID


export default orderRouter;