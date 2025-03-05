import dotenv from "dotenv";
import connectDB from "./db/db.js";
dotenv.config();  // // Load environment variables
connectDB()