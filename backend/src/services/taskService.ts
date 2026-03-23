import { Types } from "mongoose";
import Task, { type ITask, type TaskPriority } from "../models/Task";
import TaskAssignment from "../models/TaskAssignment";
import User, { type IUser } from "../models/User";

type ActorRole = IUser["global_role"];
type ActorDepartmentRole = NonNullable<IUser["department_role"]>;

export type CreateTaskInput = {
  title: string;
  description?: string;
  priority?: TaskPriority;
  deadline: Date;
  assigned_to?: string;
};

export type AssignTaskInput = {
  taskId: string;
  assignedToUserId: string;
};

const canManageGlobally = (globalRole: ActorRole): boolean => {
  return globalRole === "Superadmin" || globalRole === "Admin";
};

const canManageDepartment = (departmentRole?: ActorDepartmentRole): boolean => {
  return departmentRole === "Head" || departmentRole === "Supervisor";
};

const normalizeTask = (task: ITask) => ({
  task_id: String(task._id),
  title: task.title,
  description: task.description ?? "",
  created_by: String(task.created_by),
  status: task.status,
  priority: task.priority,
  deadline: task.deadline,
  created_at: task.created_at,
});

const normalizeAssignment = (assignment: { _id: Types.ObjectId; task_id: Types.ObjectId; assigned_to: Types.ObjectId; assigned_at: Date; }) => ({
  assignment_id: String(assignment._id),
  task_id: String(assignment.task_id),
  assigned_to: String(assignment.assigned_to),
  assigned_at: assignment.assigned_at,
});

const ensureAssigneeExists = async (assigneeUserId: string) => {
  const assignee = await User.findById(assigneeUserId)
    .select("global_role department_role department_id is_active")
    .lean();

  if (!assignee || !assignee.is_active) {
    throw new Error("Assignee does not exist or is inactive.");
  }

  return assignee;
};

const assertCanAssign = async (
  actor: Express.AuthUser,
  assigneeUserId: string,
): Promise<void> => {
  const actorId = String(actor.user_id);

  if (canManageGlobally(actor.global_role)) {
    await ensureAssigneeExists(assigneeUserId);
    return;
  }

  if (canManageDepartment(actor.department_role)) {
    const assignee = await ensureAssigneeExists(assigneeUserId);

    if (!actor.department_id || !assignee.department_id || String(actor.department_id) !== String(assignee.department_id)) {
      throw new Error("Department managers can only assign tasks within their department.");
    }

    return;
  }

  if (actorId !== assigneeUserId) {
    throw new Error("Standard users can only assign tasks to themselves.");
  }

  await ensureAssigneeExists(assigneeUserId);
};

export const createTaskWithAssignment = async (
  actor: Express.AuthUser,
  input: CreateTaskInput,
) => {
  const actorId = String(actor.user_id);
  const assigneeUserId = input.assigned_to ?? actorId;

  await assertCanAssign(actor, assigneeUserId);

  const task = await Task.create({
    title: input.title,
    description: input.description,
    created_by: actor.user_id,
    priority: input.priority ?? "Medium",
    deadline: input.deadline,
    status: "Not Started",
  });

  const assignment = await TaskAssignment.create({
    task_id: task._id,
    assigned_to: assigneeUserId,
  });

  return {
    task: normalizeTask(task),
    assignment: normalizeAssignment({
      _id: assignment._id as Types.ObjectId,
      task_id: assignment.task_id as Types.ObjectId,
      assigned_to: assignment.assigned_to as Types.ObjectId,
      assigned_at: assignment.assigned_at,
    }),
  };
};

export const assignTask = async (actor: Express.AuthUser, input: AssignTaskInput) => {
  const task = await Task.findById(input.taskId).lean();
  if (!task) {
    throw new Error("Task not found.");
  }

  await assertCanAssign(actor, input.assignedToUserId);

  if (canManageDepartment(actor.department_role) && !canManageGlobally(actor.global_role)) {
    const taskCreator = await User.findById(task.created_by)
      .select("department_id")
      .lean();

    if (!taskCreator?.department_id || !actor.department_id || String(taskCreator.department_id) !== String(actor.department_id)) {
      throw new Error("Department managers can only assign tasks within their department.");
    }
  }

  const assignment = await TaskAssignment.findOneAndUpdate(
    { task_id: task._id, assigned_to: input.assignedToUserId },
    { $setOnInsert: { assigned_at: new Date() } },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  );

  if (!assignment) {
    throw new Error("Failed to create task assignment.");
  }

  return normalizeAssignment({
    _id: assignment._id as Types.ObjectId,
    task_id: assignment.task_id as Types.ObjectId,
    assigned_to: assignment.assigned_to as Types.ObjectId,
    assigned_at: assignment.assigned_at,
  });
};

export const listAccessibleTasks = async (actor: Express.AuthUser) => {
  const actorId = String(actor.user_id);

  if (canManageGlobally(actor.global_role)) {
    const [tasks, assignments] = await Promise.all([
      Task.find().sort({ created_at: -1 }).lean(),
      TaskAssignment.find().lean(),
    ]);

    const assignmentMap = new Map<string, string[]>();
    for (const item of assignments) {
      const taskId = String(item.task_id);
      const list = assignmentMap.get(taskId) ?? [];
      list.push(String(item.assigned_to));
      assignmentMap.set(taskId, list);
    }

    return tasks.map((task) => ({
      ...normalizeTask(task as unknown as ITask),
      assignees: assignmentMap.get(String(task._id)) ?? [],
    }));
  }

  if (canManageDepartment(actor.department_role)) {
    const teammates = await User.find({ department_id: actor.department_id, is_active: true })
      .select("_id")
      .lean();

    const teammateIds = teammates.map((user) => String(user._id));

    const teammateAssignments = await TaskAssignment.find({ assigned_to: { $in: teammateIds } })
      .select("task_id")
      .lean();

    const taskIdsFromAssignments = teammateAssignments.map((item) => item.task_id);

    const tasks = await Task.find({
      $or: [
        { created_by: { $in: teammateIds } },
        { _id: { $in: taskIdsFromAssignments } },
      ],
    })
      .sort({ created_at: -1 })
      .lean();

    const assignments = await TaskAssignment.find({ task_id: { $in: tasks.map((task) => task._id) } }).lean();
    const assignmentMap = new Map<string, string[]>();
    for (const item of assignments) {
      const taskId = String(item.task_id);
      const list = assignmentMap.get(taskId) ?? [];
      list.push(String(item.assigned_to));
      assignmentMap.set(taskId, list);
    }

    return tasks.map((task) => ({
      ...normalizeTask(task as unknown as ITask),
      assignees: assignmentMap.get(String(task._id)) ?? [],
    }));
  }

  const selfAssignments = await TaskAssignment.find({ assigned_to: actorId }).select("task_id").lean();
  const assignedTaskIds = selfAssignments.map((item) => item.task_id);

  const tasks = await Task.find({
    $or: [{ created_by: actorId }, { _id: { $in: assignedTaskIds } }],
  })
    .sort({ created_at: -1 })
    .lean();

  return tasks.map((task) => ({
    ...normalizeTask(task as unknown as ITask),
    assignees: assignedTaskIds.includes(task._id) ? [actorId] : [],
  }));
};
