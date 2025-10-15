// user routes (Admin-only)

import { Router } from 'express'
import { handleQuery } from '../../middlewares/query.js';
import { schemaRegistery } from '../../constants/schemaRegistery.js';
import { 
    deleteUserByID, 
    deleteUsers, 
    getUserByID, 
    getUsers, 
    updateUserByID, 
    updateUsers } from '../../controllers/admin/user.js';

const userRouter = Router();

// operations for multiple user
userRouter.route('/')
    .get(handleQuery(schemaRegistery.user, true), getUsers)
    .patch(handleQuery(schemaRegistery.user, true), updateUsers)
    .delete(handleQuery(schemaRegistery.user, true), deleteUsers)

// operations for a single user
userRouter.route('/:id')
    .get(getUserByID)
    .patch(updateUserByID)
    .delete(deleteUserByID)

export default userRouter;