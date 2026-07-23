import { describe, it, expect, beforeAll, afterEach } from "vitest";
import request from "supertest";
import express from "express";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import authRoutes from "./authRoutes.js";
import User from "../models/User.js";
import Department from "../models/Department.js";
import InternProfile from "../models/InternProfile.js";

// --- SETUP EXPRESS APP FOR SUPERTEST ---
const app = express();
app.use(express.json()); // Required to parse req.body
app.use("/api/auth", authRoutes);

beforeAll(() => {
  process.env.JWT_SECRET = "super_secret_test_key";
});

afterEach(async () => {
  // Clear the database collections between each test
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
});

describe("Auth Routes (/api/auth)", () => {

  describe("POST /check-email", () => {
    it("should return 400 if email is missing", async () => {
      const res = await request(app).post("/api/auth/check-email").send({});
      expect(res.status).toBe(400);
      expect(res.body.message).toBe("Email is required");
    });

    it("should return exists: false for unknown email", async () => {
      const res = await request(app)
        .post("/api/auth/check-email")
        .send({ email: "unknown@example.com" });
      
      expect(res.status).toBe(200);
      expect(res.body.data).toEqual({ exists: false, needsSetup: false });
    });

    it("should return needsSetup: true for whitelisted inactive users", async () => {
      await User.create({ email: "whitelisted@example.com", is_active: false });
      
      const res = await request(app)
        .post("/api/auth/check-email")
        .send({ email: " whitelisted@example.com " }); // tests trimming
        
      expect(res.status).toBe(200);
      expect(res.body.data).toEqual({ exists: true, needsSetup: true });
    });
  });

  describe("POST /login", () => {
    it("should return 401 for invalid credentials (user not found)", async () => {
      const res = await request(app)
        .post("/api/auth/login")
        .send({ email: "wrong@example.com", password: "Password123!" });
        
      expect(res.status).toBe(401);
      expect(res.body.message).toMatch(/Invalid email or password/i);
    });

    it("should return 403 if account setup is incomplete", async () => {
      await User.create({ email: "user@example.com", is_active: false });
      
      const res = await request(app)
        .post("/api/auth/login")
        .send({ email: "user@example.com", password: "Password123!" });
        
      expect(res.status).toBe(403);
      expect(res.body.message).toMatch(/setup is incomplete/i);
    });

    it("should successfully login and return a token", async () => {
      const password_hash = await bcrypt.hash("ValidPass123!", 10);
      await User.create({ 
        email: "active@example.com", 
        password_hash, 
        is_active: true,
        first_name: "Active",
        last_name: "User"
      });

      const res = await request(app)
        .post("/api/auth/login")
        .send({ email: "active@example.com", password: "ValidPass123!" });

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveProperty("token");
      expect(res.body.data.user.email).toBe("active@example.com");
    });
  });

  describe("POST /complete-setup", () => {
    const validPayload = {
      email: "newintern@example.com",
      first_name: "John",
      last_name: "Doe",
      password: "StrongPassword123",
      school_university: "Tech University",
      required_hours: 400,
    };

    it("should return 400 if required fields are missing", async () => {
      const res = await request(app)
        .post("/api/auth/complete-setup")
        .send({ email: "newintern@example.com" }); // Missing other fields
        
      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/Missing required fields/i);
    });

    it("should return 400 for weak passwords", async () => {
      const res = await request(app)
        .post("/api/auth/complete-setup")
        .send({ 
          ...validPayload, 
          department_id: new mongoose.Types.ObjectId().toString(), // Added to bypass the missing fields check
          password: "weak" 
        });
        
      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/at least 8 characters/i);
    });

    it("should return 404 if email is not whitelisted", async () => {
      const dept = await Department.create({ department_name: "QA" });
      const res = await request(app)
        .post("/api/auth/complete-setup")
        .send({ ...validPayload, department_id: String(dept._id) });
        
      expect(res.status).toBe(404);
      expect(res.body.message).toMatch(/not whitelisted/i);
    });

    it("should successfully complete setup and return a token", async () => {
      const dept = await Department.create({ department_name: "Engineering" });
      const user = await User.create({ 
        email: validPayload.email, 
        is_active: false,
        departments: [{ department_id: dept._id, department_role: "Intern" }] 
      });

      const res = await request(app)
        .post("/api/auth/complete-setup")
        .send({ ...validPayload, department_id: String(dept._id) });

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveProperty("token");
      expect(res.body.data.user.is_active).toBe(true);
      expect(res.body.data.user.first_name).toBe("John");

      const profile = await InternProfile.findOne({ user_id: user._id });
      expect(profile).toBeTruthy();
      expect(profile?.school_university).toBe("Tech University");
      expect(profile?.required_hours).toBe(400);
    });
  });
});