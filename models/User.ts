import mongoose, { Schema, model, models } from 'mongoose';

// Define the structure of the User document
const UserSchema = new Schema({
    email: {
        type: String,
        unique: true,
        required: [true, 'Email is required'],
        lowercase: true,
        trim: true,
    },
    dob: {
        type: String,
        required: [true, 'Date of birth is required'],
    },
    age: {
        type: Number,
        required: true,
    },
    gender: {
        type: String,
        enum: ['male', 'female', 'other', 'Select'],
        default: 'male',
    },
    city: {
        type: String,
        trim: true,
    },
    pincode: {
        type: String,
        trim: true,
    },
    isVerified: {
        type: Boolean,
        default: false,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

// Check if the model already exists to prevent recompilation in Next.js HMR
const User = models.User || model('User', UserSchema);

export default User;