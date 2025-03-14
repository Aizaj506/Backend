import { Router } from "express";
import { registerUser, loginUser, logoutUser, refreshAccessToken } from "../controllers/user.controller.js";
import upload from "../middlewares/multer.middleware.js";
import { myFields } from "../utils/multerFields.js";
import verifyToken from "../middlewares/auth.middleware.js";

const router = Router();

router.route("/register").post(
    upload.fields(myFields),
    registerUser
)
router.route("/login").post(loginUser)

//secured routes
router.route("/logout").post(verifyToken, logoutUser)
router.route("/refresh-token").post(refreshAccessToken)

export default router;