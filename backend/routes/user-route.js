import { Router } from 'express';
const userRouter = Router();
import { 
    addAddress, 
    deleteAddressByID, 
    getMyProfile, 
    updateAddressByID, 
    updateMyProfile } from '../controllers/user-controller.js';
import { authorizeUser, roleBasedAccess } from '../middlewares/auth-middleware.js';
import { 
    revenueStats, 
    topFiveSellingProducts } from '../controllers/seller-dashboard/dashboard.js';


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


userRouter.use(roleBasedAccess('seller'))

// seller dashboard
userRouter.get('/dashboard/revenue-stats', revenueStats)

// top 5 selling products
userRouter.get('/dashboard/top-five-selling-products', topFiveSellingProducts)


export default userRouter;