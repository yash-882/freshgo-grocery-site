// allow requests from the specified client origin and include credentials (like cookies) 
const cors = require('cors')

const setCors = () => {
    return cors({
        origin: process.env.ALLOWED_ORIGINS.split(','),
        credentials: true
    })
}

module.exports = setCors;