import express from 'express';
const app = express();

// import routers
import authRouter from './routes/auth-router.js';

// error custom module
import GlobalErrorHandler from './error-handling/global-error-handler.js';

// npm packages
import cookieParser from 'cookie-parser';
import adminRouter from './routes/admin-route.js';
import userRouter from './routes/user-route.js';
import productRouter from './routes/product-route.js';
import qs from 'qs';
import cartRouter from './routes/cart-route.js';

// parses query strings ("?price[gt]=20&sort=-price" -> {price: {gt: "20"}, sort="-price"})
app.set("query parser", (query)=> {
    return qs.parse(query)
})

// parse JSON data
app.use(express.json())

// parse cookies
app.use(cookieParser())

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