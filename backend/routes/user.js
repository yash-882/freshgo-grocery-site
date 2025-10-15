import { Router } from 'express';
const userRouter = Router();
import { 
    addAddress, 
    deleteAddressByID, 
    getMyProfile, 
    updateAddressByID, 
    updateMyProfile } from '../controllers/user.js';
import { authorizeUser, roleBasedAccess } from '../middlewares/auths.js';
import { 
    categoryStats, 
    revenueComparison, 
    revenueStats, 
    topFiveSellingProducts } from '../controllers/seller/dashboard.js';


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

// category-wise stats
userRouter.get('/dashboard/category-stats', categoryStats)

// current period vs previous period
userRouter.get('/dashboard/revenue-comparison/:comparison', revenueComparison)


export default userRouter;