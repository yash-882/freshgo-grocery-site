import client from "../../configs/redisClient.js";
import CustomError from "../../error-handling/customError.js";
import UserModel from "../../models/user.js";
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

// validates OTP requests, attempts and update update the
export const trackOTPLimit = async ({ OTP_KEY, countType='reqCount', limit=5, errMessage }) => {
    
    const jsonData = await client.get(OTP_KEY)
    
    // remaining expiration of the OTP
    const ttl = await client.ttl(OTP_KEY)
    
    // determines whether error should be thrown or not
    const isAttemptCheck = countType === 'attemptCount'

    //if the user associated with the OTP is not found
    if (!jsonData) {
        //OTP action has not initiated yet, return 0 (count)
        if(!isAttemptCheck) 
            return {user: {reqCount: 1}, ttl: 300} // first request

        // throw error
       throw new CustomError('NotFoundError', 'Expired OTP, please request a new one', 429)
    }

     
    //user found, parsing JSON data to JS obj..
    const OTPData = JSON.parse(jsonData)
    const currentCount = OTPData[countType] || 0
  
    // if reached maximum (5) OTP request limit
    if (OTPData[countType] >= limit) {
        throw new CustomError('TooManyRequestsError', errMessage, 429)
    } 
    else {
        OTPData[countType] = currentCount + 1 //update count 
    }

    //return OTPData and ttl(remaining expiration time)
    return {user: OTPData, ttl}
}