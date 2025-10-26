import multer from 'multer'
import cloudinary from './cloudinary.js'
import { CloudinaryStorage } from 'multer-storage-cloudinary'
import CustomError from '../error-handling/customError.js'

function uploader({
    allowedFileFormats = [],
    saveFormat, 
    fileSize = 1024 * 1024 * 1, // 1MB default
    folder = 'default',
    fileType = 'unknown'
}) {

  // runtime error 
    if(allowedFileFormats.length === 0){
        throw new Error('`allowedFileFormats` cannot be empty!');
    }

    // runtime error
    if(!allowedFileFormats.includes(saveFormat)){
        throw new Error('`saveFormat` must be one of `allowedFileFormats`');
    }

    // cloudinary storage for multer
    const storage = new CloudinaryStorage({
        cloudinary: cloudinary,
        params: () =>  {
            return {
                folder: folder, //folder in Cloudinary
                format: saveFormat, // tells cloudinary to convert all files to the specified format
            }
        },
    })

    // used for setup multer middleware
    const uploads = multer({
        storage,
        limits: {
            fileSize, //max file size
            files: 5 //max number of files
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


export default uploader;