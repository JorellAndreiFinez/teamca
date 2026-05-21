import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import http from "http";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { connectDB } from "./config/db.js";
import { initTaskSocket } from "./socket/io.js";
import routes from "./routes/index.js";
import { scheduleDeadlineSweep } from "./utils/scheduler.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../.env") });
const app = express();
const PORT = process.env.PORT || 3000;

if (process.env.NODE_ENV === "production" && !process.env.JWT_SECRET) {
  console.error("Missing JWT_SECRET in production environment. Exiting.");
  process.exit(1);
}

app.set("trust proxy", 1);
app.disable("x-powered-by");

const normalizeOrigin = (origin: string): string => origin.replace(/\/+$/, "");

const defaultOrigins = [
  "http://localhost:4321",
  "http://127.0.0.1:4321",
  "https://teamca-frontend.vercel.app",
].map(normalizeOrigin);

const configuredOrigins = [
  process.env.FRONTEND_URL,
  ...(process.env.CORS_ORIGINS || "").split(","),
]
  .filter((origin): origin is string => Boolean(origin))
  .map((origin) => normalizeOrigin(origin.trim()))
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
    const normalizedOrigin = origin ? normalizeOrigin(origin) : undefined;

    // allow non-browser clients (no origin header).
    if (
      !normalizedOrigin ||
      allowedOrigins.includes(normalizedOrigin) ||
      isLocalDevOrigin(normalizedOrigin)
    ) {
      return callback(null, true);
    }
    return callback(null, false);
  },
  // allow cookies / Authorization header in cross-origin requests from the app
  credentials: true,
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

void connectDB();
scheduleDeadlineSweep();

app.use("/api/auth", _authLimiter);
app.use("/api", _apiLimiter, routes);

// ── Health check
app.get("/health", (_req, res) =>
  res.json({ status: "ok", timestamp: new Date().toISOString() }),
);

const server = http.createServer(app);
initTaskSocket(server, allowedOrigins);

server.on("error", (error: NodeJS.ErrnoException) => {
  if (error.code === "EADDRINUSE") {
    console.error(
      `Port ${PORT} is already in use. Stop the process using it or set a different PORT in backend/.env.`,
    );
    process.exit(1);
  }

  throw error;
});

server.listen(PORT, () => {
  console.log(`API server listening on port ${PORT}`);
});
