const { findUserByQuery, bcryptCompare } = require("../utils/helpers/auth.js")
const CustomError = require("../error-handling/customError.js")
const {
    signAccessToken,
    verifyRefreshToken,
    verifyAccessToken } = require("../utils/helpers/jwt.js")
const { getCachedData, storeCachedData } = require("../utils/helpers/cache.js")
const cacheKeyBuilders = require("../constants/cacheKeyBuilders.js")
const UserModel = require("../models/user.js")

// verify password middleware
const verifyPassword = async (req, res, next) => {
    const { password } = req.body
    const user = req.user

    // user has never used a local/password login
    if (user.auth.length === 1 && user.auth.includes('google')) {
        return next(new CustomError
            ('ForbiddenError',
                'This account is linked with Google. To set a password, please verify via OTP.',
                403
            ))
    }

    // throws custom error for password 
    await bcryptCompare({ plain: password, hashed: user.password }, 'Incorrect password!')

    // password was correct, set verified to true
    req.verified = true;
    next()
}

// allow requests to protected routes based on roles
// returns an async handler for express
const roleBasedAccess = (role) => {
    return (req, res, next) => {
        const user = req.user; //get user 

        // invalid role
        if (!user.roles.includes(role)) {
            return next(new CustomError('ForbiddenError', 'Not allowed to this route!', 403))
        }

        // valid roles for this request
        next()
    }
}

// validate fields (checks for required field)
// returns an async handler for express

const checkRequiredFields = (requiredFields = []) => {

    return (req, res, next) => {
        const enteredFields = Object.keys(req.body);
        const missingField = requiredFields.some(field => !enteredFields.includes(field))

        if (enteredFields.length === 0 || missingField) {
            return next(
                new CustomError('BadRequestError',
                    `Please input all the required fields: ${requiredFields.join(', ')}`,
                    400))
        }

        // all required fields are present, jump to next handler
        next()
    }
};

// middleware to authorize user and allow access to protected routes
//additionally, it avoids login/signup requests if user is already logged in
const authorizeUser = async (req, res, next) => {

    // get access and refresh tokens from cookies
    const { AT: accessToken, RT: refreshToken } = req.cookies;
    let user;
    const noTokens = !accessToken && !refreshToken;

    // checks for auth request (eg. /login, sign-up and sign-up-validation)
    const reqForAuth = /^\/(login|sign-up|sign-up-validation)$/.test(req.path)

    // if req is for auth and no tokens are provided, allow the request to continue
    if (noTokens && reqForAuth)
        return next();

    // find and set user in req.user
    const getAndSetUser = async (id) => {
        const cacheKey = cacheKeyBuilders.pvtResources(id)
        const cachedProfile = await getCachedData(cacheKey, 'profile')

        if (!cachedProfile) {
            req.user = await findUserByQuery({ _id: id }, true, 'Account may have been deleted!');

            // store in cache
            await storeCachedData(cacheKey, { data: req.user, ttl: 300 }, 'profile')
        }

        else {
            // converts the plain object to a mongoose document
            req.user = UserModel.hydrate(cachedProfile)
        }
    }


    // verify access token, doesn't throw error on expiration
    const result = accessToken
        ?
        verifyAccessToken(accessToken)
        :
        { notProvided: true }

    // access token expired
    if (result.expired || result.notProvided) {

        // check for refresh token
        if (!refreshToken)
            return next(
                new CustomError('UnauthorizedError', 'Login is required to access this route!', 401));


        // verify refresh token, throws error if the token is invalid/expired
        const decoded = verifyRefreshToken(refreshToken);

        await getAndSetUser(decoded.id) //sets req.user from cache or DB, throws err if not found

        // sign new access token
        const newToken = signAccessToken({ id: req.user._id, roles: req.user.roles })

        // parseInt stops parsing when 'd'(stands for days) is triggered,
        // and returns numbers of days in Number datatype
        // AT = Access Token
        const AT_AGE = parseInt(process.env.ACCESS_TOKEN_EXPIRES_IN) //in minutes

        // store access token in the browser cookies
        res.cookie('AT', newToken, {
            httpOnly: true,
            sameSite: 'strict',
            expires: new Date(Date.now() + AT_AGE * 60 * 1000), // minutes 
        });
    }

    else {
        await getAndSetUser(result.decoded?.id) //sets req.user from cache or DB, throws err if not found
    }

    // at this point, user is found and access token is valid
    // if req is for auth, don't allow login/signup and avoid token regeneration
    if (reqForAuth) {
        return res.status(403).json({
            status: 'success',
            message: 'You are already logged in!'
        })
    }

    next() //continue to the next middleware/controller

}

module.exports = {
    verifyPassword,
    roleBasedAccess,
    checkRequiredFields,
    authorizeUser
}