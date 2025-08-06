import CustomError from "../error-handling/custom-error-class.js";
import UserModel from "../models/user-model.js";

// Function to get user by query or throw an error if not found
export const findUserByQuery = async (query, 
    throwErr=true, 
    notFoundResponse = 'User not found') => {

    const user = await UserModel.findOne(query);

    if(!user && throwErr) {
        throw new CustomError('NotFoundError', notFoundResponse, 404);
    }

    return user;
}
