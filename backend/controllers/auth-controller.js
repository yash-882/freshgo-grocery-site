import controllerWrapper from "../utils/controller-wrapper.js";
import bcrypt from 'bcrypt';
import UserModel from "../models/user-model.js";
import CustomError from "../error-handling/custom-error-class.js";
import { signAccessToken, signRefreshToken, verifyAccessToken, verifyRefreshToken } from "../utils/jwt-user-auth.js";
import { findUserByQuery, bcryptCompare, generateOTP, verifyOTP } from "../utils/auth-helpers.js";
import client from "../configs/redis-client.js";
import sendEmail from "../utils/mailer.js";

// signup user after OTP validation
export const signUp = controllerWrapper(async (req, res, next) => {
    const {email, OTP: enteredOTP} = req.body || {}
    
    if(!email || !enteredOTP)
        return next(
    new CustomError('BadRequestError', 'Email or OTP is missing!', 400))

    // req.path specifies the action(already saved in Redis) made for OTP generation (eg. /change-password, /change-email)
    const action = req.path.slice(1, req.path.length) //(/current-action -> current-action)

    //key saved in Redis (used to retrieve the stored user and OTP)
    const OTP_KEY = `${action}:${email}`

    // verifies OTP and returns verified user, throws error for expiration and wrong attempts
    const verifiedUser = await verifyOTP(OTP_KEY, enteredOTP)
    
    
    // OTP was correct, create user
    const newUser = new UserModel(verifiedUser);
    
    //save user document, pre-save hook will hash the password
    await newUser.save() 
    
    // clear temporary user from redis
    client.del(verifiedUser.email)
    
// tokens properties AT = Access Token, RT = Refresh Token
    const tokens = {
        AT: signAccessToken({
            id: newUser._id, 
            role: newUser.role
        }),
        RT: signRefreshToken({
            id: newUser._id, 
            role: newUser.role
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
    newUser.password = undefined

    // send response
    res.status(201).json({
        status: 'success',
        message: 'Account created successfully',
        data: {
            user: newUser,
        }
    });

    // send welcome email after sign-up
    await sendEmail(newUser.email, 'Welcome to FreshGo', 
        "Welcome to FreshGo! Your account has been created successfully. Start exploring fresh groceries today. – The FreshGo Team"
    )
})

// sign-up controller
export const validateForSignUp = controllerWrapper(async (req, res, next) => {
    const body = req.body || {};

    // if form body is missing, throw an error
    if(!body.name || !body.email || !body.password || !body.confirmPassword)
        return next(
    new CustomError('BadRequestError', 'Please enter all required fields!', 400));

    // if password is not confirmed correctly
    if(body.password !== body.confirmPassword)
        return next(
    new CustomError('BadRequestError', 'Please confirm your password correctly', 400));

    const user = await findUserByQuery({email: body.email}, false)

    // if the email is already registered with another account
    if(user){
        return next(
    new CustomError('ConflictError', 'Email is already taken!', 409));
    }

    // create a new mongoose document (not saved)
    const newUser = new UserModel(body)

    // validate user fields, throws error if any field is invalid
    await newUser.validate()

    const OTP = generateOTP(6)
    const hashedOTP = await bcrypt.hash(OTP, 10)

// temporarily (300 -> 5 minutes) store the user in Redis for OTP verification 
// always prefix (only for OTP verification request) the Redis key 
// with the API route path (without "/") of the next route handler where the OTP will be verified
//this helps Redis to differentiate OTP requests for the same email across routes (e.g., /sign-up, /change-password)
// example: /sign-up → sign-up:<email>, /change-password → change-password:<email>
    await client.setEx(`sign-up:${body.email}`, 300, JSON.stringify({
        name: body.name,
        email: body.email,
        password: body.password,
        OTP: hashedOTP
    }))

    // sending user an OTP via email
    await sendEmail(body.email, 'Verification for sign up', `Verification code: ${OTP}`)

    // OTP successfully sent
    res.status(201).json({
        status: 'success',
        message: 'OTP sent to your email',
        email: body.email //attach email so the frontend can reuse it in the sign-up flow
})
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

    // validate password, throws custom error if incorrect
    await bcryptCompare({
        plain: password, 
        hashed: user.password
    }, 'Incorrect password!');

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

export const logout = controllerWrapper(async (req, res, next) => {

    // clear all tokens
    res.clearCookie('AT', { httpOnly: true, sameSite: 'strict'})
    res.clearCookie('RT', { httpOnly: true, sameSite: 'strict'})

    // user logged out successfully
    res.status(201).json({
        status: 'success',
        message: 'Logged out successfully'
    })

})

export const changePassword = controllerWrapper(async (req, res, next) => {
    const {currentPassword, newPassword, confirmNewPassword} = req.body || {};

    // if any required field is missing, throw an error
    if(!currentPassword || !newPassword || !confirmNewPassword)
        return next(
    new CustomError('BadRequestError', 'Please enter all required fields!', 400));

    const user = req.user; // get user from request object

    // if new password is not confirmed correctly
    if(newPassword !== confirmNewPassword) {
        return next(
    new CustomError('BadRequestError', 'Please confirm your new password correctly', 400));
    }

    
    // validate current password, throws custom error if incorrect
    await bcryptCompare({
        plain: currentPassword, 
        hashed: user.password
    }, 'Incorrect current password!');

    // if new password is same as the current password
    const isNewPasswordSame = await bcrypt.compare(newPassword, user.password);
    
    if(isNewPasswordSame) {
        return next(
    new CustomError('BadRequestError', 'Password must be different from the previous one', 400));
    }
    
    // assigning new password
    user.password = newPassword;

    // save user document, pre-save hook will hash the password and save the updated user
    await user.save();

    user.password = undefined; // remove password from the response

    // change password successfully
    res.status(200).json({
        status: 'success',
        message: 'Password changed successfully',
        data: {
            user
        }
    });
})