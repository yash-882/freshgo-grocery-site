const express = require('express');
const app = express();

// import routers
const authRouter = require('./routes/auth.js');
const productRouter = require('./routes/product.js');
const cartRouter = require('./routes/cart.js');
const userRouter = require('./routes/user.js');
const orderRouter = require('./routes/order.js');
const adminRouter = require('./routes/admin/adminGateway.js');
const categoryRouter = require('./routes/productCategory.js');
const productRouterManager = require('./routes/manager/product.js');
const warehouseRouter = require('./routes/manager/warehouse.js');

// auth strategies
const googleAuth = require('./auth-strategies/googleAuth.js');

// custom module
const GlobalErrorHandler = require('./middlewares/error.js');
const CustomError = require('./error-handling/customError.js');

// npm packages
const passport = require('passport');
const cookieParser = require('cookie-parser');
const qs = require('qs');
const helmet = require('helmet');

// configs
const setCors = require('./configs/cors.js');
const { apiRoot, getApiRoutes } = require('./controllers/apiEntry.js');

// set security HTTP headers
app.use(helmet())

// allow requests from the specified client origin and include credentials (like cookies) 
app.use(setCors())

// parses query strings ("?price[gt]=20&sort=-price" -> {price: {gt: "20"}, sort="-price"})
app.set("query parser", query => qs.parse(query))

// parse JSON data
app.use(express.json())

const rateLimit = require('express-rate-limit');
const { login } = require('./controllers/auth.js');

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

module.exports = app;