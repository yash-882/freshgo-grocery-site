import express from 'express';
const app = express();

// import routers
import authRouter from './routes/auth.js';
import productRouter from './routes/product.js';
import cartRouter from './routes/cart.js';
import userRouter from './routes/user.js';
import orderRouter from './routes/order.js';
import adminRouter from './routes/admin/adminGateway.js';
import categoryRouter from './routes/productCategory.js';
import productRouterManager from './routes/manager/product.js';

// auth strategies
import googleAuth from './auth-strategies/googleAuth.js';

// error custom module
import GlobalErrorHandler from './middlewares/error.js';
import CustomError from './error-handling/customError.js';

// npm packages
import passport from 'passport';
import cookieParser from 'cookie-parser';
import qs from 'qs';

// congfigs
import setCors from './configs/cors.js';
import warehouseRouter from './routes/manager/warehouse.js';
import { findNearbyWarehouse } from './middlewares/findNearbyWarehouse.js';

// allow requests from the specified client origin and include credentials (like cookies) 
app.use(setCors())

// parses query strings ("?price[gt]=20&sort=-price" -> {price: {gt: "20"}, sort="-price"})
app.set("query parser", query => qs.parse(query))

// parse JSON data
app.use(express.json())


// handle empty body for PUT, POST, PATCH requests
app.use((req, res, next) => {
    const methodsWithBody = new Set(['POST', 'PUT', 'PATCH'])

    if(methodsWithBody.has(req.method.toUpperCase()) && !req.body) 
        req.body = {}

    next()
})

// parse cookies
app.use(cookieParser())

// initialize passport
app.use(passport.initialize())

// google OAUTH2
passport.use(googleAuth)

// auth router
app.use('/api/auth', authRouter)

// admin router (admin-only)
app.use('/api/admin', adminRouter)

// user router (authenticated-only)
app.use('/api/user', userRouter)

// find nearby warehouse 
app.use(findNearbyWarehouse)

// product router (warehouse_manager)
app.use('/api/product/manager', productRouterManager)

// cart router (authenticated-only)
app.use('/api/cart', cartRouter)

// product router (public)
app.use('/api/product', productRouter)

// order router (authenticated-only)
app.use('/api/order', orderRouter)

// Categories with their subcategories for the frontend to display
app.use('/api/category', categoryRouter)

// warehouse_manager
app.use('/api/warehouse', warehouseRouter)


// NOT-FOUND MIDDLEWARE (executes when no route above matches the path)
app.use((req, res, next) => next(new CustomError('NotFoundError', 'Route not found!', 404)))

// global error handler middleware
app.use(GlobalErrorHandler)

export default app;