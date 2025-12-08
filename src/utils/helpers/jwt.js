// THIS MODULE ONLY HANDLES
// USER AUTHENTICATION AND AUTHORIZATION
// IF THE ACCESS TOKEN IS EXPIRED, A NEW ONE CAN BE RE-ISSUED BY VALIDATING REFRESH TOKEN

const jwt = require('jsonwebtoken')

// sign access tokens
function signAccessToken(payload) {
    return jwt.sign(payload, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: process.env.ACCESS_TOKEN_EXPIRES_IN
    })
}

// sign refresh tokens
function signRefreshToken(payload) {
    return jwt.sign(payload, process.env.REFRESH_TOKEN_SECRET, {
        expiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN
    })
}


// verify access token
function verifyAccessToken(accessToken) {
    // for catching token expiration error and provide a new access token
    // after successful verification of refresh token
    try {

        // validate access token
        const decoded = jwt.verify(accessToken, process.env.ACCESS_TOKEN_SECRET)

        // validation successful, return decoded token
        return {
            expired: false, //token is not re-issued, means it was valid
            decoded //decoded token
        }

    } catch (err) {

        if (err.name === 'TokenExpiredError') {

            // indicates that the token is expired
            return {
                expired: true,
                decoded: null // no decoded token, as it was expired
        }

    }
    
    // if any JWT error except TokenExpiredError occurs, throw it
    throw err;
}
}

function verifyRefreshToken(token) {
    // validate refresh token
    const decoded = jwt.verify(token, process.env.REFRESH_TOKEN_SECRET)

    // validation successful, return decoded token
    return decoded
}

module.exports = { signAccessToken, signRefreshToken, verifyAccessToken, verifyRefreshToken };

