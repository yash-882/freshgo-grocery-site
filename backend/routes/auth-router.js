import { Router } from 'express';
const authRouter = Router();

import { 
    login, 
    authorizeUser, 
    logout, 
    changePassword,
    validateForSignUp, 
    signUp,
    resetPassword,
    verifyPasswordResetOTP,
    submitNewPassword, } from '../controllers/auth-controller.js';


//request OTP to reset password 
authRouter.route('/reset-password')
.post(resetPassword)

// verifies OTP
authRouter.route('/reset-password/verify')
.post(verifyPasswordResetOTP)

// reset password using a valid password reset token
authRouter.route('/reset-password/submit')
.patch(submitNewPassword)


// middleware to authorize user and allow access to protected routes
// additionally, it avoids login/signup requests if user is already logged in
authRouter.use(authorizeUser)

// validates user fields for sign-up and sends OTP for further verification 
authRouter.route('/sign-up-validation')
.post(validateForSignUp)

// sign-up the user after verifying the OTP
authRouter.route('/sign-up')
.post(signUp)

// login route
authRouter.route('/login')
.post(login)

// PROTECTED ROUTES:

// change password route
authRouter.route('/change-password')
.patch(changePassword)

// logout route 
authRouter.route('/logout')
.post(logout)

export default authRouter
