import sendApiResponse from "../utils/apiResponse.js";

// Root route
export const apiRoot = (req, res, next) => 
    sendApiResponse(res, 200, {
        message: 'API is working. Visit /api for available endpoints.'
    })

// returns available API endpoints
export const getApiRoutes = (req, res, next) =>
    sendApiResponse(res, 200, {
        message: 'You can navigate through these routes.',
        data: {
            publicRoutes: ['/api/products'],
            protectedRoutes: ['/api/users', '/api/carts', '/api/orders', '/api/admins'],
        }
    })

