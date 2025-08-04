import { Router } from 'express';
import { signUp } from '../controllers/auth-controller.js';


const authRouter = Router();

authRouter.route('/sign-up')
.post(signUp)

export default authRouter
