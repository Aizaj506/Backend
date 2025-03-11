import express, { urlencoded } from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser';

const app = express();

// ✅ CORS Configuration
const corsOption = {
    origin: process.env.CORS_ORIGIN,
    Credential: true,
}
app.use(cors(corsOption))

// ✅ Middleware
app.use(express.json({ limit: "16kb" })); // Client se aane wale JSON data ko parse karta hai.
app.use(express.urlencoded({ extended: true, limit: "16kb" })); // URL Encoded Data Parsing
app.use(express.static("public")); // Static File Serving
app.use(cookieParser()) // Client se aane wali cookies ko "req.cookies" me parse karta hai.

// Routes import
import userRouter from './routes/user.routes.js'

// Routes Declaration
app.use("/api/v1/users", userRouter);



export { app };