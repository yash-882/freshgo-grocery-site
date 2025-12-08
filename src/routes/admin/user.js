// user routes (Admin-only)

const { Router } = require('express')
const { handleQuery } = require('../../middlewares/query.js');
const { schemaRegistery } = require('../../constants/schemaRegistery.js');
const { 
    deleteUserByID, 
    deleteUsers, 
    getUserByID, 
    getUsers, 
    updateUserByID, 
    updateUsers } = require('../../controllers/admin/user.js');

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

module.exports = userRouter;