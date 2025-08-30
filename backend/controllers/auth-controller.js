import controllerWrapper from "../utils/controller-wrapper.js";
import bcrypt, { hash } from 'bcrypt';
import UserModel from "../models/user-model.js";
import CustomError from "../error-handling/custom-error-class.js";
import { signAccessToken, signRefreshToken, verifyAccessToken, verifyRefreshToken } from "../utils/jwt-user-auth.js";
import { findUserByQuery, bcryptCompare, generateOTP, verifyOTP, trackOTPLimit } from "../utils/auth-helpers.js";
import client from "../configs/redis-client.js";
import sendEmail from "../utils/mailer.js";
import RedisService from "../utils/redis-service.js";

// signup user after OTP validation
export const signUp = controllerWrapper(async (req, res, next) => {
    const {email, OTP: enteredOTP} = req.body

    // a unique key is generated with the combination of 'purpose' and 'email' for Redis)
    const otpStore = new RedisService(email, 'SIGN_UP_OTP')
    
    // key stored in Redis 
    const OTP_KEY = otpStore.getKey();


    //returns the updated OTP data (or initializes it for the first request))
    //throws custom error if the request limit is exceeded or data is not found

    const OTPData = await trackOTPLimit({
        OTP_KEY,
        countType: 'attemptCount',
        limit: 5,
        errMessage: 'OTP attempts limit reached, try again later'
    })
    
    // update OTPData (updated attempts, continuing ttl)
    await otpStore.setShortLivedData(OTPData.user, OTPData.ttl)
    
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
    const body = req.body;

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

   
    // a unique key is generated with the combination of 'purpose' and 'email' for Redis
    const otpStore = new RedisService(body.email, 'SIGN_UP_OTP')
    
    // OTP key
    const OTP_KEY = otpStore.getKey();

    //returns the updated OTP data (or initializes it for the first request))
    //throws custom error if the request limit is exceeded
    const OTPData = await trackOTPLimit({
        OTP_KEY, //key stored in Redis
        countType: 'reqCount', //limit for requests
        limit: 7, //only 7 requests can be made for OTP request
        errMessage: 'OTP requests limit reached, try again later' //err message (if occurs)
    })

    // create a new mongoose document (not saved)
    const newUser = new UserModel({
        ...body, 
        role: ['user'] //force role to 'user'
    })

    // validate user fields, throws error if any field is invalid
    await newUser.validate()

    const OTP = generateOTP(6)
    const hashedOTP = await bcrypt.hash(OTP, 10)

    
    // sending user an OTP via email
    await sendEmail(body.email, 'Verification for sign up', `Verification code: ${OTP}`)

    // temporarily (ttl example: 300 -> 5 minutes) store the user in Redis for OTP data for verification 
    await otpStore.setShortLivedData({
        name: body.name,
        email: body.email,
        password: body.password,
        OTP: hashedOTP,
        reqCount: OTPData.user.reqCount // request count
    }, 300)

    // OTP successfully sent
    res.status(201).json({
        status: 'success',
        message: 'OTP sent to your email',
        email: body.email //attach email so the frontend can reuse it in the sign-up flow
})
})

// login controller
export const login = controllerWrapper(async (req, res, next) => {
    const {email, password} = req.body;

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
    const {currentPassword, newPassword, confirmNewPassword} = req.body;

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

// request OTP to change the password
export const resetPassword = async (req, res, next) => {

    // get email from body
    const {email} = req.body || {}

    // finds user in DB, throws error if not found 
    await findUserByQuery({email}, true, 'Email is not registered with us!')

    const OTP = generateOTP(6)
    const hashedOTP = await bcrypt.hash(OTP, 10)


    // a unique key is generated with the combination of 'purpose' and 'email' for Redis
    const otpStore = new RedisService(email, 'RESET_PASSWORD_OTP')
    // OTP key
    const OTP_KEY = otpStore.getKey()

    //returns the updated OTP data (or initializes it for the first request))
    //throws custom error if the request limit is exceeded
    const OTPData = await trackOTPLimit({
        OTP_KEY, //key stored in Redis
        countType: 'reqCount', //limit for requests
        limit: 7, //only 7 requests can be made for OTP request
        errMessage: 'OTP requests limit reached, try again later' //err message (if occurs)
    })
    
    // sending user an OTP via email
    await sendEmail(email, 'Reset password', `Use this code to reset password: ${OTP}`)
    
    //temporarily (ttl example: 300 -> 5 minutes) store the user in Redis for OTP data for verification 
    await otpStore.setShortLivedData({
        email,
        OTP: hashedOTP,
        reqCount: OTPData.user.reqCount // request count
    }, 300)

    // OTP successfully sent
    res.status(201).json({
        status: 'success',
        message: 'OTP sent to your email',
        email //attach email so the frontend can reuse it in the sign-up flow
})
}

// verifies the OTP and change password
export const verifyPasswordResetOTP = controllerWrapper(async (req, res, next) => {

    const {OTP: enteredOTP, email} = req.body;

    // a unique key is generated with the combination of 'purpose' and 'email' for Redis
    const otpStore = new RedisService(email, 'RESET_PASSWORD_OTP')
    const OTP_KEY = otpStore.getKey()
    
    //returns the updated OTP data (or initializes it for the first request))
    //throws custom error if the request limit is exceeded or data is not found
    const OTPData = await trackOTPLimit({
        OTP_KEY, //key stored in Redis
        countType: 'attemptCount', //limit for requests
        limit: 5, //only 5 requests can be made for OTP request
        errMessage: 'OTP attempts limit reached, try again later' //err message (if occurs)
    })
    
    //update attempts...
    await otpStore.setShortLivedData({
        ...OTPData.user, 
        attemptCount: OTPData.user.attemptCount //updated attempts
    }, 300)
    

    //verifies OTP and returns verified user, throws error for expiration and wrong attempts
    await verifyOTP(OTP_KEY, enteredOTP)

    // OTP was correct delete the user from Redis
    await otpStore.deleteData(OTP_KEY)
    
    // a unique key is generated with the combination of 'purpose' and 'email' for Redis
    const tokenStore = new RedisService(email, 'RESET_PASSWORD_TOKEN')

    // token to store
    const token = {email, purpose: 'RESET_PASSWORD_TOKEN', verified: true}
    
    // storing token for changing the password (allows user to change the password)
    await tokenStore.setShortLivedData(token, 300)
    

    // user is now allowed to modify their password
    res.status(201).json({message: 'OTP was correct', email})
})

// resets password using a valid password reset token
export const submitNewPassword = controllerWrapper(async (req, res, next) => {

    const {email, newPassword, confirmNewPassword} = req.body 

     // a unique key is generated with the combination of 'purpose' and 'email' for Redis
    const tokenStore = new RedisService(email, 'RESET_PASSWORD_TOKEN')
    const TOKEN_KEY = tokenStore.getKey()

    // find if token is stored in Redis
    const tokenData = await tokenStore.getData(TOKEN_KEY);

    //if user has not a valid token 
    if(!tokenData || !tokenData.verified || tokenData.purpose !== 'RESET_PASSWORD_TOKEN'){
          return next(
    new CustomError('UnauthorizedError', 'Session has been expired or not valid!', 401));
    }

    // if these fields does not match
    if(newPassword !== confirmNewPassword){
        return next(
    new CustomError('BadRequestError', 'Please confirm your password correctly', 400));
    }

    //query DB for user, throws error if not found
    const user = await findUserByQuery({email}, true, 'Account may have been deleted')


    // if new password is same as the current password
    const isNewPasswordSame = await bcrypt.compare(newPassword, user.password);
    
    if(isNewPasswordSame) {
        return next(
    new CustomError('BadRequestError', 'Password must be different from the previous one', 400));
    }

    // assign new password
    user.password = newPassword 

    //save user document, pre-save hook will hash the password
    await user.save()

    // delete token from Redis
    await tokenStore.deleteData(TOKEN_KEY)

    // password changed 
    res.status(200).json({
        status: 'success',
        message: 'Password changed successfully'
    })

})

export const requestEmailChange = async (req, res, next) => {
    const user = req.user; //ensure user is authenticated
    const { newEmail } = req.body;

    // Check if email already exists
    const existing = await UserModel.findOne({ email: newEmail });
    if (existing) {
      return next(new CustomError("ConflictError", "Email already in use", 409));
    }

    // validating new email
    await new UserModel({email: newEmail}).validate(['email'])

    const otpStore = new RedisService(user.email, "EMAIL_CHANGE_OTP");
    const OTP_KEY = otpStore.getKey()

        //returns the updated OTP data (or initializes it for the first request))
    //throws custom error if the request limit is exceeded
    const OTPData = await trackOTPLimit({
        OTP_KEY, //key stored in Redis
        countType: 'reqCount', //limit for requests
        limit: 7, //only 7 requests can be made for OTP request
        errMessage: 'OTP requests limit reached, try again later' //err message (if occurs)
    })

    // Create Redis key
    const OTP = generateOTP(6) // 6 digit OTP
    const hashedOTP = await bcrypt.hash(OTP, 10)

    // Store OTP, userID and newEmail
    await otpStore.setShortLivedData({ 
        OTP: hashedOTP, 
        newEmail, 
        reqCount: OTPData.user.reqCount //updated count
    }, 300); // 5 min TTL

    // Send OTP to new email
    await sendEmail(newEmail, 'Change email', `Use this OTP to change email: ${OTP}`);

    res.status(200).json({ message: "OTP sent to new email for verification" });
}


// verifies the OTP and change password
export const changeEmailWithOTP = controllerWrapper(async (req, res, next) => {

    const user = req.user; //ensure user is authenticated

    const {OTP: enteredOTP} = req.body;

    // a unique key is generated with the combination of 'purpose' and 'email' for Redis
    const otpStore = new RedisService(user.email, 'EMAIL_CHANGE_OTP')
    const OTP_KEY = otpStore.getKey()

    
    //returns the updated OTP data (or initializes it for the first request))
    //throws custom error if the request limit is exceeded or data is not found
    const OTPData = await trackOTPLimit({
        OTP_KEY, //key stored in Redis
        countType: 'attemptCount', //limit for requests
        limit: 5, //only 5 requests can be made for OTP request
        errMessage: 'OTP attempts limit reached, try again later' //err message (if occurs)
    })
    
    //update attempts...
    await otpStore.setShortLivedData({
        ...OTPData.user, 
        attemptCount: OTPData.user.attemptCount //updated attempts
    }, 300)
    

    //verifies OTP and returns verified user, throws error for expiration and wrong attempts
    await verifyOTP(OTP_KEY, enteredOTP)

    // OTP was correct, update the email
    user.email = OTPData.user.newEmail

    // save updated user to DB
    await user.save()

    // delete OTPData from Redis
    await otpStore.deleteData(OTP_KEY)
    
    res.status(201).json({
        status: 'success', 
        message: 'Email updated successfully', 
        email: user.email
    })
})


// validate fields (checks for required field)
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