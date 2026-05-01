import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(__dirname, "../../.env") });

// Prefer local MongoDB for development, fallback to Atlas if configured
const MONGO_URI =
  process.env.MONGODB_URI ||
  process.env.MONGO_URI ||
  "mongodb://127.0.0.1:27017/teamca";

export const connectDB = async () => {
  try {
    await mongoose.connect(MONGO_URI, {
      // Set shorter timeout for local connections
      serverSelectionTimeoutMS: process.env.NODE_ENV === 'production' ? 30000 : 5000,
      socketTimeoutMS: process.env.NODE_ENV === 'production' ? 45000 : 10000,
    });
  } catch (err) {
    process.exit(1);
  }
};

