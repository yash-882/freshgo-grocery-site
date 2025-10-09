// This user-controller provides handlers for authenticated users

import UserModel from "../models/user-model.js";
import CustomError from "../error-handling/custom-error-class.js";
import controllerWrapper from "../utils/controller-wrapper.js";
import sendApiResponse from "../utils/api-response.js";

// ------------------------------------------------------------------------------------
// handlers for the current user (Deletion and creation is present in /auth)
// any authenticated user can access these handlers below
// ------------------------------------------------------------------------------------

// normal user: update own profile 
export const updateMyProfile = controllerWrapper(async (req, res, next) => {
    const userID = req.user._id; //current user
    const updates = req.body;

    // remove custom field(used in pre schema hook) if present
    delete updates.byAdmin

    // updating user...
    const user = await UserModel.findByIdAndUpdate(userID, updates, {
        runValidators: true, 
        new: true 
    });
    
    if (!user) {
        return next(new CustomError('NotFoundError', 'Account may have been deleted', 404));
    }

    // profile updated successfully
    sendApiResponse(res, 200, {
        data: user, //updated profile
        message: 'Profile updated successfully',
    })
})
            
// normal user: get own profile 
export const getMyProfile = controllerWrapper(async (req, res, next) => {

    // user is not authenticated (extra check for avoiding wrong serving of data)
  if (!req.user) {
    return next(new CustomError("UnauthorizedError", "Not authenticated!", 401));
  }
  
  // send user profile
  sendApiResponse(res, 200, {
      data: req.user
    })
})

// CRUD for user's address

// update address
export const updateAddressByID = controllerWrapper(async (req, res, next) => {
    const user = req.user; //current user
    const addressID = req.params.id; //address ID
    const updates = req.body; //updates

    if(user.addresses.length === 0){
        return next(
            new CustomError('NotFoundError', 'You have no saved addresses yet', 404))
    }

    if(!addressID){
        return next(
            new CustomError('BadRequestError', 'Address ID is required for updation', 400))
    }

    const addressToUpdate = user.addresses.id(addressID)

    if (!addressToUpdate) {
        return next(
            new CustomError('NotFoundError', 'Address not found', 404));
    }

    // apply updates for each field
    Object.keys(updates).forEach(key => {
        addressToUpdate[key] = updates[key] //replace field's value
    })

    // save user
    await user.save()

    sendApiResponse(res, 200, {
        data: user.addresses, // return the updated address
        message: 'Address updated successfully',
    });
})

// add address 
export const addAddress = controllerWrapper(async (req, res, next) => {
    const user = req.user; //current user
    const newAddress = req.body; //new address to add

    // address has not provided
    if(!newAddress || Object.keys(newAddress).length === 0){
        return next(
            new CustomError('BadRequestError', 'Address is required for updation', 400))
    }

    // add new address
    user.addresses.push(newAddress)

    // save user
    await user.save()
    
    sendApiResponse(res, 201, {
        data: user.addresses, // return the updated address field
        message: 'Address added successfully',
    });
    
})

// delete address
export const deleteAddressByID = controllerWrapper(async (req, res, next) => {
    const user = req.user; //current user
    const addressID = req.params.id; //address ID

    // no addresses saved
    if(user.addresses.length === 0){
        return next(
            new CustomError('NotFoundError', 'You have no saved addresses yet', 404))
    }

    // address ID isn't provided
    if(!addressID){
        return next(
            new CustomError('BadRequestError', 'Address ID is required for deletion', 400))
    }

    // find address index in array
    const addressIndex = user.addresses.findIndex(address => address._id === addressID)
    if(addressIndex === -1){
        return next(
            new CustomError('NotFoundError', 'Address not found', 404));
    }
    
    //delete address
    user.addresses.splice(addressIndex, 1) 

    // save user
    await user.save()
    

    sendApiResponse(res, 200, {
        data: user.addresses, // return the updated address list
        message: 'Address deleted successfully',
    });
})
