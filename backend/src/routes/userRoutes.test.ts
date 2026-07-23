import { describe, it, expect, afterEach, vi } from "vitest";
import request from "supertest";
import express from "express";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import userRoutes from "./userRoutes.js";
import User from "../models/User.js";

// --- MOCK EXTERNAL SIDE EFFECTS ---
vi.mock("../socket/io.js", () => ({
  emitUsersDirectoryUpdated: vi.fn(),
  emitUsersNotification: vi.fn(),
}));

vi.mock("../services/notificationService.js", () => ({
  createNotificationsForRecipients: vi.fn().mockResolvedValue([]),
}));

// --- SETUP EXPRESS APP ---
const app = express();
app.use(express.json());
app.use("/api/users", userRoutes);

afterEach(async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
  vi.clearAllMocks();
});

// --- HELPER FUNCTIONS ---
const generateToken = (userId: mongoose.Types.ObjectId | string) => {
  // Use the controller's exact fallback secret so the middleware validates it correctly
  const secret = process.env.JWT_SECRET || "teamca-dev-secret-change-in-production";
  return jwt.sign({ user_id: String(userId) }, secret, { expiresIn: "1h" });
};

const createMockUser = async (role: "Superadmin" | "Admin" | "Standard_User" = "Standard_User") => {
  const user = await User.create({
    email: `${role.toLowerCase()}_${Date.now()}@example.com`,
    first_name: role,
    last_name: "User",
    global_role: role,
    is_active: true,
    password_hash: "hashedpassword123"
  });
  return { user, token: generateToken(user._id) };
};

describe("User Routes (/api/users)", () => {

  describe("GET /api/users", () => {
    it("should return 401 if no authentication token is provided", async () => {
      const res = await request(app).get("/api/users");
      expect(res.status).toBe(401);
    });

    it("should return 403 if a Standard_User tries to view all users", async () => {
      const { token } = await createMockUser("Standard_User");
      const res = await request(app)
        .get("/api/users")
        .set("Authorization", `Bearer ${token}`);
      
      expect(res.status).toBe(403);
    });

    it("should return 200 and a list of users for a Superadmin", async () => {
      const { token } = await createMockUser("Superadmin");
      await createMockUser("Standard_User");
      
      const res = await request(app)
        .get("/api/users")
        .set("Authorization", `Bearer ${token}`);
        
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe("GET /api/users/:userId", () => {
    it("should allow a user to fetch their own profile using 'me'", async () => {
      const { user, token } = await createMockUser("Standard_User");
      
      const res = await request(app)
        .get("/api/users/me")
        .set("Authorization", `Bearer ${token}`);
        
      expect(res.status).toBe(200);
      expect(res.body.data.email).toBe(user.email);
    });

    it("should return 404 for a non-existent user ID", async () => {
      const { token } = await createMockUser("Superadmin");
      const fakeId = new mongoose.Types.ObjectId();
      
      const res = await request(app)
        .get(`/api/users/${fakeId}`)
        .set("Authorization", `Bearer ${token}`);
        
      expect(res.status).toBe(404);
    });
  });

  describe("PUT /api/users/:userId", () => {
    it("should allow a user to update their own basic info", async () => {
      const { user, token } = await createMockUser("Standard_User");
      
      const res = await request(app)
        .put(`/api/users/${user._id}`)
        .set("Authorization", `Bearer ${token}`)
        .send({ first_name: "UpdatedName" });
        
      expect(res.status).toBe(200);
      expect(res.body.data.first_name).toBe("UpdatedName");
    });

    it("should block a Standard_User from updating their own global_role", async () => {
      const { user, token } = await createMockUser("Standard_User");
      
      const res = await request(app)
        .put(`/api/users/${user._id}`)
        .set("Authorization", `Bearer ${token}`)
        .send({ global_role: "Superadmin" });
        
      expect(res.status).toBe(403);
      expect(res.body.message).toMatch(/only edit your basic profile fields/i);
    });

    it("should allow a Superadmin to update another user's role", async () => {
      const superadmin = await createMockUser("Superadmin");
      const targetUser = await createMockUser("Standard_User");
      
      const res = await request(app)
        .put(`/api/users/${targetUser.user._id}`)
        .set("Authorization", `Bearer ${superadmin.token}`)
        .send({ global_role: "Admin" });
        
      expect(res.status).toBe(200);
      expect(res.body.data.global_role).toBe("Admin");
    });
  });

  describe("DELETE /api/users/:userId", () => {
    it("should block a Standard_User from deleting a user", async () => {
      const attacker = await createMockUser("Standard_User");
      const target = await createMockUser("Standard_User");
      
      const res = await request(app)
        .delete(`/api/users/${target.user._id}`)
        .set("Authorization", `Bearer ${attacker.token}`);
        
      expect(res.status).toBe(403);
    });

    it("should allow a Superadmin to delete a user", async () => {
      const admin = await createMockUser("Superadmin");
      const target = await createMockUser("Standard_User");
      
      const res = await request(app)
        .delete(`/api/users/${target.user._id}`)
        .set("Authorization", `Bearer ${admin.token}`);
        
      expect(res.status).toBe(200);
      
      // Verify deletion in DB
      const dbCheck = await User.findById(target.user._id);
      expect(dbCheck).toBeNull();
    });
  });
});