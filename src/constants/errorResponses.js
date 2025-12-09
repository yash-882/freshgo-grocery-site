// Object stores methods (as property values) for different error types, where
// each method generates error messages for the production environment

const prodErrorHandlers = {
    // mongoose cast error
    CastError: err =>  `Invalid ${err.path || 'field'}`,

    // mongoose validation error
    ValidationError: err => {
        // extract error messsages for each field and return array of messages
    const errors = Object.values(err.errors).map(el => el.message);
    // convert array of messages to a single string
    const message = errors.join(', ')
    return message;
    },

    // Unauthorized error
    UnauthorizedError: err => err.message || "You aren't authorized, please login",

    // JWT error
    JsonWebTokenError: () => 'Invalid token!',
    
    // mongoose duplication error
    11000: err => {
        const duplicateField = Object.keys(err.keyValue).join(', ')
        // convert the field case to TitleCase
        const fieldName = duplicateField[0].toUpperCase() + 
        duplicateField.slice(1, duplicateField.length)

        return `${fieldName} is already in use`
    },

    // bad request error
    BadRequestError: err => err.message || 'Missing fields or invalid types',

    // too many requests sent
    TooManyRequestsError: err => err.message || 'Too many requests, please try again later',

    // JWT expired error
    TokenExpiredError: () => 'Session has been expired. Please login again',

    // Not found error
    NotFoundError: err => err.message || 'Content not found',

    // Not allowed error
    ForbiddenError: err => err.message || 'You do not have permission to access this resource',

    // conflict error (duplication)
    ConflictError: err => err.message || 'This field is already taken',

    MulterError: err => {
        switch (err.code){
            case 'LIMIT_UNEXPECTED_FILE':
                return 'File field name is invalid!'

            case 'LIMIT_FILE_SIZE':
                return 'File size is too large.'

            case 'LIMIT_FILE_COUNT':
                return 'Too many files uploaded!'

            case 'MISSING_FIELD_NAME':
                return 'File field name is missing!'
            
            default:
                return 'Something went wrong with file upload!'
        }
    },

    // Invalid ObjectId
    BSONError: err => 'Invalid ID provided in body or params'
}

module.exports = prodErrorHandlers;
