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
app.use('/api/user', userRouter);
app.use('/api/cart', cartRouter);
app.use('/api/order', orderRouter);

// Product routes
app.use('/api/product/manager', productRouterManager); // Warehouse manager
app.use('/api/product', productRouter);                 // Public

// Categories & warehouses
app.use('/api/category', categoryRouter); //public
app.use('/api/warehouse', warehouseRouter); //Warehouse manager


// NOT-FOUND middleware: triggers when no route matches
app.use((req, res, next) => next(new CustomError('NotFoundError', 'Route not found!', 404)));

// Global error handler
app.use(GlobalErrorHandler);

export default app;