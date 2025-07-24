// Custom error class for creating operational errors
class CustomError extends Error {
  constructor(name, message, statusCode) {
    super(message);
    this.name = name;
    this.message = message;
    this.statusCode = statusCode;
    // This is an operational error, means caused by user input or application logic
    this.isOperational = true; 
    // add stack trace for debbugging 
    Error.captureStackTrace(this, this.constructor);
  }
}

export default CustomError