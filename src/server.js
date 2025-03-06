import dotenv from "dotenv";
import connectDB from "./db/db.js";
import { app } from "./app.js";
const PORT = process.env.PORT || 3000

dotenv.config();  // // Load environment variables

const startServer = async () => {
    try {
        await connectDB();
        app.listen(PORT, () => {
            console.log(`⚙ Server running on 📢 http://localhost:${PORT}`);
        });
    } catch (error) {
        console.error("❌ MongoDB Connection Failed!", error);
        process.exit(1);
    }
};

startServer();
