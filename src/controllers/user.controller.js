import { asyncHanlder } from "../utils/asyncHandler.js";

//Logic for Registration
const registerUser = asyncHanlder(async (req, res) => {
    res.status(200).json({message: "OK"})
})

//Logic for Login
const loginUser = asyncHanlder(async (req, res) => {
    res.status(200).json({message: "Login Success"})
})

export {registerUser, loginUser};