import { Schema, model } from 'mongoose';
import bcrypt from 'bcrypt';
import CustomError from '../error-handling/custom-error-class.js';

// address schema (only used as a field of UserSchema)
const AddressSchema = new Schema({
        label: {
            type: String,
            default: 'unlabeled address',
            trim : true,
            lowercase: true
        },
        pinCode: {
            type: String,
            required: [true, 'Pin code is required'],
            trim: true,
            validate: {
                validator: (pinCode) => /^[0-9]{6}$/.test(pinCode),
                message: () => 'Invalid pin code!'
            }
        },
        street: {
            type: String,
            required: [true, 'Street is required'],
            minlength: [2, 'Street must be at least 2 characters long'],
            maxlength: [50, 'Street must be at most 50 characters long'],
            trim: true,
        },
        city: {
            type: String,
            required: [true, 'City is required'],
            minlength: [2, 'City must be at least 2 characters long'],
            maxlength: [20, 'City must be at most 20 characters long'],
            trim: true,
        },
        state: {
            type: String,
            required: [true, 'State is required'],
            minlength: [2, 'State must be at least 2 characters long'],
            maxlength: [20, 'State must be at most 20 characters long'],
            trim: true,
        },
    })


// USER SCHEMA
const UserSchema = new Schema({
    
    name: {
        type: String,
        required: [true, 'Name is required'],
        trim: true,
        minlength: 1,
        maxlength: [30, 'Name must be at most 30 characters long'],
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        validate: {
            validator: function (email){
                // Regular expression for validating email format
                return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
            },
            message: () => 'Invalid email format!'
        },
        trim: true,
        lowercase: true,
    },
    password: {
        type: String,
        required: [true, 'Password is required'],
        minlength: [8, 'Password must be at least 8 characters long'],
    },
    roles: {
        type: [String], //array of strings for roles
        enum: {
            values:['user', 'admin', 'seller'],
            message: '{VALUE} is not a valid role'
        },
        default: ['user'], // default role is 'user'
        lowercase: true
    },

    // Note: always use .save() method to run validators for updation
    addresses: {
        type: [AddressSchema],
        default: []
    },

    auth: {
        type: [String],
        enum: {
            values: ['google', 'local'],
            message: "'{VALUE}' is not a valid authentication method!"
        }
    },
    createdAt: {
        type: Date,
        default: Date.now,
        immutable: true,
    },
})

   
// pre save hook runs before saving the user document (on .create() and .save())
UserSchema.pre('save', async function(next) {
    if(this.isModified('password')){
        // call hashPassword to hash the password
        this.password = await bcrypt.hash(this.password, 10)
    }

    // max 3 addresses are allowed per user
    if (this.addresses.length > 3) {
        return next(
            new CustomError('BadRequestError', 'Cannot add more than 3 addresses', 400))
    }
    
    next()
})

// runs before updating the document(s)
UserSchema.pre(['findOneAndUpdate', 'updateOne', 'updateMany'], 
    async function(next) {
    const updates = this.getUpdate(); //changes for updation

    // prevents direct updates to sensitive fields
    delete updates.password;
    delete updates.email;
    delete updates.auth;
    delete updates.roles

    // this field is only allowed for updation through .save()
    delete updates.addresses;

    // allow a single value as a role for updation
    // new role will be pushed manually in roles[] using $addToSet(prevents duplicates)

    // role updation
     if(updates.role){
            // don't allow a user/seller to change their role to 'admin'
            if(updates.role === 'admin' && !updates.byAdmin)
                return next(
            new CustomError('BadRequestError', 'You cannot change your role to admin!', 400))
    
            else{
                // set MongoDB operator 
             if(!updates.$addToSet)
                updates.$addToSet = {};

             // push new role
                updates.$addToSet.roles = updates.role;
            }
    
        // delete custom fields
        delete updates.role;
        delete updates.byAdmin;
        }

    next()   
})

// Create a model for the User schema
const UserModel = model('user', UserSchema);

export default UserModel;