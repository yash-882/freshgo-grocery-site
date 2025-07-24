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
    ['ForbiddenError', 403] // Forbidden access error
])

// development errors, returns a detailed error response
const devResponse = (error, res) => {
    // error properties used in development mode

    const errorName = error.name || 'ServerError';
    const errorMessage = error.message || 'Something went wrong! please try again later';
    let statusCode = error.statusCode || OPERATIONAL_ERRORS.get(errorName) || 500;

    // find if the error is operational or not
    let isOperational = !!OPERATIONAL_ERRORS.get(errorName);

    // check for mongoDB duplication error
    if(error.code === 11000 && error.name === 'MongoServerError'){
        statusCode = 409; //duplication http code
        isOperational = true
    }
    
    // return error response in development mode
    return res.status(statusCode).json({
        status: 'fail',
        errorName,
        errorMessage,
        stack: error.stack, // native JS stack trace or manually added by CustomError class
        isOperational, // indicates if the error is operation or not
        error
    })
}

//express passes the flow directly to this middleware
//whenever next() has a parameter except undefined
const GlobalErrorHandler = (err, req, res, next) => {
    console.log('Error:', err);

    // if environment is set to development
    if (process.env.NODE_ENV === 'development')
        return devResponse(err, res)
    
}

export default GlobalErrorHandler