import { Router } from 'express'

import {
    getUsers,
    updateUserByID,
    deleteUserByID,
    getUserByID,
    updateUsers,
    deleteUsers
} from '../controllers/user-controller.js';

import { authorizeUser, roleBasedAccess } from '../middlewares/auth-middleware.js';

const adminRouter = Router();

// apply authentication and admin check to all routes
adminRouter.use(authorizeUser, roleBasedAccess('admin'));

// operations for multiple user
adminRouter.route('/user-access')
    .get(getUsers)
    .patch(updateUsers)
    .delete(deleteUsers)

// operations for a single user
adminRouter.route('/user-access/:id')
    .get(getUserByID)
    .patch(updateUserByID)
    .delete(deleteUserByID )


export default adminRouter;