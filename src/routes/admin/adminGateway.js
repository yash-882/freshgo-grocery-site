const { Router } = require('express')
const { 
    authorizeUser, 
    roleBasedAccess } = require('../../middlewares/auths.js');
const orderRouter = require('./order.js');
const productRouter = require('./product.js');
const userRouter = require('./user.js');
const warehouseRouter = require('./warehouse.js');
const adminRouter = Router();

// apply authentication and admin check to all routes
adminRouter.use(authorizeUser, roleBasedAccess('admin'));

adminRouter.use('/products', productRouter) //product
adminRouter.use('/users', userRouter) //user
adminRouter.use('/orders', orderRouter) //order
adminRouter.use('/warehouses', warehouseRouter) //order


module.exports = adminRouter;