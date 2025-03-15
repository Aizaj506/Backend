import { User } from "../models/user.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import ApiError from '../utils/ApiError.js'
import ApiResponse from "../utils/ApiResponse.js";
import uploadOnCloudinary from "../utils/cloudinary.js";
import generateAccessAndRefreshTokens from "../utils/tokensGenerator.js";
import jwt from 'jsonwebtoken'


//Logic for Registration
const registerUser = asyncHandler(async (req, res) => {
    const { username, email, fullname, avatar, password } = req.body;

    // Check Validation
    if ([username, email, fullname, password, avatar].some((field) => field?.trim() === "")) {
        throw new ApiError(400, "All Fields are required!");
    }

    // Check if user already exists
    const userExists = await User.findOne({ $or: [{ email: email }, { username: username }] });
    if (userExists) {
        // return res.status(400).json({message: "User already exists"});
        throw new ApiError(409, "User with email or username already exists")
    }

    // Handle file uploads
    const avatarLocalPath = await req.files?.avatar?.[0]?.path; // Multer gives acces of req.files
    // console.log("Request file", req.files);
    const coverImageLocalPath = req.files?.coverImage?.[0]?.path || null;

    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar file is required");
    }

    const userAvatar = await uploadOnCloudinary(avatarLocalPath);
    if (!userAvatar || !userAvatar.url) {
        throw new ApiError(400, "Failed to upload avatar");
    }
    let userCoverImage = null;
    if (coverImageLocalPath) {
        userCoverImage = await uploadOnCloudinary(coverImageLocalPath);
    }


    // create new user
    const newUser = await User.create({
        username: username.toLowerCase(),
        email,
        fullname,
        avatar: userAvatar.url,
        coverImage: userCoverImage?.url || "",
        password,
    });

    const createdUser = await User.findById(newUser._id).select("-password -refreshToken");
    if (!createdUser) {
        throw new ApiError(500, "Something went wrong while registering the user!");
    }

    // Generate JWT Tokens
    const tokens = await generateAccessAndRefreshTokens(newUser._id);

    return res.status(201).json(
        new ApiResponse(201, { createdUser, tokens }, "User registerd successfully!")
    )
})

//Logic for Login
const loginUser = asyncHandler(async (req, res) => {
    const { email, username, password } = req.body

    if (!email && !username) {
        throw new ApiError(400, "username or email is required!")
    }

    // Check if user exists
    const existsUser = await User.findOne({ $or: [{ username }, { email }] });
    // console.log(existsUser)
    if (!existsUser) {
        throw new ApiError(404, "User dones not exists!")
    }

    // Compare password
    const isMatchPassword = await existsUser.matchPassword(password)
    if (!isMatchPassword) {
        throw new ApiError(400, "Invalid user credentials ")
    }

    // Generate JWT token
    const tokens = await generateAccessAndRefreshTokens(existsUser._id);

    //Loggedin User
    const loggedInUser = await User.findById(existsUser._id).select("-password -refreshToken")

    const options = {
        httpOnly: true,
        secure: true
    }

    return res
        .status(200)
        .cookie("accessToken", tokens.accessToken, options)
        .cookie("refreshToken", tokens.refreshToken, options)
        .json(new ApiResponse(200, { user: loggedInUser, tokens }, "User logged In successfully!"))

})

//Logic for Logout
const logoutUser = asyncHandler(async (req, res) => {
    if (!req.user) {
        return res.status(401).json(new ApiResponse(401, {}, "Unauthorized request"));
    }

    await User.findByIdAndUpdate(
        req.user._id, { $set: { refreshToken: undefined } }, { new: true }
    )

    const options = {
        httpOnly: true,
        secure: true
    }

    return res
        .status(200)
        .clearCookie("accessToken", options)
        .clearCookie("refreshToken", options)
        .json(new ApiResponse(200, {}, "User logged Out Successfully!"))
})

// Logic for Refresh the Access Token
const refreshAccessToken = asyncHandler(async (req, res) => {
    // For web apps (cookies) and mobile apps (body)
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken;
    if (!incomingRefreshToken) {
        throw new ApiError(401, "Unauthorized request!")
    }

    let decodedToken;
    try {
        decodedToken = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET)
    } catch (error) {
        throw new ApiError(401, "Invalid or expired refresh token!");
    }

    const user = await User.findById(decodedToken?.id);
    if (!user) {
        throw new ApiError(401, "Invalid refresh token!")
    }

    if (incomingRefreshToken !== user?.refreshToken) {
        throw new ApiError(401, "Refresh token is expired or used!");
    }

    // Generate new tokens
    const { accessToken, newRefreshToken } = await generateAccessAndRefreshTokens(user.id)

    // Update refresh token in DB
    // user.refreshToken = newRefreshToken;
    // await user.save({ validateBeforeSave: true });

    const options = {
        httpOnly: true,
        secure: true,
    }

    return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", newRefreshToken, options)
        .json(new ApiResponse(200, { accessToken, refreshToken: newRefreshToken }, "Access token refreshed."))
})

// Logic for changing the current password
const changeCurrentPassword = asyncHandler(async (req, res) => {
    const { oldPassword, newPassword } = req.body

    // Find the user by ID
    const user = await User.findById(req.user?.id);
    if (!user) {
        throw new ApiError(404, "User not found");
    }

    // Check if old password matches
    const isMatchPassword = await user.matchPassword(oldPassword)
    if (!isMatchPassword) {
        throw new ApiError(400, "Invalid old password");
    }

    // Update password
    user.password = newPassword
    await user.save({ validateBeforeSave: true })

    return res.status(200).json(new ApiResponse(200, {}, "Password change successfully!"))
})

// Logic for Get current user details
const getCurrentUser = asyncHandler(async (req, res) => {
    return res.status(200).json(new ApiResponse(200, req.user, "Current User fetched successfully"))
})

//Update users details
const updateAccountsDetails = asyncHandler(async (req, res) => {
     const {fullname, email} = req.body;

     if(!fullname || !email){
        throw new ApiError(400, "All field are required")
     }

     const user = await User.findByIdAndUpdate(
        req.user?.id,
        {$set: {fullname, email:email}},
        {new: true}
     )

     if (!user) {
        throw new ApiError(404, "User not found");
    }

    // Remove password field before sending response => ref chatgpt
    const userWithoutPassword = user.toObject();
    delete userWithoutPassword.password;

    return res.status(200).json(new ApiResponse(200, userWithoutPassword, "Account Details Updated Successfully!"));
})

//Update Avatar
const updateUserAvatar = asyncHandler(async (req, res) => {
    // Ensure file is provided
    if (!req.file || !req.file.path) {
        throw new ApiError(400, "Avatar file is missing!");
    }

    const avatarLocalPath = await req.file?.path

    // Upload avatar to Cloudinary
    const avatar = await uploadOnCloudinary(avatarLocalPath)
    if(!avatar?.url){
        throw new ApiError(400, "Error while uploading avatar to Cloudinary");;
    }

     // Update user avatar
    const user = await User.findByIdAndUpdate(
        req.user?.id,
        {$set: {avatar: avatar.url}},
        {new: true}
     )

     if (!user) {
        throw new ApiError(404, "User not found");
    }

     // Remove password manually
     const userWithoutPassword = user.toObject();
     delete userWithoutPassword.password;

    return res.status(200).json(new ApiResponse(200, userWithoutPassword, "Avatar Updated Successfully!"));
})

//Update cover image
const updateUserCoverImage = asyncHandler(async (req, res) => {
    // Ensure file is provided
    if (!req.file || !req.file.path) {
        throw new ApiError(400, "Cover image file is missing!");
    }

    const coverImageLocalPath = await req.file?.path

    // Upload cover Image to Cloudinary
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)
    if(!coverImage?.url){
        throw new ApiError(400, "Error while uploading cover image to Cloudinary");;
    }

     // Update user avatar
    const user = await User.findByIdAndUpdate(
        req.user?.id,
        {$set: {coverImage: coverImage.url}},
        {new: true}
     )

     if (!user) {
        throw new ApiError(404, "User not found");
    }

     // Remove password manually
     const userWithoutPassword = user.toObject();
     delete userWithoutPassword.password;

    return res.status(200).json(new ApiResponse(200, userWithoutPassword, "Avatar Updated Successfully!"));
})

export { registerUser, loginUser, logoutUser, refreshAccessToken, changeCurrentPassword, getCurrentUser,updateAccountsDetails, updateUserAvatar, updateUserCoverImage };