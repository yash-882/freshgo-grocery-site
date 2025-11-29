import UserModel from "../../models/user.js";
import CustomError from "../../error-handling/customError.js";
import sendApiResponse from "../../utils/apiResponse.js";
import { findUserByQuery } from "../../utils/helpers/auth.js";
import mongoose from "mongoose";
import CartModel from "../../models/cart.js";


// -------------------------------------------
// Only role with 'admin' can access the handlers
// -------------------------------------------

// get user by ID
export const getUserByID = async (req, res, next) => {
    const userID = req.params.id; //user ID

    // throws custom error if user not found
    const user = await findUserByQuery({ _id: userID }, true, 'User not found')

    // send user data
  sendApiResponse(res, 200, {
    data: user,
})

}

//  get multiple users
export const getUsers = async (req, res, next) => {
    
    const {filter, sort, limit, skip, select } = req.sanitizedQuery; //filter 

    // getting  multiple users
    const users = await UserModel.find(filter)
    .sort(sort)
    .skip(skip)
    .limit(limit)
    .select(select); 

    // send users data 
    sendApiResponse(res, 200, {
        data: users,
    })
}

// update user by ID
export const updateUserByID = async (req, res, next) => {
    const userID = req.params.id; // getting user id from params

    const updates = req.body 

    // set for pre schema hook
    updates.byAdmin = true

    if(updates.roles){
        // mongodb operator for pushing an element in array field 
        // (only inserts if the element doesn't exist in array)
        updates.$addToSet = {roles: updates.roles}

        // delete roles
        delete updates.roles
    }

    // updating user...
    const user = await UserModel.findByIdAndUpdate(userID, {$set: updates}, {
        new: true,
        runValidators: true
    })

    // user not found
    if (!user)
        return next(new CustomError('NotFoundError', 'User not found for updation', 404))


   // updated successfully
  sendApiResponse(res, 200, {
    data: user,
    message: 'User deleted successfully',
})
}

// update multiple users
export const updateUsers = async (req, res, next) => {
    const {filter} = req.sanitizedQuery; // getting user id from params

    const updates = req.body; //changes for updation
    
    // set for pre schema hook
    updates.byAdmin = true

    // updating users...
    const users = await UserModel.updateMany(filter, {$set: updates}, {
        new: true,
        runValidators: true
    })

    // no users found
    if (users.matchedCount === 0)
        return next(new CustomError('NotFoundError', 'No users found for updation', 404))

    // users updated successfully
    sendApiResponse(res, 200, {
        message: `Updated ${users.modifiedCount} user(s) successfully`,
    })
}

// delete a user by id
export const deleteUserByID = async (req, res, next) => {
    const userID = req.params.id; // getting user id from params

    let session;
    let user;

    try {

        // create a session for deletion
        session = await mongoose.startSession()

        // run transaction (mongoDB commits or aborts the transaction automatically)
        await session.withTransaction(async () => {

            // deleting user...
            user = await UserModel.findByIdAndDelete(userID).session(session)

            // user not found
            if (!user) {

                // throwing makes mongoDB to abort the transaction 
                throw new CustomError('NotFoundError', `User with ID: ${userID} not found for deletion`, 404)
            }

            // delete user cart
            await CartModel.findOneAndDelete({user: userID}).session(session)


        })

        // user deleted successfully
          sendApiResponse(res, 200, {
            data: user, //deleted user
            message: 'User deleted successfully',
        })
    }
    catch (err) {

        // error occured 
        next(err)

    } finally {

        if (session)
            session.endSession() // end transaction session
    }
}

// delete multiple user by filter
export const deleteUsers = async (req, res, next) => {
    const {filter, skip, limit} = req.sanitizedQuery; // getting user id from params

    let session;
    let deletionResult;

    try {
        // prevents from deleting all users 
              if (!filter || Object.keys(filter).length === 0) {
            throw new CustomError('BadRequestError', 'Filter is required to delete users!', 400);
        }

        // create a session for deletion
        session = await mongoose.startSession()

        // run transaction (mongoDB commits or aborts the transaction automatically)
        await session.withTransaction(async () => {

            // users to delete
              const usersToDelete = await UserModel.find(filter)
              .skip(skip)
              .limit(limit)
              .session(session);
            
              // no products found
              if (usersToDelete.length === 0) {
                 // throwing makes mongoDB to abort the transaction 
                  throw new CustomError('NotFoundError', `No users found for deletion`, 404)
              }
            
              // get IDs of all found users
              const usersIDs = usersToDelete.map(user => user._id)
              

            //   deleting users cart
              await CartModel.deleteMany({user: {$in: usersIDs}}).session(session)
            
              // deleting users in bulk
              deletionResult = await UserModel.deleteMany({ _id: { $in: usersIDs }}).session(session);
        })


        // users deleted successfully
          sendApiResponse(res, 200, {
            message: `Deleted ${deletionResult.deletedCount} user(s) successfully`,
        })
    }
    catch (err) {

        // error occured 
        next(err)

    } finally {

        if (session)
            session.endSession() // end transaction session
    }
}