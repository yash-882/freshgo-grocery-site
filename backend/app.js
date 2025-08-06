import express from 'express';
const app = express();

// import routers
import authRouter from './routes/auth-router.js';

// error custom module
import GlobalErrorHandler from './error-handling/global-error-handler.js';

// npm packages
import cookieParser from 'cookie-parser';

// parse JSON data
app.use(express.json())

// parse cookies
app.use(cookieParser())

// auth router
app.use('/api/auth', authRouter)

// global error handler middleware
app.use(GlobalErrorHandler)

export default app;