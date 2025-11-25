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
    .get(handleQuery(schemaRegistery.user), getUsers)
    .patch(handleQuery(schemaRegistery.user), updateUsers)
    .delete(handleQuery(schemaRegistery.user), deleteUsers)

// operations for a single user
userRouter.route('/:id')
    .get(getUserByID)
    .patch(updateUserByID)
    .delete(deleteUserByID)

export default userRouter;