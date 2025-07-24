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
    [11000, 409], //MongoDB duplication error
    ['JsonWebTokenError', 401], //JWT invalid token
    ['TooManyRequestsError', 429], // Too many requests error,
    ['BadRequestError', 400], // Bad request error
    ['UnauthorizedError', 401], // Unauthorized access error
    ['NotFoundError', 404],  // Resource not found error
    ['ForbiddenError', 403] // Forbidden access error
])

// development errors, returns a detailed error response
const devResponse = (err, res) => {
    // error properties used in development mode

    const errorName = err.name || 'ServerError';
    const errorMessage = err.message || 'Something went wrong! please try again later';
    let statusCode = err.statusCode || OPERATIONAL_ERRORS.get(errorName) || 500;

    // check for mongoDB duplication error
    if(err.code === 11000 && err.name === 'MongoServerError')
        statusCode = OPERATIONAL_ERRORS.get(err.code)
    
    // find if the error is operational or not
    const isOperational = !!OPERATIONAL_ERRORS.get(errorName || err.code);


    // return err response in development mode
    return res.status(statusCode).json({
        status: 'fail',
        errorName,
        errorMessage,
        stack: err.stack, // native JS stack trace or manually added by CustomError class
        isOperational // indicates if the error is operation or not
    })
}

//express passes the flow directly to this middleware
//whenever next() has a parameter except undefined
const GlobalErrorHandler = (err, req, res, next) => {
    console.log('Error:', err);

    // if environment is set to development
    if (process.env.NODE_ENV === 'development')
        return devResponse(err, res)

    // if environment is set to production
    else if (process.env.NODE_ENV === 'production') {
        const statusCode = err.statusCode || OPERATIONAL_ERRORS.get(err.name || err.code) || 500;

        // get error message handler based on error type
        const messageHandler = prodErrorHandlers[err.name || err.code]

        // call messageHandler to get the error message
        const message = messageHandler ? messageHandler(err) : 'Something went wrong! please try again later';    

        // return error response in production mode
        res.status(statusCode).json({
            status: 'fail',
            message
        })  
    }
}

export default GlobalErrorHandler