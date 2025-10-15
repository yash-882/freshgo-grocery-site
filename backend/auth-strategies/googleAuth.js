import {Strategy as GoogleStrategy} from 'passport-google-oauth2';
import {randomInt} from 'crypto';
import UserModel from '../models/user.js';
import { hash } from 'bcrypt';

// google OAUTH2 strategy
export default new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: `http://localhost:${process.env.PORT || 8000}/api/auth/google/callback`,
    passReqToCallback: true,

}, 
// executes after google has successfully authorized both the user and the client(App)
async (request, accessToken, refreshToken, profile, done) => {
    try{
    let user = await UserModel.findOne({email: profile.emails[0].value})
    
    // create user if doesn't exist in DB
    if(!user){
        user = new UserModel({
            name: profile.displayName,
            email: profile.emails[0].value,
            password: await hash(randomInt(281474976710623).toString(), 10), //random password
            roles: ['user'],
            auth: ['google']
    }) 
    await user.save()
}

// user already exists but has never signed in using google
else if(!user.auth.includes('google')){
    //save and update auth methods of user
    user.auth.push('google') 
    await user.save()
}

  // user is now authenticated via google
    return done(null, user) //pass user for further handling
}
    catch(err){
        return done(err)
    }
})