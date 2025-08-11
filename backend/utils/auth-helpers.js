import CustomError from "../error-handling/custom-error-class.js";
import UserModel from "../models/user-model.js";
import bcrypt from 'bcrypt';

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

// validates password by comparing plain text password with hashed password
export const isPasswordCorrect = async ({plain, hashed}, errMessage = 'Incorrect password!') => {

    // compare plain password with hashed password
    const isPasswordCorrect = await bcrypt.compare(plain, hashed);

    if(!isPasswordCorrect) {
        throw new CustomError('UnauthorizedError', errMessage, 401);
    }

    return true;
}
