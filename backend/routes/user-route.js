import { Router } from 'express';
const userRouter = Router();
import { getMyProfile, updateMyProfile } from '../controllers/user-controller.js';
import { authorizeUser } from '../middlewares/auth-middleware.js';


// any authenticated user with any role(admin, user, seller) can access these routes

userRouter.use(authorizeUser)

userRouter.route('/')
.get(getMyProfile) //get profile
.patch(updateMyProfile) //update profile

export default userRouter;