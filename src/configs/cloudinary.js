// Cloud storage for files (like image, video, etc.)
const { v2: cloudinary } = require('cloudinary')

// connect to cloudinary
cloudinary.config({
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME
 })

 module.exports = cloudinary;