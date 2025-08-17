import e from "express";
import prodErrorHandlers from "./production-error-response.js";

// OPERATIONAL_ERRORS helps identifying operational errors, 
// also including libraries errors(Mongoose, JWT, etc.)
// which don't have isOperational property, even though they are considered operational errors
// This map is basically used for setting isOperational=true
// and status codes by error name

const OPERATIONAL_ERRORS= new Map([
    ['CastError', 400], //Invalid id format
    ['ValidationError', 400], // Mongoose validation error
    ['TokenExpiredError', 401], //JWT token expired error 
    ['JsonWebTokenError', 401], //JWT invalid token
    ['TooManyRequestsError', 429], // Too many requests error,
    ['BadRequestError', 400], // Bad request error
    ['UnauthorizedError', 401], // Unauthorized access error
    ['NotFoundError', 404],  // Resource not found error
    ['ForbiddenError', 403], // Forbidden access error
    ['ConflictError', 409], //Duplicate data error
])

// returns error properties (errorName, errorMessage, etc) sent as a response
const getErrorProps = (err) => {
    const errProps = {
        status: 'fail',
        errorName: err.name || 'UnknownError',
        errorMessage: err.message || 'Something went wrong! please try again later',
        statusCode: err.statusCode || OPERATIONAL_ERRORS.get(err.name) || 500,
        isOperational: !!OPERATIONAL_ERRORS.get(err.name), //client causes this error (not a server bug)
        stack: err.stack, //stack trace
        error: err
    }

       // check for mongoDB duplication err
    if(err.code === 11000 && err.name === 'MongoServerError'){
        errProps.statusCode = 409; //duplication http code
        errProps.isOperational = true //client caused this error (not a server bug)
    }

    return errProps
}

//express passes the flow directly to this middleware
//whenever next() has a parameter except undefined
const GlobalErrorHandler = (err, req, res, next) => {
    console.log('Error:', err);

    // get error properties (errorName, errorMessage, etc)
    const errProps = getErrorProps(err)

    // if environment is set to development
    if (process.env.NODE_ENV === 'development')
     // return detailed error response in development mode
    return res.status(errProps.statusCode).json(errProps)

    // if environment is set to production
    else if (process.env.NODE_ENV === 'production') {
        const statusCode = errProps.statusCode;

        // get err message handler based on err type
        const messageHandler = prodErrorHandlers[err.name] || prodErrorHandlers[err.code]
        

        // call messageHandler to get the err message
        const message = messageHandler ? messageHandler(err) : 'Something went wrong! please try again later';    

        // return err response in production mode
        res.status(statusCode).json({
            status: 'fail',
            message
        })  
    }
}

export default GlobalErrorHandler