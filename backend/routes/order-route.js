import { Router } from 'express'
import { createOrder, getOrders } from '../controllers/order-controller.js';
import { authorizeUser } from '../middlewares/auth-middleware.js';

const orderRouter = Router()

// authorize user
orderRouter.use(authorizeUser)

orderRouter.route('/')
.post(createOrder) //create order
.get(getOrders) //get recent orders

export default orderRouter;