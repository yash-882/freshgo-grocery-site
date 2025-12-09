const CustomError = require("../error-handling/customError");

// identifies whether the image input is a URL or Image (attaches the image data to req)
const validateImageInput = (req, res, next) => {

    const contentType = req.headers['content-type'];

    // is Form Data 
    if (contentType?.includes('multipart/form-data')) {
        
        if (!req.file)
            return next(new CustomError(
        'BadRequestError',
        'Image is required for identification.', 400));
    }
    
    // is JSON data
    else if (contentType?.includes('application/json')) {
        const imageURL = req.body.imageURL;
        const urlRegex = /^https?:\/\/[^\s]+$/i;

        if (!imageURL || !urlRegex.test(imageURL)) {

            const errMesssage = !imageURL ? 'Image URL is required for identification.' : 'Invalid image URL'

            return next(new CustomError('BadRequestError', errMesssage, 400));
        }
    }

    // invalid content-type
    else{
        return next(new CustomError('BadRequestError', 'Content-Type should be application/json or multipart/form-data.', 400));
    }

    const image = req.file || req.body.imageURL;

    // attach the image data
    req.imageData = {
        image,
        isURL: !req.file
    };

    next()
}

module.exports = validateImageInput;