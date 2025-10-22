// allow requests from the specified client origin and include credentials (like cookies) 
import cors from 'cors'

const setCors = () => {
    return cors({
        origin: process.env.ALLOWED_ORIGINS.split(','),
        credentials: true
    })
}

export default setCors;