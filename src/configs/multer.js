const multer = require('multer')
const CustomError = require('../error-handling/customError.js')

function uploader({
    allowedFileFormats = ['jpeg', 'jpg', 'png'],
    fileSize = 1024 * 1024 * 1, // 1MB default
    fileType
}) {

  // runtime error 
    if(allowedFileFormats.length === 0){
        throw new Error('`allowedFileFormats` cannot be empty!');
    }

    // used for setup multer middleware
    const uploads = multer({
        storage: multer.memoryStorage(),
        limits: {
            fileSize, //max file size

            //max number of files (A product can have upto 5 images)
            files: process.env.BULK_CREATION_LIMIT_PER_REQUEST * 5
        },

        // check if file is an image
        fileFilter: (req, file, cb) => {

            //error on not-allowed mimetype  (mimetype eg: image/jpeg, video/mp4, etc)
            if (!file.mimetype.startsWith(fileType)) {
                return cb(new CustomError('BadRequestError', `Only ${fileType} files are allowed!`), false);
            }

            // error on not-allowed format (formats eg: .jpg, .pdf, etc)
            else if (!allowedFileFormats.includes(file.mimetype.split('/')[1])) {
                return cb(
                    new CustomError(
                        'BadRequestError',
                        `Only ${allowedFileFormats.join(', ')} files are allowed!`),
                    false);
            }

            else {
                cb(null, true);
            }
        }
    })

    return uploads;
}


module.exports = uploader;