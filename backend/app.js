import express from 'express';
const app = express();

// error custom module
import GlobalErrorHandler from './error-handling/global-error-handler.js';

// global error handler middleware
app.use(GlobalErrorHandler)

export default app;