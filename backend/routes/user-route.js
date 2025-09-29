import { Router } from 'express';
const userRouter = Router();
import { addAddress, deleteAddressByID, getMyProfile, updateAddressByID, updateMyProfile } from '../controllers/user-controller.js';
import { authorizeUser } from '../middlewares/auth-middleware.js';


// any authenticated user with any role(admin, user, seller) can access these routes

userRouter.use(authorizeUser)

userRouter.route('/me')
.get(getMyProfile) //get profile
.patch(updateMyProfile) //update profile

// CRUD for user's address

// add new address
userRouter.route('/me/address')
.post(addAddress) //add address

userRouter.route('/me/address/:id')
.patch(updateAddressByID) //update address
.delete(deleteAddressByID) //delete

export default userRouter;