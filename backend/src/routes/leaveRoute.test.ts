import { describe, it, expect, beforeAll, afterEach, vi } from "vitest";
import request from "supertest";
import express from "express";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import leaveRoutes from "./leaveRoutes.js";
import User from "../models/User.js";

// --- FULLY MOCK THE LEAVE SERVICE ---
vi.mock("../services/leaveService.js", () => ({
  createLeave: vi.fn().mockImplementation((payload) => {
    // Manually simulate the Zod validation failure the controller expects to catch
    if (new Date(payload.startDate) > new Date(payload.endDate)) {
      throw new Error("startDate must be before or equal to endDate");
    }
    return Promise.resolve({
      _id: "leave123",
      userId: payload.userId,
      leaveType: payload.leaveType,
      status: "pending"
    });
  }),
  getMyLeaves: vi.fn().mockResolvedValue([{ _id: "leave123", status: "pending" }]),
  getPendingLeaves: vi.fn().mockResolvedValue([{ _id: "leave456", status: "pending" }]),
  approveLeave: vi.fn().mockResolvedValue({ _id: "leave456", status: "approved" }),
  rejectLeave: vi.fn().mockResolvedValue({ _id: "leave456", status: "rejected" }),
  cancelLeave: vi.fn().mockResolvedValue({ _id: "leave123", status: "cancelled" }),
}));

vi.mock("../utils/activityLogPayload.js", () => ({
  compactActivityChanges: vi.fn().mockReturnValue({}),
  logActivityForRequest: vi.fn().mockResolvedValue(undefined),
  optionalActivityText: vi.fn().mockReturnValue(""),
}));

// --- SETUP EXPRESS APP ---
const app = express();
app.use(express.json());

// The leaveRoutes module imports its own authMiddleware natively, 
// so we don't need a custom local mock anymore!
app.use("/api/leave", leaveRoutes);

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

const createMockUser = async (role: "Superadmin" | "Admin" | "Standard_User" = "Standard_User", deptRole: string = "Intern") => {
  const user = await User.create({
    email: `leaveuser_${role}_${Date.now()}@example.com`,
    first_name: role,
    last_name: "User",
    global_role: role,
    is_active: true,
    password_hash: "hashedpassword123",
    // FIX: Saving the department directly to the DB so the real authMiddleware finds it!
    departments: [{ 
      department_id: new mongoose.Types.ObjectId(), 
      department_role: deptRole 
    }]
  });
  return { user, token: generateToken(user._id) };
};

describe("Leave Routes (/api/leave)", () => {

  describe("POST /api/leave", () => {
    it("should allow an authenticated user to create a leave request", async () => {
      const { token } = await createMockUser("Standard_User");
      
      const res = await request(app)
        .post("/api/leave")
        .set("Authorization", `Bearer ${token}`)
        .send({
          leaveType: "sick",
          startDate: new Date(Date.now() + 86400000).toISOString(),
          endDate: new Date(Date.now() + 172800000).toISOString(),
          reason: "Not feeling well"
        });

      expect(res.status).toBe(201);
      expect(res.body.data).toHaveProperty("status", "pending");
    });

    it("should return 400 for invalid dates (Zod schema validation)", async () => {
      const { token } = await createMockUser("Standard_User");
      
      const res = await request(app)
        .post("/api/leave")
        .set("Authorization", `Bearer ${token}`)
        .send({
          leaveType: "sick",
          startDate: new Date(Date.now() + 172800000).toISOString(), // Start is AFTER end
          endDate: new Date(Date.now() + 86400000).toISOString(),
          reason: "Time travel sickness"
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/must be before or equal to endDate/i);
    });
  });

  describe("GET /api/leave/me", () => {
    it("should return the user's leave history", async () => {
      const { token } = await createMockUser("Standard_User");
      
      const res = await request(app)
        .get("/api/leave/me")
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });

  describe("GET /api/leave/pending", () => {
    it("should block a Standard_User (Intern) from viewing all pending leaves", async () => {
      const { token } = await createMockUser("Standard_User", "Intern");
      
      const res = await request(app)
        .get("/api/leave/pending")
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(403);
    });

    it("should allow a Superadmin to view pending leaves", async () => {
      const { token } = await createMockUser("Superadmin");
      
      const res = await request(app)
        .get("/api/leave/pending")
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });

  describe("PATCH /api/leave/:leaveId/approve", () => {
    it("should allow a Head to approve a leave", async () => {
      const { token } = await createMockUser("Standard_User", "Head");
      
      const res = await request(app)
        .patch("/api/leave/leave456/approve")
        .set("Authorization", `Bearer ${token}`)
        .send({ status: "approved" });

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveProperty("status", "approved");
    });

    it("should return 400 if a rejection is missing a reason", async () => {
      const { token } = await createMockUser("Superadmin");
      
      const res = await request(app)
        .patch("/api/leave/leave456/approve")
        .set("Authorization", `Bearer ${token}`)
        .send({ status: "rejected" }); // Missing rejectionReason

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/rejectionReason is required/i);
    });
  });

});