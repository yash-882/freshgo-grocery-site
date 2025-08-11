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

// compares plain texts with hashed strings, throws a custom error if not equal
export const bcryptCompare = async ({plain, hashed}, errMessage = 'Incorrect!') => {

    // compare plain string with hashed string
    const isCorrect = await bcrypt.compare(plain, hashed);

    if(!isCorrect) {
        throw new CustomError('UnauthorizedError', errMessage, 401);
    }

    return true;
}
