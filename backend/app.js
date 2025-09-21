import express from 'express';
const app = express();

// import routers
import authRouter from './routes/auth-router.js';
import productRouter from './routes/product-route.js';
import cartRouter from './routes/cart-route.js';
import adminRouter from './routes/admin-route.js';
import userRouter from './routes/user-route.js';

// auth strategies
import googleAuth from './auth-strategies/google-auth.js';

// error custom module
import GlobalErrorHandler from './error-handling/global-error-handler.js';

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

// parse cookies
app.use(cookieParser())

// initialize passport
app.use(passport.initialize())

// google OAUTH2
passport.use(googleAuth)

// auth router
app.use('/api/auth', authRouter)

// admin router (accessible by only-admin)
app.use('/api/admin', adminRouter)

// user router (accessible by all roles (user, seller, admin))
app.use('/api/user', userRouter)

// product router (accessible by all roles (user, seller, admin, unauthenticated user))
app.use('/api/product', productRouter)

// cart router(accessible to authenticated users only)
app.use('/api/cart', cartRouter)

// global error handler middleware
app.use(GlobalErrorHandler)

export default app;