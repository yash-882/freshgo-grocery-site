import { Schema, Model } from 'mongoose';
import bcrypt from 'bcrypt';

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
            validator: function (){
                // Regular expression for validating email format
                return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.email);
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
    role: {
        type: [String], //array of strings for roles
        enum: ['user', 'admin'],
        default: ['user'], // default role is 'user'
        lowercase: true
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
})

// Virtual field for confirmPassword
// This field is not stored in the database, but used for validation during sign-up
UserSchema.virtual('confirmPassword')
.get(function() {
    return this._confirmPassword;
})

// pre save hook runs before saving the user document
UserSchema.pre('save', async function(next) {
   // Check if the password is confirmed correctly
    if(!this.confirmPassword || this.confirmPassword !== this.password) 
        next(new Error('Please confirm your password correctly!'));
    
    
    // hash the password before saving
    this.password = await bcrypt.hash(this.password, 10)
    next()
})

// Create a model for the User schema
const UserModel = Model('user', UserSchema);

export default UserModel;