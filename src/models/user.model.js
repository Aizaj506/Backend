import mongoose, { Schema } from "mongoose";
import { stringify } from "postcss";
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'

const userSchema = new Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
        index: true
    },

    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
    },

    fullname: {
        type: String,
        required: true,
        trim: true,
        index: true
    },

    avatar: {
        type: String, // Cloudinary url
        required: true,
    },

    coverImage: {
        type: String, // Cloudinary url
    },

    watchHistory: [
        {
            type: Schema.Types.ObjectId,
            ref: "Video",
        }
    ],

    password: {
        type: String,
        required: [true, 'Password is requird!'],
    },

    refreshToken: {
        type: String
    }
}, { timestamps: true });

// Hash password before saving to DB
userSchema.pre("save", async function (next) {
    if (!this.isModified("password")) return next(); //If Password is not modified
    this.password = await bcrypt.hash(this.password, 10)
    next();
})

// Compare hashed password for login
userSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
}

// Json Web Token (JWT)
userSchema.methods.generateAccessToken = function () {
    return jwt.sign(
        {
            id: this._id,
            email: this.email,
            username: this.username,
            fullname: this.fullname
        },
        process.env.ACCESS_TOKEN_SECRET,
        { expiresIn: process.env.ACCESS_TOKEN_EXPIRY }
    )
}

userSchema.methods.generateRefreshToken = function () {
    return jwt.sign(
        {
            id: this._id,
        },
        process.env.REFRESH_TOKEN_SECRET,
        { expiresIn: process.env.REFRESH_TOKEN_EXPIRY }
    )
}

export const User = mongoose.model("User", userSchema);