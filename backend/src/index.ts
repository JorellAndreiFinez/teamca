import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import rateLimit from "express-rate-limit";
import { connectDB } from "./config/db";

dotenv.config();
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// ── Rate limiters
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 20 });
const apiLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 200 });

// ── MongoDB connection
connectDB().then(() => console.log("MongoDB ready"));

// ── Routes
import authRoutes from "./routes/authRoutes";
import userRoutes from "./routes/userRoutes";
// import dtrRoutes from "./routes/dtrRoutes";
// import taskRoutes from "./routes/taskRoutes";

app.use("/auth", authLimiter, authRoutes);
app.use("/users", apiLimiter, userRoutes);
// app.use("/dtr", apiLimiter, dtrRoutes);
// app.use("/tasks", apiLimiter, taskRoutes);

// ── Health check
app.get("/health", (_req, res) =>
  res.json({ status: "ok", timestamp: new Date().toISOString() }),
);

app.listen(PORT, () =>
  console.log(`Server running at http://localhost:${PORT}`),
);
