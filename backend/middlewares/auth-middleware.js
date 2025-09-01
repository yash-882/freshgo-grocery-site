import { bcryptCompare } from "../utils/auth-helpers.js"
import controllerWrapper from "../utils/controller-wrapper.js"
import { signAccessToken, verifyAccessToken, verifyRefreshToken } from "../utils/jwt-user-auth.js"
import CustomError from "../error-handling/custom-error-class.js"
import { findUserByQuery } from "../utils/auth-helpers.js"

//auth middlewares

// verify password middleware
export const verifyPassword = controllerWrapper(async (req, res, next) => {
    const {password} = req.body
    const user = req.user

    // throws custom error for password 
    await bcryptCompare({plain: password, hashed: user.password}, 'Incorrect password!')

    // password was correct, set verified to true
    req.verified = true;
    next()
})

// allow requests to protected routes based on role
// returns an async handler for express
export const roleBasedAccess = (role) => {
    return (req, res, next) => {
        const user = req.user; //get user 
    
        // invalid role
        if(!user.role.includes(role)){
            return next(new CustomError('ForbiddenError', 'Not allowed to this route!', 403))
        }
    
        // valid role for this request
        next()
    }
}

// validate fields (checks for required field)
// returns an async handler for express

export const checkRequiredFields = (requiredFields='no-fields') => {

    return (req, res, next) => {
        const enteredFields = req.body;

        // if body is empty
        if(Object.keys(enteredFields).length === 0)
          return next(
        new CustomError("BadRequestError", 'Please enter all required fields!', 400));

        // if only one field is required
        if(!Array.isArray(requiredFields)){
            
            // required field is not present in enteredFields
            if(!enteredFields[requiredFields.field])
                return next(new CustomError("BadRequestError", `${requiredFields.label} is required!`, 400  ))

            // field is present, jump to next handler
            return next()
        }


        // looping over required fields
        for(const {field: requiredField, label} of requiredFields){
        
        // checks if the required field is present in entered fields
        const field = enteredFields[requiredField]

        // prioritize boolean or number (because 0 or false is considered falsy)
        if(typeof field === 'boolean' || typeof field === 'number')
            continue; //valid field, jump to next field

        // field is missing
        const isMissing = field === undefined || field === null
        
        // string is empty
        const isEmptyString = typeof field === 'string' && !field.trim().length
        
        if(isMissing || isEmptyString){

            const errMessage = `${label} is required!`
            return next(new CustomError("BadRequestError", errMessage, 400));
        }  
    }

    // all required fields are present, jump to next handler
    next()
    }
};

// middleware to authorize user and allow access to protected routes
//additionally, it avoids login/signup requests if user is already logged in
export const authorizeUser = controllerWrapper(async (req, res, next) => {

    // get access and refresh tokens from cookies
    const {AT: accessToken, RT: refreshToken} = req.cookies;
    let user;
    const noTokens = !accessToken && !refreshToken;
    
    // checks for auth request (eg. /login, sign-up and sign-up-validation)
    const reqForAuth = /^\/(login|sign-up|sign-up-validation)$/.test(req.path)

    // if req is for auth and no tokens are provided, allow the request to continue
    if(noTokens && reqForAuth)
        return next(); 


    // verify access token, doesn't throw error on expiration
    const result = accessToken 
    ? 
    verifyAccessToken(accessToken) 
    : 
    {notProvided: true}

    // access token expired
    if(result.expired || result.notProvided){ 

        // check for refresh token
        if(!refreshToken)
            return next(
    new CustomError('UnauthorizedError', 'You are not logged in!', 401));


    // verify refresh token, throws error if the token is invalid/expired
    const decoded = verifyRefreshToken(refreshToken);

    //throws error if user is not found
    user = await findUserByQuery({_id: decoded.id}, true, 'Account may have been deleted!');

    // sign new access token
    const newToken = signAccessToken({id: user._id, role: user.role})
    
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

else{
    //throws error if user is not found
    user = await findUserByQuery({_id: result.decoded?.id}, true, 'Account may have been deleted!');
}

// at this point, user is found and access token is valid
// if req is for auth, don't allow login/signup and avoid token regeneration
if(reqForAuth) {
   return res.status(403).json({
        status: 'success',
        message: 'You are already logged in!'
    })
}

req.user = user; // attach user to the request object
next() //continue to the next middleware/controller

})