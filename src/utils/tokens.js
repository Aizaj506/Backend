import { User } from "../models/user.model.js";
import ApiError from "./ApiError.js";

const generateAccessAndRefreshTokens = async (userId) => {
    try {
        const user = await User.findById(userId);
        const accessToken = user.generateAccessToken() // Calls method in User model
        const refreshToken = user.generateRefreshToken() // Calls method in User model

        // Save refresh token in the database
        user.refreshToken = refreshToken;
        await user.save({ validateBeforeSave: true });

        return { accessToken, refreshToken };
    } catch (error) {
        throw new ApiError(500, "Something went wrong while generating refresh and access tokens!")
    }
}

export default generateAccessAndRefreshTokens;