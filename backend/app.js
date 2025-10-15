import express from 'express';
const app = express();

// import routers
import authRouter from './routes/auth.js';
import productRouter from './routes/product.js';
import cartRouter from './routes/cart.js';
import userRouter from './routes/user.js';
import orderRouter from './routes/order.js';
import adminRouter from './routes/admin/adminGateway.js';

// auth strategies
import googleAuth from './auth-strategies/googleAuth.js';

// error custom module
import GlobalErrorHandler from './middlewares/error.js';
import CustomError from './error-handling/customError.js';

// npm packages
import passport from 'passport';
import cookieParser from 'cookie-parser';
import qs from 'qs';


// parses query strings ("?price[gt]=20&sort=-price" -> {price: {gt: "20"}, sort="-price"})
app.set("query parser", (query)=> {
    return qs.parse(query)
})

// parse JSON data
app.use(express.json())


// handle empty body for PUT, POST, PATCH requests
app.use((req, res, next) => {
    const methodsWithBody = ['POST', 'PUT', 'PATCH']

    if(methodsWithBody.includes(req.method.toUpperCase()) && !req.body) 
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

// product router (public)
app.use('/api/product', productRouter)

// cart router (authenticated-only)
app.use('/api/cart', cartRouter)

// order router (authenticated-only)
app.use('/api/order', orderRouter)


// NOT-FOUND MIDDLEWARE (executes when no route above matches the path)
app.use((req, res, next) => {

    next(new CustomError('NotFoundError', 'Route not found!', 404))

})

// global error handler middleware
app.use(GlobalErrorHandler)

export default app;