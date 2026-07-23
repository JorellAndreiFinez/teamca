import { describe, it, expect, beforeAll } from "vitest";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import Department from "../models/Department.js";
import InternProfile from "../models/InternProfile.js";
import { checkEmail, login, completeSetup, logout } from "./authService.js";

// Ensure the JWT secret is available for these specific tests
beforeAll(() => {
  process.env.JWT_SECRET = "super_secret_test_key";
});

describe("Auth Service", () => {
  
  describe("checkEmail", () => {
    it("should return exists: false when user is not found", async () => {
      const result = await checkEmail("unknown@example.com");
      expect(result).toEqual({ exists: false, needsSetup: false });
    });

    it("should return exists: true and needsSetup: true for inactive users", async () => {
      await User.create({ email: "test@example.com", is_active: false });
      const result = await checkEmail("Test@example.com ");
      expect(result).toEqual({ exists: true, needsSetup: true });
    });

    it("should return exists: true and needsSetup: false for active users", async () => {
      await User.create({ email: "active@example.com", is_active: true });
      const result = await checkEmail("active@example.com");
      expect(result).toEqual({ exists: true, needsSetup: false });
    });
  });

  describe("login", () => {
    it("should throw an error for invalid email", async () => {
      await expect(
        login({ email: "wrong@example.com", password: "password123" })
      ).rejects.toThrow("Invalid credentials.");
    });

    it("should throw an error for incorrect password", async () => {
      const password_hash = await bcrypt.hash("correctpassword", 10);
      await User.create({ email: "user@example.com", password_hash, is_active: true });

      await expect(
        login({ email: "user@example.com", password: "wrongpassword" })
      ).rejects.toThrow("Invalid credentials.");
    });

    it("should throw an error if account is incomplete (not active)", async () => {
      const password_hash = await bcrypt.hash("password123", 10);
      await User.create({ email: "user@example.com", password_hash, is_active: false });

      await expect(
        login({ email: "user@example.com", password: "password123" })
      ).rejects.toThrow("Account setup is incomplete.");
    });

    it("should successfully log in and return token + safe user object", async () => {
      const password_hash = await bcrypt.hash("password123", 10);
      const user = await User.create({ 
        email: "user@example.com", 
        password_hash, 
        is_active: true,
        first_name: "John",
        last_name: "Doe"
      });

      const result = await login({ email: "user@example.com", password: "password123" });

      expect(result).toHaveProperty("token");
      expect(result.user).not.toHaveProperty("password_hash");
      expect(result.user.email).toBe("user@example.com");
      
      const decoded = jwt.verify(result.token, process.env.JWT_SECRET as string) as jwt.JwtPayload;
      expect(decoded.sub).toBe(String(user._id));
    });
  });

  describe("completeSetup", () => {
    const validSetupPayload = {
      email: "intern@example.com",
      first_name: "Jane",
      last_name: "Smith",
      password: "newpassword123",
      school_university: "State University",
      required_hours: 300,
    };

    it("should throw an error if school/university is missing", async () => {
      await expect(
        completeSetup({ ...validSetupPayload, school_university: "" })
      ).rejects.toThrow("School/University is required.");
    });

    it("should throw an error if department ID is invalid", async () => {
      await expect(
        completeSetup({ ...validSetupPayload, department_id: "invalid-id" })
      ).rejects.toThrow("Invalid department.");
    });

    it("should throw an error if email is not whitelisted (not in DB)", async () => {
      const dept = await Department.create({ department_name: "IT" });
      await expect(
        completeSetup({ ...validSetupPayload, department_id: String(dept._id) })
      ).rejects.toThrow("Email is not whitelisted.");
    });

    it("should throw an error if the user is already active", async () => {
      const dept = await Department.create({ department_name: "IT" });
      await User.create({ email: validSetupPayload.email, is_active: true });

      await expect(
        completeSetup({ ...validSetupPayload, department_id: String(dept._id) })
      ).rejects.toThrow("Account is already active.");
    });

    it("should successfully complete setup, update user, and create intern profile", async () => {
      const dept = await Department.create({ department_name: "IT" });
      const user = await User.create({ 
        email: validSetupPayload.email, 
        is_active: false,
        // FIX: department_id is now correctly assigned!
        departments: [{ department_id: dept._id, department_role: "Intern" }] 
      });

      const result = await completeSetup({ 
        ...validSetupPayload, 
        department_id: String(dept._id) 
      });

      expect(result).toHaveProperty("token");
      expect(result.user.is_active).toBe(true);
      expect(result.user.first_name).toBe("Jane");

      const updatedUser = await User.findById(user._id);
      expect(updatedUser?.is_active).toBe(true);
      expect(updatedUser?.password_hash).toBeDefined();
      expect(updatedUser?.departments?.[0].department_id.toString()).toBe(String(dept._id));

      const profile = await InternProfile.findOne({ user_id: user._id });
      expect(profile).toBeTruthy();
      expect(profile?.school_university).toBe("State University");
      expect(profile?.required_hours).toBe(300);
      expect(profile?.rendered_hours_total).toBe(0);
    });
  });

  describe("logout", () => {
    it("should return a success message", async () => {
      const result = await logout();
      expect(result).toEqual({ message: "Logged out successfully." });
    });
  });
});