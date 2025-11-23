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
import warehouseRouter from './routes/manager/warehouse.js';

// auth strategies
import googleAuth from './auth-strategies/googleAuth.js';

// custom module
import GlobalErrorHandler from './middlewares/error.js';
import CustomError from './error-handling/customError.js';

// npm packages
import passport from 'passport';
import cookieParser from 'cookie-parser';
import qs from 'qs';

// congfigs
import setCors from './configs/cors.js';
import { apiRoot, getApiRoutes } from './controllers/apiEntry.js';

// allow requests from the specified client origin and include credentials (like cookies) 
app.use(setCors())

// parses query strings ("?price[gt]=20&sort=-price" -> {price: {gt: "20"}, sort="-price"})
app.set("query parser", query => qs.parse(query))

// parse JSON data
app.use(express.json())

import rateLimit from 'express-rate-limit';

// rate limiter
app.use(rateLimit({
    windowMs: 1000 * 60, // 1 minute
    max: 40, // limit each IP to 40 requests per windowMs
    handler: (req, res, next) =>
        next(new CustomError(
            'TooManyRequestsError',
            'Too many requests, please try again later.',
            429))
}));

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

// Root route
app.get('/', apiRoot);

// API landing route: lists available public and protected endpoints
app.get('/api', getApiRoutes);

// Auth-related routes
app.use('/api/auth', authRouter);

// Admin-only routes
app.use('/api/admin', adminRouter);

// Authenticated user routes
app.use('/api/my-profile', userRouter);
app.use('/api/my-cart', cartRouter);
app.use('/api/my-orders', orderRouter);

// Product routes
app.use('/api/products/manager', productRouterManager); // Warehouse manager
app.use('/api/products', productRouter);                 // Public

// Categories & warehouses
app.use('/api/product-categories', categoryRouter); //public
app.use('/api/warehouses', warehouseRouter); //Warehouse manager


// NOT-FOUND middleware: triggers when no route matches
app.use((req, res, next) => 
    next(new CustomError('NotFoundError', `Route(${req.originalUrl}) not found!`, 404)));

// Global error handler
app.use(GlobalErrorHandler);

export default app;