import client from "../configs/redis-client.js";
import CustomError from "../error-handling/custom-error-class.js";
import UserModel from "../models/user-model.js";
import bcrypt from 'bcrypt';
import crypto from 'crypto';


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

// generate OTP
export const generateOTP = (digits = 4) => {

    // Maximum possible value for given digits 
    //e.g. 6 → 999999 + 1 = 1000000(exclusive)
    const maxLength = Number("9".repeat(digits)) + 1

    // generate a random integer of specified digits
    const OTP = String(crypto.randomInt(0, maxLength))

    // Add leading zeros from the start if length is shorter than required
    // (eg. for 6 digits, 62 -> 000062)
    return OTP.padStart(digits, "0")
}
// verifies OTP (OTP stored in Redis)
export const verifyOTP = async (OTP_KEY, enteredOTP) => {

    // user (json object)
    const jsonUser = await client.get(OTP_KEY)

    // if user not found
    if(!jsonUser){
        throw new CustomError('UnauthorizedError', 'OTP or session has expired!', 401)
    } 

    // user (JS object)
    const parsedUser = JSON.parse(jsonUser)
    
    // validate current password, throws custom error if incorrect
    await bcryptCompare({
        plain: enteredOTP,
        hashed: parsedUser.OTP
    }, 'Incorrect OTP!')

    // user is verified now
    return parsedUser;
}

