import controllerWrapper from "../utils/controller-wrapper.js";
import bcrypt from 'bcrypt';
import UserModel from "../models/user-model.js";
import CustomError from "../error-handling/custom-error-class.js";
import { signAccessToken, signRefreshToken, verifyAccessToken, verifyRefreshToken } from "../utils/jwt-user-auth.js";
import { findUserByQuery } from "../utils/auth-helpers.js";

// sign-up controller
export const signUp = controllerWrapper(async (req, res, next) => {
    const body = req.body;

    // if form body is missing, throw an error
    if(!body || Object.keys(body).length === 0)
        return next(
    new CustomError('BadRequestError', 'Please enter all required fields!', 400));

    // if password is not confirmed correctly
    if(password !== confirmPassword)
        return next(
    new CustomError('BadRequestError', 'Please confirm your password correctly', 400));
    

    // create a new user
    const createdUser = await UserModel.create({
        name: body.name,
        email: body.email,
        password: body.password,
        role: body.role
    });

// tokens properties AT = Access Token, RT = Refresh Token
    const tokens = {
        AT: signAccessToken({
            id: createdUser._id, 
            role: createdUser.role
        }),
        RT: signRefreshToken({
            id: createdUser._id, 
            role: createdUser.role
        }),

    // parseInt stops parsing when 'd'(stands for days) is triggered,
    // and returns numbers of days in Number datatype
        AT_AGE: parseInt(process.env.ACCESS_TOKEN_EXPIRES_IN), //in minutes
        RT_AGE: parseInt(process.env.REFRESH_TOKEN_EXPIRES_IN) //in days
    } 

    // store tokens in the browser cookies
    res.cookie('AT', tokens.AT, {
        httpOnly: true,
        sameSite: 'strict',
        expires: new Date(Date.now() + tokens.AT_AGE * 60 * 1000), // minutes 
    });

    res.cookie('RT', tokens.RT, {
        httpOnly: true,
        sameSite: 'strict',
        expires: new Date(Date.now() + tokens.RT_AGE * 24 * 60 * 60 * 1000), // days
    });

    // delete password before responding
    createdUser.password = undefined

    // send response
    res.status(201).json({
        status: 'success',
        data: {
            user: createdUser
        }
    });
})

// login controller
export const login = controllerWrapper(async (req, res, next) => {
    const {email, password} = req.body || {};

    // if any required field is missing, throw an error
    if(!email || !password)
        return next(
    new CustomError('BadRequestError', 'Please enter all required fields!', 400));

   // check if user exists in DB with the given email
    const user = await findUserByQuery({email}, true, 'Email is not registered with us!');

    const isPasswordCorrect =  await bcrypt.compare(password, user.password)

    if(!isPasswordCorrect){
        return next(
    new CustomError('UnauthorizedError', 'Incorrect password!', 401));
    }

    // password was correct, sign tokens
    // tokens properties AT = Access Token, RT = Refresh Token
    const tokens = {
        AT: signAccessToken({
            id: user._id, 
            role: user.role
        }),
        RT: signRefreshToken({
            id: user._id, 
            role: user.role
        }),

    // parseInt stops parsing when 'd'(stands for days) is triggered,
    // and returns numbers of days in Number datatype
        AT_AGE: parseInt(process.env.ACCESS_TOKEN_EXPIRES_IN), //in minutes
        RT_AGE: parseInt(process.env.REFRESH_TOKEN_EXPIRES_IN) //in days
    } 

    // store tokens in the browser cookies
    res.cookie('AT', tokens.AT, {
        httpOnly: true,
        sameSite: 'strict',
        expires: new Date(Date.now() + tokens.AT_AGE * 60 * 1000), // minutes 
    });

    res.cookie('RT', tokens.RT, {
        httpOnly: true,
        sameSite: 'strict',
        expires: new Date(Date.now() + tokens.RT_AGE * 24 * 60 * 60 * 1000), // days
    });

    // delete password before responding
    user.password = undefined

    //logged in successfully, send response
    res.status(201).json({
        status: 'success',
        data: {
            user
        }
    });

})


// middleware to authorize user and allow access to protected routes
//additionally, it avoids login/signup requests if user is already logged in
export const authorizeUser = controllerWrapper(async (req, res, next) => {

    // get access and refresh tokens from cookies
    const {AT: accessToken, RT: refreshToken} = req.cookies;
    let user;
    const noTokens = !accessToken && !refreshToken;
    
    // check for auth request
    const reqForAuth = req.path === '/login' || req.path === '/sign-up'

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
