import { Router } from 'express'
import { 
    authorizeUser, 
    roleBasedAccess } from '../../middlewares/auth-middleware.js';
import queueRouter from './queue-route.js';
import orderRouter from './order-route.js';
import productRouter from './product-route.js';
import userRouter from './user-route.js';
const adminRouter = Router();


// apply authentication and admin check to all routes
adminRouter.use(authorizeUser, roleBasedAccess('admin'));

adminRouter.use('/product', productRouter) //product
adminRouter.use('/user', userRouter) //user
adminRouter.use('/queue', queueRouter) //queue
adminRouter.use('/order', orderRouter) //order

export default adminRouter;