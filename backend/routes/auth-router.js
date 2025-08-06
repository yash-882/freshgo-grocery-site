import { Router } from 'express';
import { login, signUp } from '../controllers/auth-controller.js';


const authRouter = Router();

// sign-up route
authRouter.route('/sign-up')
.post(signUp)

// login route
authRouter.route('/login')
.post(login)

export default authRouter
