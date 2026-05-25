import { describe, expect, it } from "vitest";
import mongoose from "mongoose";
import {
  createDepartment,
  deleteDepartment,
  getAllDepartments,
  getDepartmentById,
  updateDepartment,
} from "./departmentService.js";
import User from "../models/User.js";
import Department from "../models/Department.js";
import { makeDepartment, makeUser } from "../__tests__/factories.js";

describe("departmentService — member counts", () => {
  it("returns 0 for departments with no members", async () => {
    const dept = await makeDepartment({ department_name: "Engineering" });
    const all = await getAllDepartments();
    const found = all.find((d) => String(d._id) === String(dept._id));
    expect(found?.member_count).toBe(0);
  });

  it("counts members assigned via departments[] array", async () => {
    const dept = await makeDepartment({ department_name: "Engineering" });
    await makeUser({ departments: [{ department_id: dept._id, department_role: "Intern" }] });
    await makeUser({ departments: [{ department_id: dept._id, department_role: "Supervisor" }] });
    await makeUser({ departments: [{ department_id: dept._id, department_role: "Intern" }] });

    const all = await getAllDepartments();
    const found = all.find((d) => String(d._id) === String(dept._id));
    expect(found?.member_count).toBe(3);
  });

  it("only counts users that are members of the queried department", async () => {
    const a = await makeDepartment({ department_name: "Alpha" });
    const b = await makeDepartment({ department_name: "Beta" });
    await makeUser({ departments: [{ department_id: a._id, department_role: "Intern" }] });
    await makeUser({ departments: [{ department_id: a._id, department_role: "Intern" }] });
    await makeUser({ departments: [{ department_id: b._id, department_role: "Intern" }] });

    const all = await getAllDepartments();
    expect(all.find((d) => String(d._id) === String(a._id))?.member_count).toBe(2);
    expect(all.find((d) => String(d._id) === String(b._id))?.member_count).toBe(1);
  });

  it("counts a user once even if they are in the department twice in the array", async () => {
    const dept = await makeDepartment();
    await makeUser({
      departments: [
        { department_id: dept._id, department_role: "Intern" },
        { department_id: dept._id, department_role: "Supervisor" },
      ],
    });

    const all = await getAllDepartments();
    expect(all.find((d) => String(d._id) === String(dept._id))?.member_count).toBe(2);
  });

  it("getDepartmentById returns member_count", async () => {
    const dept = await makeDepartment();
    await makeUser({ departments: [{ department_id: dept._id, department_role: "Intern" }] });

    const found = await getDepartmentById(String(dept._id));
    expect(found?.member_count).toBe(1);
  });

  it("returns role_counts breakdown for each department", async () => {
    const dept = await makeDepartment();
    await makeUser({ departments: [{ department_id: dept._id, department_role: "Head" }] });
    await makeUser({ departments: [{ department_id: dept._id, department_role: "Supervisor" }] });
    await makeUser({ departments: [{ department_id: dept._id, department_role: "Supervisor" }] });
    await makeUser({ departments: [{ department_id: dept._id, department_role: "Intern" }] });
    await makeUser({ departments: [{ department_id: dept._id, department_role: "Intern" }] });
    await makeUser({ departments: [{ department_id: dept._id, department_role: "Intern" }] });

    const all = await getAllDepartments();
    const found = all.find((d) => String(d._id) === String(dept._id));
    expect(found?.role_counts).toEqual({ Head: 1, Supervisor: 2, Intern: 3 });
    expect(found?.member_count).toBe(6);
  });

  it("role_counts defaults to zero buckets when department is empty", async () => {
    const dept = await makeDepartment();
    const all = await getAllDepartments();
    const found = all.find((d) => String(d._id) === String(dept._id));
    expect(found?.role_counts).toEqual({ Head: 0, Supervisor: 0, Intern: 0 });
  });
});

describe("departmentService — head assignment sync", () => {
  it("createDepartment with a head promotes the user and adds membership", async () => {
    const user = await makeUser({ global_role: "Admin" });
    const dept = await createDepartment("Engineering", undefined, String(user._id));

    const fresh = await User.findById(user._id);
    expect(fresh?.departments.length).toBe(1);
    expect(String(fresh?.departments[0].department_id)).toBe(String(dept._id));
    expect(fresh?.departments[0].department_role).toBe("Head");
  });

  it("createDepartment promotes an existing supervisor to Head without duplicating membership", async () => {
    const dept = await makeDepartment();
    const user = await makeUser({
      global_role: "Admin",
      departments: [{ department_id: dept._id, department_role: "Supervisor" }],
    });

    await updateDepartment(String(dept._id), { department_head: String(user._id) });

    const fresh = await User.findById(user._id);
    expect(fresh?.departments.length).toBe(1);
    expect(fresh?.departments[0].department_role).toBe("Head");
  });

  it("changing the head demotes the previous head to Supervisor", async () => {
    const prevHead = await makeUser({ global_role: "Admin" });
    const dept = await createDepartment("Eng", undefined, String(prevHead._id));

    const newHead = await makeUser({ global_role: "Admin" });
    await updateDepartment(String(dept._id), { department_head: String(newHead._id) });

    const prevFresh = await User.findById(prevHead._id);
    const prevAssignment = prevFresh?.departments.find(
      (d) => String(d.department_id) === String(dept._id),
    );
    expect(prevAssignment?.department_role).toBe("Supervisor");

    const newFresh = await User.findById(newHead._id);
    const newAssignment = newFresh?.departments.find(
      (d) => String(d.department_id) === String(dept._id),
    );
    expect(newAssignment?.department_role).toBe("Head");
  });

  it("re-assigning the same user as head is a no-op on their role", async () => {
    const head = await makeUser({ global_role: "Admin" });
    const dept = await createDepartment("Eng", undefined, String(head._id));

    await updateDepartment(String(dept._id), { department_head: String(head._id) });

    const fresh = await User.findById(head._id);
    expect(fresh?.departments.length).toBe(1);
    expect(fresh?.departments[0].department_role).toBe("Head");
  });

  it("clearing the head demotes them to Supervisor and unsets department_head", async () => {
    const head = await makeUser({ global_role: "Admin" });
    const dept = await createDepartment("Eng", undefined, String(head._id));

    await updateDepartment(String(dept._id), { department_head: null });

    const refreshedDept = await Department.findById(dept._id);
    expect(refreshedDept?.department_head).toBeNull();

    const fresh = await User.findById(head._id);
    const assignment = fresh?.departments.find(
      (d) => String(d.department_id) === String(dept._id),
    );
    expect(assignment?.department_role).toBe("Supervisor");
  });

  it("rejects a head reference to a non-existent user", async () => {
    const ghostId = new mongoose.Types.ObjectId().toString();
    await expect(createDepartment("Eng", undefined, ghostId)).rejects.toThrow(
      /not found/i,
    );
  });
});

describe("departmentService — deletion guard", () => {
  it("blocks deletion when the department still has members, with a message", async () => {
    const dept = await makeDepartment();
    await makeUser({ departments: [{ department_id: dept._id, department_role: "Intern" }] });
    await makeUser({ departments: [{ department_id: dept._id, department_role: "Intern" }] });

    await expect(deleteDepartment(String(dept._id))).rejects.toThrow(/2 existing member/);
    expect(await Department.findById(dept._id)).not.toBeNull();
  });

  it("allows deletion when the department has no members", async () => {
    const dept = await makeDepartment();
    const result = await deleteDepartment(String(dept._id));
    expect(result).not.toBeNull();
    expect(await Department.findById(dept._id)).toBeNull();
  });

  it("rejects deletion of a non-existent department", async () => {
    const ghostId = new mongoose.Types.ObjectId().toString();
    await expect(deleteDepartment(ghostId)).rejects.toThrow(/not found/i);
  });
});

describe("departmentService — name validation", () => {
  it("rejects duplicate department names on create", async () => {
    await makeDepartment({ department_name: "Engineering" });
    await expect(createDepartment("Engineering")).rejects.toThrow(/already exists/i);
  });

  it("rejects duplicate department names on update", async () => {
    await makeDepartment({ department_name: "Engineering" });
    const b = await makeDepartment({ department_name: "Sales" });
    await expect(
      updateDepartment(String(b._id), { department_name: "Engineering" }),
    ).rejects.toThrow(/already exists/i);
  });

  it("trims whitespace from department name on create", async () => {
    const dept = await createDepartment("  Engineering  ");
    expect(dept.department_name).toBe("Engineering");
  });
});
