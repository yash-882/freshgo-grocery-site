// This user-controller provides separate handlers for admin and non-admin roles

import UserModel from "../models/user-model.js";
import CustomError from "../error-handling/custom-error-class.js";
import controllerWrapper from "../utils/controller-wrapper.js";
import { findUserByQuery } from "../utils/auth-helpers.js";
import mongoose from "mongoose";

// -------------------------------------------
// Only role with 'admin' can access the handlers below
// -------------------------------------------

// get user by ID
export const getUserByID = controllerWrapper(async (req, res, next) => {
    const userID = req.params.id; //user ID

    // throws custom error if user not found
    const user = await findUserByQuery({ _id: userID }, true, 'User not found')

    // send response
    res.status(200).json({
        status: 'success',
        data: { user }
    })
})

//  get multiple users
export const getUsers = controllerWrapper(async (req, res, next) => {
    
    const query = req.query; //filter or {}

    // getting all users
    const users = await UserModel.find(query);

    // send response 
    res.status(200).json({
        status: 'success',
        message: users.length === 0 ? 'No users found' : `${users.length} users found`,
        data: {
            dataLength: users.length,
            users 
        }
    })
})

// update user by ID
export const updateUserByID = controllerWrapper(async (req, res, next) => {
    const userID = req.params.id; // getting user id from params

    const updates = req.body 
   

    if(updates.role){
        // mongodb operator for pushing an element in array field 
        // (only inserts if the element doesn't exist in array)
        updates.$addToSet = {role: updates.role }

        // delete role
        delete updates.role
    }

    // updating user...
    const user = await UserModel.findByIdAndUpdate(userID, updates, {
        new: true,
        runValidators: true
    })

    // user not found
    if (!user)
        return next(new CustomError('NotFoundError', 'User not found for updation', 404))

    // user updated successfully
    res.status(200).json({
        status: 'success',
        message: 'User updated successfully',
        data: { user }
    });
})

// update multiple users
export const updateUsers = controllerWrapper(async (req, res, next) => {
    const query = req.query; // getting user id from params

    const updates = req.body; //changes for updation


    // updating users...
    const users = await UserModel.updateMany(query, updates, {
        new: true,
        runValidators: true
    })

    // no users found
    if (users.matchedCount === 0)
        return next(new CustomError('NotFoundError', 'No users found for updation', 404))

    // user updated successfully
    res.status(200).json({
        status: 'success',
        message: `${users.matchedCount} users updated successfully`,
    });
})

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
            // MORE OPERATIONS WILL BE ADDED LATER

            // deleting user...
            user = await UserModel.findByIdAndDelete(userID, { session })

            // user not found
            if (!user) {

                // throwing makes mongoDB to abort the transaction 
                throw new CustomError('NotFoundError', `User with ID: ${userID} not found for deletion`, 404)
            }

        })
        // user deleted successfully
        res.status(204).send();
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
    const query = req.query; // getting user id from params

    let session;
    let deletionResult;

    try {

        // create a session for deletion
        session = await mongoose.startSession()

        // run transaction (mongoDB commits or aborts the transaction automatically)
        await session.withTransaction(async () => {
            // MORE OPERATIONS WILL BE ADDED LATER

            // deleting users...
            deletionResult = await UserModel.deleteMany(query, { session })

            // users not found
            if (!deletionResult.deletedCount === 0) {

                // throwing makes mongoDB to abort the transaction 
                throw new CustomError('NotFoundError', `No users found for deletion`, 404)
            }
        })


        // users deleted successfully
        res.status(204).send();
    }
    catch (err) {

        // error occured 
        next(err)

    } finally {

        if (session)
            session.endSession() // end transaction session
    }
}

// ------------------------------------------------------------------------------------
// handlers for the current user (Deletion and creation is present in /auth)
// authorized with any role(user, admin, seller) can access these handlers below
// ------------------------------------------------------------------------------------

// normal user: update own profile 
export const updateMyProfile = controllerWrapper(async (req, res, next) => {
    const userID = req.user._id; //current user
    const updates = {
        ...req.body,
        //ensures password and email cannot be updated directly
        password: undefined, 
        email: undefined,
    }
    
    if(updates.role){

        // don't allow a user/seller to change their role to 'admin'
        if(updates.role === 'admin')
            return next(
        new CustomError('BadRequestError', 'You cannot change your role to admin!', 400))

        // user already has the role they are requesting
        else if(req.user.role.includes(updates.role)){
             return next(
        new CustomError('BadRequestError', `You already have the role: ${updates.role}`, 400))

        }

        else{
            // mongodb operator for pushing an element in array field 
            // (only inserts if the element doesn't exist in array)
            updates.$addToSet = {role: updates.role }
        }

        // delete role
        delete updates.role
    }

    // updating user...
    const user = await UserModel.findByIdAndUpdate(userID, updates, {
        runValidators: true, 
        new: true 
    });
    
    if (!user) {
        return next(new CustomError('NotFoundError', 'Account may have been deleted', 404));
    }

    res.status(200).json({
         status: 'success',
         message: 'Profile updated successfully',
         data: {     
         user 
         }
        });
});

// normal user: get own profile 
export const getMyProfile = (req, res, next) => {

    // user is not authenticated (extra check for avoiding wrong serving of data)
  if (!req.user) {
    return next(new CustomError("UnauthorizedError", "Not authenticated!", 401));
  }

  res.status(200).json({
    status: 'success',
    message: 'Profile fetched successfully',
    data: {user: req.user},
  });
};
