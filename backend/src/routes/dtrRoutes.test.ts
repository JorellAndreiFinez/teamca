import { describe, it, expect, beforeAll, afterEach, vi } from "vitest";
import request from "supertest";
import express from "express";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import dtrRoutes from "./dtrRoutes.js";
import User from "../models/User.js";
import Department from "../models/Department.js";

// --- MOCK EXTERNAL SIDE EFFECTS ---
vi.mock("../socket/io.js", () => ({
  emitDTRUpdate: vi.fn(),
  emitUsersNotification: vi.fn(),
}));

vi.mock("../services/notificationService.js", () => ({
  createNotificationsForRecipients: vi.fn().mockResolvedValue([]),
}));

// We mock the other controllers mounted on this route so they don't throw 
// if their services try to connect to external APIs during our DTR tests.
vi.mock("../controllers/timeAdjustmentController.js", () => ({
  timeAdjustmentController: {
    submitRequest: vi.fn((req, res) => res.status(200).send()),
    getUserRequests: vi.fn((req, res) => res.status(200).send()),
    getPendingRequests: vi.fn((req, res) => res.status(200).send()),
    getRequest: vi.fn((req, res) => res.status(200).send()),
    approveRequest: vi.fn((req, res) => res.status(200).send()),
    rejectRequest: vi.fn((req, res) => res.status(200).send()),
  }
}));
vi.mock("../controllers/reminderController.js", () => ({
  reminderController: {
    getReminder: vi.fn((req, res) => res.status(200).send()),
    updateReminder: vi.fn((req, res) => res.status(200).send()),
    resetReminder: vi.fn((req, res) => res.status(200).send()),
  }
}));
vi.mock("../controllers/exportController.js", () => ({
  exportController: {
    exportRecords: vi.fn((req, res) => res.status(200).send()),
    previewExport: vi.fn((req, res) => res.status(200).send()),
  }
}));

// --- SETUP EXPRESS APP ---
const app = express();
app.use(express.json());
app.use("/api/dtr", dtrRoutes);

beforeAll(() => {
  process.env.JWT_SECRET = "teamca-dev-secret-change-in-production"; 
});

afterEach(async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
  vi.clearAllMocks();
});

// --- HELPER FUNCTIONS ---
const generateToken = (userId: mongoose.Types.ObjectId | string) => {
  const secret = process.env.JWT_SECRET || "teamca-dev-secret-change-in-production";
  return jwt.sign({ user_id: String(userId) }, secret, { expiresIn: "1h" });
};

const createMockIntern = async () => {
  const dept = await Department.create({ department_name: "IT" });
  const user = await User.create({
    email: `intern_${Date.now()}@example.com`,
    first_name: "Intern",
    last_name: "User",
    global_role: "Standard_User",
    is_active: true,
    password_hash: "hashedpassword123",
    departments: [{ department_id: dept._id, department_role: "Intern" }]
  });
  return { user, dept, token: generateToken(user._id) };
};

describe("DTR Routes (/api/dtr)", () => {

  describe("POST /api/dtr/time-in", () => {
    it("should successfully clock in a user", async () => {
      const { token } = await createMockIntern();
      
      const res = await request(app)
        .post("/api/dtr/time-in")
        .set("Authorization", `Bearer ${token}`);
        
      expect(res.status).toBe(200);
      expect(res.body.data).toBeDefined();
    });

    it("should return 409 Conflict if user is already clocked in", async () => {
      const { token } = await createMockIntern();
      
      // First time in
      await request(app).post("/api/dtr/time-in").set("Authorization", `Bearer ${token}`);
      
      // Second time in should conflict
      const res = await request(app)
        .post("/api/dtr/time-in")
        .set("Authorization", `Bearer ${token}`);
        
      expect(res.status).toBe(409);
      expect(res.body.code).toBe("ACTIVE_SESSION");
      expect(res.body).toHaveProperty("activeSession");
    });
  });

  describe("POST /api/dtr/time-out", () => {
    it("should return 400 if remarks are missing", async () => {
      const { token } = await createMockIntern();
      
      const res = await request(app)
        .post("/api/dtr/time-out")
        .set("Authorization", `Bearer ${token}`)
        .send({}); // Missing remarks
        
      expect(res.status).toBe(400);
      // Adjusted to match Zod's native error for undefined values
      expect(res.body.message).toMatch(/Invalid input/i); 
    });

    it("should successfully clock out a user", async () => {
      const { token } = await createMockIntern();
      
      // Must clock in first
      await request(app).post("/api/dtr/time-in").set("Authorization", `Bearer ${token}`);
      
      const res = await request(app)
        .post("/api/dtr/time-out")
        .set("Authorization", `Bearer ${token}`)
        .send({ remarks: "Finished my tasks for the day." });
        
      expect(res.status).toBe(200);
      expect(res.body.data).toBeDefined();
    });
  });

  describe("Break Endpoints", () => {
    it("should allow a user to start and end a break", async () => {
      const { token } = await createMockIntern();
      
      // Clock in
      await request(app).post("/api/dtr/time-in").set("Authorization", `Bearer ${token}`);
      
      // Start break
      const startRes = await request(app)
        .post("/api/dtr/break-start")
        .set("Authorization", `Bearer ${token}`)
        .send({ breakType: "lunch" });
        
      expect(startRes.status).toBe(200);
      
      // End break
      const endRes = await request(app)
        .post("/api/dtr/break-end")
        .set("Authorization", `Bearer ${token}`);
        
      expect(endRes.status).toBe(200);
    });
  });

  describe("GET /api/dtr/active-session", () => {
    it("should retrieve the active session for a clocked-in user", async () => {
      const { token } = await createMockIntern();
      
      await request(app).post("/api/dtr/time-in").set("Authorization", `Bearer ${token}`);
      
      const res = await request(app)
        .get("/api/dtr/active-session")
        .set("Authorization", `Bearer ${token}`);
        
      expect(res.status).toBe(200);
      expect(res.body.data).toHaveProperty("hasActiveSession", true);
    });
  });

  describe("Summary and History Endpoints", () => {
    it("should return the user's weekly summary", async () => {
      const { token } = await createMockIntern();
      
      const res = await request(app)
        .get("/api/dtr/summary/week")
        .set("Authorization", `Bearer ${token}`);
        
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("data"); 
    });

    it("should return paginated history", async () => {
      const { token } = await createMockIntern();
      
      const res = await request(app)
        .get("/api/dtr/history?page=1&limit=5")
        .set("Authorization", `Bearer ${token}`);
        
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("data");
    });
  });

});