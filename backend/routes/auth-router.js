import { Router } from 'express';
import { login, signUp, authorizeUser, logout, changePassword } from '../controllers/auth-controller.js';

const authRouter = Router();

// middleware to authorize user and allow access to protected routes
// additionally, it avoids login/signup requests if user is already logged in
authRouter.use(authorizeUser)

// sign-up route
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
