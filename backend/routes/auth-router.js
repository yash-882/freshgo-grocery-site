import { Router } from 'express';
const authRouter = Router();

import { 
    login, 
    logout, 
    changePassword,
    validateForSignUp, 
    signUp,
    resetPassword,
    verifyPasswordResetOTP,
    submitNewPassword,
    changeEmailWithOTP,
    requestEmailChange,
    deleteMyAccount,
    googleAuthCallback, } from '../controllers/auth-controller.js';
import {authRequiredFields} from '../constants/required-fields.js';

// middlewares
import { 
    authorizeUser, 
    checkRequiredFields, 
    verifyPassword } from '../middlewares/auth-middleware.js';
    import passport from 'passport';
    
// entry point of google authentication 
authRouter.route('/google')
.get(passport.authenticate('google', {scope: ['profile', 'email']}))
 
// handles success or failure, executes after google verifies the user and client(App)
authRouter.route('/google/callback')
.get(googleAuthCallback)
    
//request OTP for reset password 
authRouter.route('/reset-password')
.post(checkRequiredFields(authRequiredFields.resetPassword), resetPassword)

// verifies OTP
authRouter.route('/reset-password/verify')
.post(checkRequiredFields(authRequiredFields.verifyPasswordResetOTP), verifyPasswordResetOTP)

// reset password using a valid password reset token
authRouter.route('/reset-password/submit')
.patch(checkRequiredFields(authRequiredFields.submitNewPassword), submitNewPassword)


// middleware to authorize user and allow access to protected routes
// additionally, it avoids login/signup requests if user is already logged in
authRouter.use(authorizeUser)


// validates user fields for sign-up and sends OTP for further verification 
authRouter.route('/sign-up-validation')
.post(checkRequiredFields(authRequiredFields.validateForSignUp), validateForSignUp)

// sign-up the user after verifying the OTP
authRouter.route('/sign-up')
.post(checkRequiredFields(authRequiredFields.signUp), signUp)

// login route
authRouter.route('/login')
.post(checkRequiredFields(authRequiredFields.login), login)

// PROTECTED ROUTES:

// request OTP for changing email
authRouter.route('/change-email/request')
.post(checkRequiredFields(authRequiredFields.requestEmailChange), requestEmailChange)

// verify OTP to change email
authRouter.route('/change-email/verify')
.patch(checkRequiredFields(authRequiredFields.changeEmailWithOTP), changeEmailWithOTP) 

// change password route
authRouter.route('/change-password')
.patch(checkRequiredFields(authRequiredFields.changePassword), changePassword)

// delete my account route
authRouter.route('/delete-account').post(
checkRequiredFields(authRequiredFields.verifyPassword), 
verifyPassword, 
deleteMyAccount)


// logout route 
authRouter.route('/logout')
.post(logout)

export default authRouter
