import { describe, expect, it } from "vitest";
import { createUser, updateUser } from "./userService.js";
import User from "../models/User.js";
import Department from "../models/Department.js";
import { makeDepartment, makeUser } from "../__tests__/factories.js";

describe("userService.updateUser — department assignments", () => {
  it("assigns a user to a department from an empty state", async () => {
    const user = await makeUser();
    const dept = await makeDepartment();

    await updateUser(String(user._id), {
      departments: [
        { department_id: String(dept._id), department_role: "Intern" },
      ],
    });

    const fresh = await User.findById(user._id);
    expect(fresh?.departments.length).toBe(1);
    expect(String(fresh?.departments[0].department_id)).toBe(String(dept._id));
    expect(fresh?.departments[0].department_role).toBe("Intern");
  });

  it("assigns a user to multiple departments", async () => {
    const user = await makeUser();
    const a = await makeDepartment({ department_name: "Alpha" });
    const b = await makeDepartment({ department_name: "Beta" });

    await updateUser(String(user._id), {
      departments: [
        { department_id: String(a._id), department_role: "Intern" },
        { department_id: String(b._id), department_role: "Supervisor" },
      ],
    });

    const fresh = await User.findById(user._id);
    expect(fresh?.departments.length).toBe(2);
    const roleByDept = new Map(
      fresh!.departments.map((d) => [String(d.department_id), d.department_role]),
    );
    expect(roleByDept.get(String(a._id))).toBe("Intern");
    expect(roleByDept.get(String(b._id))).toBe("Supervisor");
  });

  it("removes a department assignment when omitted from the new array", async () => {
    const a = await makeDepartment();
    const b = await makeDepartment();
    const user = await makeUser({
      departments: [
        { department_id: a._id, department_role: "Intern" },
        { department_id: b._id, department_role: "Intern" },
      ],
    });

    await updateUser(String(user._id), {
      departments: [
        { department_id: String(a._id), department_role: "Intern" },
      ],
    });

    const fresh = await User.findById(user._id);
    expect(fresh?.departments.length).toBe(1);
    expect(String(fresh?.departments[0].department_id)).toBe(String(a._id));
  });

  it("changes the role of an existing assignment", async () => {
    const dept = await makeDepartment();
    const user = await makeUser({
      departments: [{ department_id: dept._id, department_role: "Intern" }],
    });

    await updateUser(String(user._id), {
      departments: [
        { department_id: String(dept._id), department_role: "Supervisor" },
      ],
    });

    const fresh = await User.findById(user._id);
    expect(fresh?.departments[0].department_role).toBe("Supervisor");
  });

  it("clears all assignments when given an empty array", async () => {
    const dept = await makeDepartment();
    const user = await makeUser({
      departments: [{ department_id: dept._id, department_role: "Intern" }],
    });

    await updateUser(String(user._id), { departments: [] });

    const fresh = await User.findById(user._id);
    expect(fresh?.departments.length).toBe(0);
  });

  it("leaves departments untouched when departments key is not in the payload", async () => {
    const dept = await makeDepartment();
    const user = await makeUser({
      first_name: "Old",
      departments: [{ department_id: dept._id, department_role: "Intern" }],
    });

    await updateUser(String(user._id), { first_name: "New" });

    const fresh = await User.findById(user._id);
    expect(fresh?.first_name).toBe("New");
    expect(fresh?.departments.length).toBe(1);
  });
});

describe("userService.updateUser — head sync to Department", () => {
  it("setting a user's role to Head updates Department.department_head", async () => {
    const dept = await makeDepartment();
    const user = await makeUser();

    await updateUser(String(user._id), {
      departments: [
        { department_id: String(dept._id), department_role: "Head" },
      ],
    });

    const refreshedDept = await Department.findById(dept._id);
    expect(String(refreshedDept?.department_head)).toBe(String(user._id));
  });

  it("promoting a user to Head demotes the previous head", async () => {
    const prevHead = await makeUser();
    const dept = await makeDepartment({ department_head: prevHead._id });
    await User.updateOne(
      { _id: prevHead._id },
      {
        $push: {
          departments: { department_id: dept._id, department_role: "Head" },
        },
      },
    );
    const newHead = await makeUser();

    await updateUser(String(newHead._id), {
      departments: [
        { department_id: String(dept._id), department_role: "Head" },
      ],
    });

    const refreshedDept = await Department.findById(dept._id);
    expect(String(refreshedDept?.department_head)).toBe(String(newHead._id));

    const prevFresh = await User.findById(prevHead._id);
    const prevAssignment = prevFresh?.departments.find(
      (d) => String(d.department_id) === String(dept._id),
    );
    expect(prevAssignment?.department_role).toBe("Supervisor");
  });

  it("demoting the current head clears Department.department_head", async () => {
    const head = await makeUser();
    const dept = await makeDepartment({ department_head: head._id });
    await User.updateOne(
      { _id: head._id },
      {
        $push: {
          departments: { department_id: dept._id, department_role: "Head" },
        },
      },
    );

    await updateUser(String(head._id), {
      departments: [
        { department_id: String(dept._id), department_role: "Supervisor" },
      ],
    });

    const refreshedDept = await Department.findById(dept._id);
    expect(refreshedDept?.department_head).toBeNull();
  });

  it("removing the head from the department altogether clears Department.department_head", async () => {
    const head = await makeUser();
    const dept = await makeDepartment({ department_head: head._id });
    await User.updateOne(
      { _id: head._id },
      {
        $push: {
          departments: { department_id: dept._id, department_role: "Head" },
        },
      },
    );

    await updateUser(String(head._id), { departments: [] });

    const refreshedDept = await Department.findById(dept._id);
    expect(refreshedDept?.department_head).toBeNull();
  });

  it("does not touch other departments where the user is not the head", async () => {
    const otherHead = await makeUser();
    const otherDept = await makeDepartment({ department_head: otherHead._id });
    await User.updateOne(
      { _id: otherHead._id },
      {
        $push: {
          departments: { department_id: otherDept._id, department_role: "Head" },
        },
      },
    );

    const user = await makeUser();
    const dept = await makeDepartment();

    await updateUser(String(user._id), {
      departments: [
        { department_id: String(dept._id), department_role: "Intern" },
      ],
    });

    const refreshedOther = await Department.findById(otherDept._id);
    expect(String(refreshedOther?.department_head)).toBe(String(otherHead._id));
  });
});

describe("userService.createUser — department assignment", () => {
  it("persists a department assignment passed in the departments array", async () => {
    const dept = await makeDepartment();

    const created = await createUser({
      first_name: "Alice",
      last_name: "Anderson",
      email: "alice@test.local",
      password_hash: "x",
      global_role: "Standard_User",
      departments: [
        { department_id: String(dept._id), department_role: "Intern" },
      ],
    });

    const fresh = await User.findById(created!._id);
    expect(fresh?.departments.length).toBe(1);
    expect(String(fresh?.departments[0].department_id)).toBe(String(dept._id));
    expect(fresh?.departments[0].department_role).toBe("Intern");
  });

  it("creates a user with no department when array is empty or omitted", async () => {
    const created = await createUser({
      first_name: "Bob",
      last_name: "Brown",
      email: "bob@test.local",
      password_hash: "x",
      global_role: "Standard_User",
    });

    const fresh = await User.findById(created!._id);
    expect(fresh?.departments.length).toBe(0);
  });

  it("setting role=Head on creation updates Department.department_head", async () => {
    const dept = await makeDepartment();

    const created = await createUser({
      first_name: "Carol",
      last_name: "Chen",
      email: "carol@test.local",
      password_hash: "x",
      global_role: "Admin",
      departments: [
        { department_id: String(dept._id), department_role: "Head" },
      ],
    });

    const refreshedDept = await Department.findById(dept._id);
    expect(String(refreshedDept?.department_head)).toBe(String(created!._id));
  });

  it("promoting on creation demotes a previous head of the same department", async () => {
    const prevHead = await makeUser();
    const dept = await makeDepartment({ department_head: prevHead._id });
    await User.updateOne(
      { _id: prevHead._id },
      {
        $push: {
          departments: { department_id: dept._id, department_role: "Head" },
        },
      },
    );

    const created = await createUser({
      first_name: "Dana",
      last_name: "Diaz",
      email: "dana@test.local",
      password_hash: "x",
      global_role: "Admin",
      departments: [
        { department_id: String(dept._id), department_role: "Head" },
      ],
    });

    const refreshedDept = await Department.findById(dept._id);
    expect(String(refreshedDept?.department_head)).toBe(String(created!._id));

    const prevFresh = await User.findById(prevHead._id);
    const prevAssignment = prevFresh?.departments.find(
      (d) => String(d.department_id) === String(dept._id),
    );
    expect(prevAssignment?.department_role).toBe("Supervisor");
  });
});
