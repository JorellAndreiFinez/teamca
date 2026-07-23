import { describe, it, expect, beforeAll, afterEach, vi } from "vitest";
import request from "supertest";
import express from "express";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import taskRoutes from "./taskRoutes.js";
import User from "../models/User.js";
import Department from "../models/Department.js";

// --- MOCK EXTERNAL SIDE EFFECTS ---
vi.mock("../socket/io.js", () => ({
  emitTaskCommentCreated: vi.fn(),
  emitTaskStatusUpdated: vi.fn(),
  emitUsersNotification: vi.fn(),
}));

vi.mock("../services/notificationService.js", () => ({
  createNotificationsForRecipients: vi.fn().mockResolvedValue([]),
}));

vi.mock("../services/deadlineService.js", () => ({
  emitDeadlineNotificationsForTask: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("../utils/activityLogPayload.js", () => ({
  compactActivityChanges: vi.fn().mockReturnValue({}),
  logActivityForRequest: vi.fn().mockResolvedValue(undefined),
  optionalActivityText: vi.fn().mockReturnValue(""),
  safeActivityText: vi.fn().mockReturnValue(""),
}));

// --- FULLY MOCK THE TASK SERVICE ---
// By mocking the service layer, we isolate our route/controller tests.
// This prevents 500 errors caused by deep database operations failing on mock data.
vi.mock("../services/taskService.js", () => ({
  createTaskWithAssignment: vi.fn().mockResolvedValue({
    task: { task_id: "task123", title: "Test Feature Implementation", status: "Not Started" },
    assignments: [{ assigned_to: "mockuser123" }]
  }),
  getTaskDetail: vi.fn().mockResolvedValue({
    task_id: "task456",
    title: "Inspect System Logs",
    description: "Check for anomalies",
    status: "Not Started"
  }),
  addTaskComment: vi.fn().mockResolvedValue({
    comment_id: "comment789",
    message: "Looking into this right now.",
    user: { first_name: "Superadmin" }
  }),
  listAccessibleTasks: vi.fn().mockResolvedValue([]),
  listAccessibleTasksPaginated: vi.fn().mockResolvedValue({ items: [], total: 0 }),
}));

// --- SETUP EXPRESS APP ---
const app = express();
app.use(express.json());

app.use((req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ message: "Authentication required." });
  }
  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as jwt.JwtPayload;
    req.user = {
      user_id: decoded.user_id,
      email: "test@example.com",
      global_role: decoded.global_role || "Standard_User",
      departments: decoded.departments || []
    } as any;
    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid token." });
  }
});

app.use("/api/tasks", taskRoutes);

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
const generateToken = (userId: mongoose.Types.ObjectId | string, role: string, deptId?: mongoose.Types.ObjectId) => {
  const secret = process.env.JWT_SECRET || "teamca-dev-secret-change-in-production";
  return jwt.sign({ 
    user_id: String(userId), 
    global_role: role,
    departments: deptId ? [{ department_id: String(deptId), department_role: role === "Admin" ? "Head" : "Intern" }] : []
  }, secret, { expiresIn: "1h" });
};

const createMockUser = async (role: "Superadmin" | "Admin" | "Standard_User" = "Superadmin", deptId?: mongoose.Types.ObjectId) => {
  const user = await User.create({
    email: `taskuser_${role}_${Date.now()}@example.com`,
    first_name: role,
    last_name: "User",
    global_role: role,
    is_active: true,
    password_hash: "hashedpassword123",
    departments: deptId ? [{ department_id: deptId, department_role: role === "Admin" ? "Head" : "Intern" }] : []
  });
  return { user, token: generateToken(user._id, role, deptId) };
};

describe("Task Routes (/api/tasks)", () => {

  describe("GET /api/tasks", () => {
    it("should return 401 if unauthenticated", async () => {
      const res = await request(app).get("/api/tasks");
      expect(res.status).toBe(401);
    });

    it("should list tasks for an authenticated user", async () => {
      const { token } = await createMockUser("Standard_User");
      
      const res = await request(app)
        .get("/api/tasks?paginate=false")
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });

  describe("POST /api/tasks", () => {
    it("should allow a privileged user or supervisor to create a task", async () => {
      const dept = await Department.create({ department_name: "Engineering" });
      const { user, token } = await createMockUser("Superadmin", dept._id);

      const taskPayload = {
        title: "Test Feature Implementation",
        description: "Implement API tests",
        priority: "High", 
        assigned_to: [String(user._id)],
        deadline: new Date(Date.now() + 86400000).toISOString()
      };

      const res = await request(app)
        .post("/api/tasks")
        .set("Authorization", `Bearer ${token}`)
        .send(taskPayload);

      expect(res.status).toBe(201);
      // Because we mocked the service, we assert on the mocked return value
      expect(res.body.data.task).toHaveProperty("title", "Test Feature Implementation");
    });
  });

  describe("GET /api/tasks/:taskId", () => {
    it("should return 404 for a task that does not exist", async () => {
      // Temporarily override the mock to simulate a "not found" error for this test
      const { getTaskDetail } = await import("../services/taskService.js");
      vi.mocked(getTaskDetail).mockRejectedValueOnce(new Error("Task not found."));

      const { token } = await createMockUser("Superadmin");
      const fakeId = new mongoose.Types.ObjectId();

      const res = await request(app)
        .get(`/api/tasks/${fakeId}`)
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(404);
    });

    it("should fetch task details successfully", async () => {
      const { token } = await createMockUser("Superadmin");
      
      const fakeId = new mongoose.Types.ObjectId();
      const res = await request(app)
        .get(`/api/tasks/${fakeId}`)
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(200);
      // Asserting against the mocked service response
      expect(res.body.data).toHaveProperty("title", "Inspect System Logs");
    });
  });

  describe("POST /api/tasks/:taskId/comments", () => {
    it("should allow adding a comment to a task", async () => {
      const { token } = await createMockUser("Superadmin");
      
      const fakeId = new mongoose.Types.ObjectId();
      const res = await request(app)
        .post(`/api/tasks/${fakeId}/comments`)
        .set("Authorization", `Bearer ${token}`)
        .send({ message: "Looking into this right now." });

      expect(res.status).toBe(201);
      // Asserting against the mocked service response
      expect(res.body.data).toHaveProperty("message", "Looking into this right now.");
    });
  });

});