import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import http from "http";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { connectDB } from "./config/db";
import { initTaskSocket } from "./socket/io";
import routes from "./routes/index";

dotenv.config({ path: path.resolve(__dirname, "../.env") });
const app = express();
const PORT = process.env.PORT || 3000;

app.set("trust proxy", 1);
app.disable("x-powered-by");

const defaultOrigins = ["http://localhost:4321", "http://127.0.0.1:4321"];
const configuredOrigins = (process.env.CORS_ORIGINS || "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);
const allowedOrigins = Array.from(
  new Set([...defaultOrigins, ...configuredOrigins]),
);

const isLocalDevOrigin = (origin: string): boolean => {
  try {
    const parsed = new URL(origin);
    return (
      parsed.protocol === "http:" &&
      ["localhost", "127.0.0.1"].includes(parsed.hostname)
    );
  } catch {
    return false;
  }
};

const corsOptions: cors.CorsOptions = {
  origin: (origin, callback) => {
    // allow non-browser clients (no origin header).
    if (
      !origin ||
      allowedOrigins.includes(origin) ||
      isLocalDevOrigin(origin)
    ) {
      return callback(null, true);
    }
    return callback(null, false);
  },
  credentials: false,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

app.use(cors(corsOptions));
app.options(/.*/, cors(corsOptions));

app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
  }),
);

app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: false, limit: "10kb" }));

const _authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: { message: "Too many auth requests. Please try again shortly." },
});

const _apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  skip: (req) => req.path === "/health",
  message: { message: "Too many requests. Please slow down and try again." },
});

connectDB().then(() => console.warn("MongoDB ready"));

app.use("/api", routes);

// ── Health check
app.get("/health", (_req, res) =>
  res.json({ status: "ok", timestamp: new Date().toISOString() }),
);

const server = http.createServer(app);
initTaskSocket(server, allowedOrigins);

server.listen(PORT, () =>
  console.warn(`Server running at http://localhost:${PORT}`),
);
