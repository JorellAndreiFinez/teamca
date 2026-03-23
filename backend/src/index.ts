import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { connectDB } from "./config/db";

dotenv.config({ path: path.resolve(__dirname, "../.env") });
const app = express();
const PORT = process.env.PORT || 3000;

app.set("trust proxy", 1);
app.disable("x-powered-by");

const allowedOrigins = (process.env.CORS_ORIGINS || "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // allow non-browser clients (no origin header).
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error("CORS policy blocked this origin."));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
  }),
);

app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: false, limit: "10kb" }));

// ── Rate limiters
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: { message: "Too many auth requests. Please try again shortly." },
});

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  skip: (req) => req.path === "/health",
  message: { message: "Too many requests. Please slow down and try again." },
});

// ── MongoDB connection
connectDB().then(() => console.log("MongoDB ready"));

// ── Routes
import authRoutes from "./routes/authRoutes";
import userRoutes from "./routes/userRoutes";
// import dtrRoutes from "./routes/dtrRoutes";
// import taskRoutes from "./routes/taskRoutes";

app.use(apiLimiter);
app.use("/auth", authLimiter, authRoutes);
app.use("/users", userRoutes);
// app.use("/dtr", apiLimiter, dtrRoutes);
// app.use("/tasks", apiLimiter, taskRoutes);

// ── Health check
app.get("/health", (_req, res) =>
  res.json({ status: "ok", timestamp: new Date().toISOString() }),
);

app.listen(PORT, () =>
  console.log(`Server running at http://localhost:${PORT}`),
);
