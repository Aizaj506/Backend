import jwt from 'jsonwebtoken';
import { User } from '../models/user.model.js';
import ApiError from '../utils/ApiError.js';
const verifyToken = async (req, _, next) => {
    try {
        const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "")

        if (!token) {
            throw new ApiError(401, "Unauthorized, no token provided");
        }


        const decodeToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
        const user = await User.findById(decodeToken?.id).select("-password -refreshToken")
        if (!user) {
            throw new ApiError(401, "Invalid access token!");
        }

        req.user = user;
        next();
    } catch (error) {
        throw new ApiError(403, error?.message || "Invalid or expired token");
    }
}

export default verifyToken;