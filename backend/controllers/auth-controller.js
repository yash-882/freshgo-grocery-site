import controllerWrapper from "../utils/controller-wrapper.js";
import bcrypt from 'bcrypt';
import UserModel from "../models/user-model.js";
import CustomError from "../error-handling/custom-error-class.js";
import { signAccessToken, signRefreshToken } from "../utils/jwt-user-auth.js";
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