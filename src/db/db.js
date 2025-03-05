import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";

const URI = process.env.MONGODB_URI;

const connectDB = async () => {
    try {
        const connectionInstance = await mongoose.connect(`${URI}/${DB_NAME}`)
        console.log(`\n MongoDB Connected Successfully !! DB HOST: ${connectionInstance.connection.host}`);
    } catch (error) {
        console.error('MongoDB Connection Failed:', error);
        process.exit(1);
    }
}

export default connectDB;