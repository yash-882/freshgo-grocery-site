import { Router } from 'express'
import { 
    authorizeUser, 
    roleBasedAccess } from '../../middlewares/auths.js';
import orderRouter from './order.js';
import productRouter from './product.js';
import userRouter from './user.js';
import warehouseRouter from './warehouse.js';
const adminRouter = Router();


// apply authentication and admin check to all routes
adminRouter.use(authorizeUser, roleBasedAccess('admin'));

adminRouter.use('/product', productRouter) //product
adminRouter.use('/user', userRouter) //user
adminRouter.use('/order', orderRouter) //order
adminRouter.use('/warehouse', warehouseRouter) //order

export default adminRouter;