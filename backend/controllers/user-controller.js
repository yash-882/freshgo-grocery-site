// This user-controller provides separate handlers for admin and non-admin roles

import UserModel from "../models/user-model.js";
import CustomError from "../error-handling/custom-error-class.js";
import controllerWrapper from "../utils/controller-wrapper.js";
import { findUserByQuery } from "../utils/auth-helpers.js";
import mongoose from "mongoose";
import ProductModel from "../models/product-model.js";

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
    
    const {filter, sort, limit, skip, select } = req.sanitizedQuery; //filter 

    // getting  multiple users
    const users = await UserModel.find(filter)
    .sort(sort)
    .skip(skip)
    .limit(limit)
    .select(select); 

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
    const user = await UserModel.findByIdAndUpdate(userID, {$set: updates}, {
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
    const {filter} = req.sanitizedQuery; // getting user id from params

    const updates = req.body; //changes for updation


    // updating users...
    const users = await UserModel.updateMany(filter, {$set: updates}, {
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

    try {

        // create a session for deletion
        session = await mongoose.startSession()

        // run transaction (mongoDB commits or aborts the transaction automatically)
        await session.withTransaction(async () => {

            // deleting user...
            const user = await UserModel.findByIdAndDelete(userID).session(session)

            // user not found
            if (!user) {

                // throwing makes mongoDB to abort the transaction 
                throw new CustomError('NotFoundError', `User with ID: ${userID} not found for deletion`, 404)
            }

            // only delete products if the user is 'Seller'
            if(user.role.includes('seller')){

                await ProductModel.deleteMany({seller: user._id}).session(session)
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
    const {filter} = req.sanitizedQuery; // getting user id from params

    let session;

    try {
        // prevents from deleting all users 
              if (!filter || Object.keys(filter).length === 0) {
            throw new CustomError('BadRequestError', 'Filter is required to delete users!', 400);
        }

        // create a session for deletion
        session = await mongoose.startSession()

        // run transaction (mongoDB commits or aborts the transaction automatically)
        await session.withTransaction(async () => {

            // find users for deletion
            const usersToDelete = await UserModel.find(filter).session(session)

            // users not found
            if (usersToDelete.length === 0) {

                // throwing makes mongoDB to abort the transaction 
                throw new CustomError('NotFoundError', `No users found for deletion`, 404)
            }

            // get IDs of all found users
            const usersIDs = usersToDelete.map(user => user._id)


            // deleting products of users...
            await ProductModel.deleteMany({seller: {$in: usersIDs}}).session(session)

            // deleting users...
            await UserModel.deleteMany({_id: {$in: usersIDs}}).session(session)

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
export const getMyProfile = controllerWrapper(async (req, res, next) => {

    // user is not authenticated (extra check for avoiding wrong serving of data)
  if (!req.user) {
    return next(new CustomError("UnauthorizedError", "Not authenticated!", 401));
  }

  res.status(200).json({
    status: 'success',
    data: {profile: req.user},
  });
});
