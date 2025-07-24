// THIS MODULE ONLY HANDLES
// USER AUTHENTICATION AND AUTHORIZATION
// IF THE ACCESS TOKEN IS EXPIRED, A NEW ONE CAN BE RE-ISSUED BY VALIDATING REFRESH TOKEN

import jwt from 'jsonwebtoken'

// sign access tokens
export function signAccessToken(payload) {
    return jwt.sign(payload, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN
    })
}

// sign refresh tokens
export function signRefreshToken(payload) {
    return jwt.sign(payload, process.env.REFRESH_TOKEN_SECRET, {
        expiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN
    })
}


// verify access token
export function verifyAccessToken(accessToken, refreshToken) {
    // for catching token expiration error and provide a new access token
    // after successful verification of refresh token
    try {

        // validate access token
        const decoded = jwt.verify(accessToken, process.env.ACCESS_TOKEN_SECRET)

        // validation successful, return decoded token
        return {
            isReissued: false, //token is not re-issued, means it was valid
            decoded //decoded token
        }

    } catch (err) {

        if (err.name === 'TokenExpiredError') {
            // throws error on all JWT verification errors
            verifyRefreshToken(refreshToken)

            //refresh token was valid, decode accessToken 
            const payload = jwt.decode(accessToken)

            // sign new access token
            const newToken = signAccessToken(payload)

            // return new access token
            // and indicate that the token was re-issued
            return {
                isReissued: true,
                newToken 
            }
        }

        // if any JWT error except TokenExpiredError occurs, throw it
        throw err;
    }
}

export function verifyRefreshToken(token) {
    // validate refresh token
    const decoded = jwt.verify(token, process.env.REFRESH_TOKEN_SECRET)

    // validation successful, return decoded token
    return decoded
}

