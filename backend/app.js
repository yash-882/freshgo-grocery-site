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

// global error handler middleware
app.use(GlobalErrorHandler)

export default app;