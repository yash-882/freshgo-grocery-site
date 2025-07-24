import { Schema, model } from 'mongoose';
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

   
// pre save hook runs before saving the user document (on .create() and .save())
UserSchema.pre('save', async function(next) {
    if(this.isModified('password')){
        // call hashPassword to hash the password
        this.password = await bcrypt.hash(this.password, 10)
    }
    
    next()
})

// Create a model for the User schema
const UserModel = model('user', UserSchema);

export default UserModel;