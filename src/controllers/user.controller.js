import { User } from "../models/user.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import ApiError from '../utils/ApiError.js'
import ApiResponse from "../utils/ApiResponse.js";
import uploadOnCloudinary from "../utils/cloudinary.js";

//Logic for Registration
const registerUser = asyncHandler(async (req, res) => {
    const { username, email, fullname, avatar, password } = req.body;

    // Check Validation
    if ([username, email, fullname, avatar, password].some((field) => field?.trim() === "")) {
        console.log("Error")
        throw new ApiError(400, "All Fields are required!")
    }

    // Check if user already exists
    const userExists = await User.findOne({ $or: [{ email: email }, { username: username }] });
    if (userExists) {
        // return res.status(400).json({message: "User already exists"});
        throw new ApiError(409, "User with email or username already exists")
    }

    const avatarLocalPath = await req.files?.avatar?.[0]?.path; // Multer gives acces of req.files
    // console.log("Request file", req.files);
    const coverImageLocalPath = await req.files?.coverImage?.[0]?.path || "";

    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar file is required");
    }

    const userAvatar = await uploadOnCloudinary(avatarLocalPath);
    const userCoverImage = await uploadOnCloudinary(coverImageLocalPath)

    if (!userAvatar) {
        throw new ApiError(400, "Failed to upload avatar");
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
    const token = await newUser.generateAccessToken();

    return res.status(201).json(
        new ApiResponse(201, createdUser, token, "User registerd successfully!")
    )
})

//Logic for Login
const loginUser = asyncHanlder(async (req, res) => {
    res.status(200).json({ message: "Login Success" })
})

export { registerUser, loginUser };