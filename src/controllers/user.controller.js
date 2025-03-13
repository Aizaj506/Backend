import { User } from "../models/user.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import ApiError from '../utils/ApiError.js'
import ApiResponse from "../utils/ApiResponse.js";
import uploadOnCloudinary from "../utils/cloudinary.js";
import generateAccessAndRefreshTokens from "../utils/tokens.js";


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

export { registerUser, loginUser, logoutUser };