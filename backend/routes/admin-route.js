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
import { adminDeleteProductByID, adminDeleteProducts, adminUpdateProductByID, adminUpdateProducts, getProductByID, getProducts, updateMyProductByID } from '../controllers/product-controller.js';
import { handleQuery } from '../middlewares/query-middleware.js';
import { schemaRegistery } from '../constants/schema-registery.js';

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

// operations for multiple products
adminRouter.route('/product-access')
.get(handleQuery(schemaRegistery.product, true), getProducts)
.patch(handleQuery(schemaRegistery.product, true), adminUpdateProducts)
.delete(handleQuery(schemaRegistery.product, true), adminDeleteProducts)

// operations for a single product
adminRouter.route('/product-access/:id')
    .get(getProductByID)
    .patch(adminUpdateProductByID)
    .delete(adminDeleteProductByID )


export default adminRouter;