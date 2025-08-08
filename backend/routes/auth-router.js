import { Router } from 'express';
import { authorizeUser, login, signUp } from '../controllers/auth-controller.js';


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

export default authRouter
