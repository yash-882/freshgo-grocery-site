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

adminRouter.use('/products', productRouter) //product
adminRouter.use('/users', userRouter) //user
adminRouter.use('/orders', orderRouter) //order
adminRouter.use('/warehouses', warehouseRouter) //order


export default adminRouter;