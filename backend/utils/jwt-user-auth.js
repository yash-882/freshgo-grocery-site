// THIS MODULE ONLY HANDLES
// USER AUTHENTICATION AND AUTHORIZATION
// IF THE ACCESS TOKEN IS EXPIRED, A NEW ONE CAN BE RE-ISSUED BY VALIDATING REFRESH TOKEN

import jwt from 'jsonwebtoken'

// sign access tokens
export function signAccessToken(payload) {
    return jwt.sign(payload, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: process.env.ACCESS_TOKEN_EXPIRES_IN
    })
}

// sign refresh tokens
export function signRefreshToken(payload) {
    return jwt.sign(payload, process.env.REFRESH_TOKEN_SECRET, {
        expiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN
    })
}


