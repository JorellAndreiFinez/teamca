import { Types } from "mongoose";
import Department from "../models/Department.js";
import Task, {
  type ITask,
  type TaskPriority,
  type TaskStatus,
} from "../models/Task.js";
import TaskAssignment from "../models/TaskAssignment.js";
import TaskComment from "../models/TaskComment.js";
import TaskFeedback from "../models/TaskFeedback.js";
import TaskStatusHistory from "../models/TaskStatusHistory.js";
import TaskWorkLink from "../models/TaskWorkLink.js";
import User, { type IUser } from "../models/User.js";

type ActorRole = IUser["global_role"];
type ActorDepartmentRole = IUser["departments"][number]["department_role"];
type UserWithDepartments = {
  departments?: Array<{
    department_id?: Types.ObjectId | string;
    department_role?: ActorDepartmentRole;
  }>;
};

export type CreateTaskInput = {
  title: string;
  description?: string;
  priority?: TaskPriority;
  deadline?: Date;
  assigned_to?: string[];
};

export type AssignTaskInput = {
  taskId: string;
  assignedToUserIds: string[];
};

export type UpdateTaskStatusInput = {
  taskId: string;
  newStatus: TaskStatus;
  updateNotes?: string;
};

export type UpdateTaskDetailsInput = {
  taskId: string;
  title?: string;
  description?: string;
  deadline?: Date | null;
};

export type DeleteTasksInput = {
  taskIds: string[];
};

export type AddTaskFeedbackInput = {
  taskId: string;
  comments: string;
};

export type AddTaskWorkLinkInput = {
  taskId: string;
  url: string;
  label?: string;
};

export type DeleteTaskWorkLinkInput = {
  taskId: string;
  workLinkId: string;
};

export type AddTaskCommentInput = {
  taskId: string;
  message: string;
};

export type ListTasksInput = {
  page: number;
  limit: number;
  status?: TaskStatus;
  priority?: TaskPriority;
  search?: string;
  createdDate?: "all" | "today" | "7d" | "30d";
  sortBy?:
    | "created_desc"
    | "created_asc"
    | "priority_desc"
    | "priority_asc"
    | "deadline_asc"
    | "deadline_desc"
    | "title_asc";
};

export type TaskLinkPermissions = {
  can_add_links: boolean;
  can_delete_any_link: boolean;
  can_delete_own_links: boolean;
};

export type TaskUserSummary = {
  user_id: string;
  first_name: string;
  last_name: string;
  email: string;
};

export type TaskDepartmentSummary = {
  department_id: string;
  department_name: string;
};

export type TaskListItem = ReturnType<typeof normalizeTask> & {
  assigned_users: TaskUserSummary[];
  comments_count: number;
};

export type PaginatedTasksResponse = {
  items: TaskListItem[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
};

export type ListTaskStatusHistoryItem = {
  history_id: string;
  task_id: string;
  updated_by: string;
  updated_by_user: TaskUserSummary | null;
  previous_status: TaskStatus;
  new_status: TaskStatus;
  update_notes?: string;
  timestamp: Date;
};

export type TaskCommentItem = {
  comment_id: string;
  task_id: string;
  user_id: string;
  user: TaskUserSummary | null;
  message: string;
  created_at: Date;
};

export type TaskDetailResponse = ReturnType<typeof normalizeTask> & {
  assigned_users: TaskUserSummary[];
  involved_departments: TaskDepartmentSummary[];
  links: Array<{
    work_link_id: string;
    task_id: string;
    submitted_by: string;
    url: string;
    label?: string;
    created_at: Date;
  }>;
  links_count: number;
  history: ListTaskStatusHistoryItem[];
  comments: TaskCommentItem[];
  link_permissions: TaskLinkPermissions;
};

const canManageGlobally = (globalRole: ActorRole): boolean => {
  return globalRole === "Superadmin" || globalRole === "Admin";
};

const canManageDepartment = (departmentRole?: ActorDepartmentRole): boolean => {
  return departmentRole === "Head" || departmentRole === "Supervisor";
};

const isStandardIntern = (role: ActorRole): boolean => role === "Standard_User";

const INTERN_TRANSITIONS: Partial<Record<TaskStatus, TaskStatus[]>> = {
  "Not Started": ["In Progress"],
  "In Progress": ["Not Started", "Under Review"],
};

const MANAGER_TRANSITIONS: Partial<Record<TaskStatus, TaskStatus[]>> = {
  "Not Started": ["In Progress"],
  "In Progress": ["Not Started", "Under Review"],
  "Under Review": ["In Progress", "Completed"],
};

const normalizeTask = (
  task:
    | ITask
    | {
        _id: Types.ObjectId | string;
        title: string;
        description?: string;
        created_by: Types.ObjectId | string;
        status: TaskStatus;
        priority: TaskPriority;
        deadline?: Date;
        created_at: Date;
      },
) => ({
  task_id: String(task._id),
  title: task.title,
  description: task.description ?? "",
  created_by: String(task.created_by),
  status: task.status,
  priority: task.priority,
  deadline: task.deadline,
  created_at: task.created_at,
});

const getDeadlineSortValue = (value?: string | Date): number | null => {
  if (!value) {
    return null;
  }

  const time = new Date(value).getTime();
  return Number.isNaN(time) ? null : time;
};

const normalizeFeedback = (feedback: {
  _id: Types.ObjectId;
  task_id: Types.ObjectId;
  supervisor_id: Types.ObjectId;
  comments: string;
  created_at: Date;
}) => ({
  feedback_id: String(feedback._id),
  task_id: String(feedback.task_id),
  supervisor_id: String(feedback.supervisor_id),
  comments: feedback.comments,
  created_at: feedback.created_at,
});

const normalizeAssignment = (assignment: {
  _id: Types.ObjectId | string;
  task_id: Types.ObjectId | string;
  assigned_to: Types.ObjectId | string;
  assigned_at: Date;
}) => ({
  assignment_id: String(assignment._id),
  task_id: String(assignment.task_id),
  assigned_to: String(assignment.assigned_to),
  assigned_at: assignment.assigned_at,
});

const normalizeWorkLink = (workLink: {
  _id: Types.ObjectId | string;
  task_id: Types.ObjectId | string;
  submitted_by: Types.ObjectId | string;
  url: string;
  label?: string;
  created_at: Date;
}) => ({
  work_link_id: String(workLink._id),
  task_id: String(workLink.task_id),
  submitted_by: String(workLink.submitted_by),
  url: workLink.url,
  label: workLink.label,
  created_at: workLink.created_at,
});

const normalizeUser = (user: {
  _id: Types.ObjectId | string;
  first_name?: string;
  last_name?: string;
  email?: string;
}): TaskUserSummary => ({
  user_id: String(user._id),
  first_name: user.first_name?.trim() || "",
  last_name: user.last_name?.trim() || "",
  email: user.email?.trim() || "",
});

const getUserDepartmentIds = (user: UserWithDepartments): string[] => {
  return (user.departments ?? [])
    .map((department) => department.department_id)
    .filter(
      (departmentId): departmentId is Types.ObjectId | string => !!departmentId,
    )
    .map((departmentId) => String(departmentId));
};

const userHasDepartment = (
  user: UserWithDepartments,
  departmentId?: string,
): boolean => {
  if (!departmentId) {
    return false;
  }

  return getUserDepartmentIds(user).includes(String(departmentId));
};

const createDepartmentMembershipFilter = (departmentId: string) => {
  if (Types.ObjectId.isValid(departmentId)) {
    return { "departments.department_id": new Types.ObjectId(departmentId) };
  }

  return { "departments.department_id": departmentId };
};

const uniqueAssignees = (assignees: string[]): string[] => {
  const cleaned = assignees
    .map((value) => value.trim())
    .filter((value) => value.length > 0);

  return [...new Set(cleaned)];
};

const requireInternIncludesSelf = (
  actor: Express.AuthUser,
  assigneeUserIds: string[],
) => {
  const actorIsIntern =
    actor.global_role === "Standard_User" && actor.department_role === "Intern";
  if (!actorIsIntern) {
    return;
  }

  const actorId = String(actor.user_id);
  if (!assigneeUserIds.includes(actorId)) {
    throw new Error("Assignment list must include your own user.");
  }
};

const ensureAssigneeExists = async (assigneeUserId: string) => {
  const assignee = await User.findById(assigneeUserId)
    .select("global_role departments is_active")
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

    if (
      !actor.department_id ||
      !userHasDepartment(assignee, actor.department_id)
    ) {
      throw new Error(
        "Department managers can only assign tasks within their department.",
      );
    }

    return;
  }

  const assignee = await ensureAssigneeExists(assigneeUserId);

  const actorIsIntern =
    actor.global_role === "Standard_User" && actor.department_role === "Intern";
  if (actorIsIntern) {
    if (
      !actor.department_id ||
      !userHasDepartment(assignee, actor.department_id)
    ) {
      throw new Error("Interns can only assign tasks within their department.");
    }

    return;
  }

  if (actorId !== assigneeUserId) {
    throw new Error("Standard users can only assign tasks to themselves.");
  }
};

const getAllowedTransitions = (
  actor: Express.AuthUser,
  currentStatus: TaskStatus,
): TaskStatus[] => {
  if (
    canManageGlobally(actor.global_role) ||
    canManageDepartment(actor.department_role)
  ) {
    return MANAGER_TRANSITIONS[currentStatus] ?? [];
  }

  if (isStandardIntern(actor.global_role)) {
    return INTERN_TRANSITIONS[currentStatus] ?? [];
  }

  return [];
};

const canAccessTaskScope = async (
  actor: Express.AuthUser,
  task: { _id: Types.ObjectId; created_by: Types.ObjectId },
) => {
  const actorId = String(actor.user_id);

  if (canManageGlobally(actor.global_role)) {
    return true;
  }

  if (canManageDepartment(actor.department_role)) {
    const [taskCreator, taskAssignees] = await Promise.all([
      User.findById(task.created_by).select("departments").lean(),
      TaskAssignment.find({ task_id: task._id }).select("assigned_to").lean(),
    ]);

    const creatorInDepartment =
      !!actor.department_id &&
      !!taskCreator &&
      userHasDepartment(taskCreator, actor.department_id);

    const hasAssigneeInDepartment =
      !!actor.department_id &&
      (await User.exists({
        _id: { $in: taskAssignees.map((item) => item.assigned_to) },
        ...createDepartmentMembershipFilter(String(actor.department_id)),
      })) !== null;

    return creatorInDepartment || hasAssigneeInDepartment;
  }

  if (String(task.created_by) === actorId) {
    return true;
  }

  const selfAssignment = await TaskAssignment.findOne({
    task_id: task._id,
    assigned_to: actorId,
  })
    .select("_id")
    .lean();

  return !!selfAssignment;
};

const canChangeTaskStatus = async (
  actor: Express.AuthUser,
  task: { _id: Types.ObjectId; created_by: Types.ObjectId; status: TaskStatus },
) => {
  const actorId = String(actor.user_id);

  if (canManageGlobally(actor.global_role)) {
    return true;
  }

  if (canManageDepartment(actor.department_role)) {
    const [taskCreator, taskAssignees] = await Promise.all([
      User.findById(task.created_by).select("departments").lean(),
      TaskAssignment.find({ task_id: task._id }).select("assigned_to").lean(),
    ]);

    const creatorInDepartment =
      !!actor.department_id &&
      !!taskCreator &&
      userHasDepartment(taskCreator, actor.department_id);

    const hasAssigneeInDepartment =
      !!actor.department_id &&
      (await User.exists({
        _id: { $in: taskAssignees.map((item) => item.assigned_to) },
        ...createDepartmentMembershipFilter(String(actor.department_id)),
      })) !== null;

    return creatorInDepartment || hasAssigneeInDepartment;
  }

  if (isStandardIntern(actor.global_role)) {
    if (String(task.created_by) === actorId) {
      return true;
    }

    const selfAssignment = await TaskAssignment.findOne({
      task_id: task._id,
      assigned_to: actorId,
    })
      .select("_id")
      .lean();

    return !!selfAssignment;
  }

  return false;
};

const canManageOrOwnTask = (
  actor: Express.AuthUser,
  task: { created_by: Types.ObjectId | string },
): boolean => {
  if (canManageGlobally(actor.global_role)) {
    return true;
  }

  return String(task.created_by) === String(actor.user_id);
};

const canDeleteTaskByPolicy = (
  actor: Express.AuthUser,
  task: { created_by: Types.ObjectId | string; status: TaskStatus },
): boolean => {
  if (task.status === "Completed" && actor.global_role !== "Superadmin") {
    return false;
  }

  if (canManageGlobally(actor.global_role)) {
    return true;
  }

  return String(task.created_by) === String(actor.user_id);
};

const resolveTaskOrThrow = async (taskId: string) => {
  const task = await Task.findById(taskId).lean();
  if (!task) {
    throw new Error("Task not found.");
  }

  return task;
};

const getTaskAssigneeIdsMap = async (taskIds: string[]) => {
  const assignments = await TaskAssignment.find({
    task_id: { $in: taskIds },
  }).lean();
  const map = new Map<string, string[]>();

  for (const item of assignments) {
    const id = String(item.task_id);
    const list = map.get(id) ?? [];
    list.push(String(item.assigned_to));
    map.set(id, list);
  }

  return map;
};

// const getTaskLinksCountMap = async (taskIds: string[]) => {
//   if (taskIds.length === 0) {
//     return new Map<string, number>();
//   }

//   const rows = await TaskWorkLink.aggregate<{
//     _id: Types.ObjectId;
//     count: number;
//   }>([
//     {
//       $match: { task_id: { $in: taskIds.map((id) => new Types.ObjectId(id)) } },
//     },
//     { $group: { _id: "$task_id", count: { $sum: 1 } } },
//   ]);

//   const map = new Map<string, number>();
//   for (const row of rows) {
//     map.set(String(row._id), row.count);
//   }

//   return map;
// };

const getTaskCommentsCountMap = async (taskIds: string[]) => {
  if (taskIds.length === 0) {
    return new Map<string, number>();
  }

  const rows = await TaskComment.aggregate<{
    _id: Types.ObjectId;
    count: number;
  }>([
    {
      $match: { task_id: { $in: taskIds.map((id) => new Types.ObjectId(id)) } },
    },
    { $group: { _id: "$task_id", count: { $sum: 1 } } },
  ]);

  const map = new Map<string, number>();
  for (const row of rows) {
    map.set(String(row._id), row.count);
  }

  return map;
};

const getUsersByIds = async (userIds: string[]) => {
  if (userIds.length === 0) {
    return new Map<string, TaskUserSummary>();
  }

  const users = await User.find({ _id: { $in: userIds } })
    .select("first_name last_name email departments")
    .lean();

  const map = new Map<string, TaskUserSummary>();
  for (const user of users) {
    map.set(String(user._id), normalizeUser(user));
  }

  return map;
};

const getInvolvedDepartments = async (
  users: UserWithDepartments[],
): Promise<TaskDepartmentSummary[]> => {
  const departmentIds = [
    ...new Set(
      users
        .flatMap((item) => getUserDepartmentIds(item))
        .filter((item) => item.trim().length > 0),
    ),
  ];

  if (departmentIds.length === 0) {
    return [];
  }

  const departments = await Department.find({ _id: { $in: departmentIds } })
    .select("department_name")
    .lean();

  const map = new Map<string, string>();
  for (const department of departments) {
    map.set(String(department._id), department.department_name);
  }

  return departmentIds.map((departmentId) => ({
    department_id: departmentId,
    department_name: map.get(departmentId) || "Unknown Department",
  }));
};

const normalizeComment = (
  comment: {
    _id: Types.ObjectId | string;
    task_id: Types.ObjectId | string;
    user_id: Types.ObjectId | string;
    message: string;
    created_at: Date;
  },
  userMap: Map<string, TaskUserSummary>,
): TaskCommentItem => {
  const userId = String(comment.user_id);
  return {
    comment_id: String(comment._id),
    task_id: String(comment.task_id),
    user_id: userId,
    user: userMap.get(userId) ?? null,
    message: comment.message,
    created_at: comment.created_at,
  };
};

export const createTaskWithAssignment = async (
  actor: Express.AuthUser,
  input: CreateTaskInput,
) => {
  const actorId = String(actor.user_id);
  const assigneeUserIds = uniqueAssignees(input.assigned_to ?? [actorId]);

  if (assigneeUserIds.length === 0) {
    throw new Error("At least one assignee is required.");
  }

  requireInternIncludesSelf(actor, assigneeUserIds);

  await Promise.all(
    assigneeUserIds.map((assigneeUserId) =>
      assertCanAssign(actor, assigneeUserId),
    ),
  );

  const task = await Task.create({
    title: input.title,
    description: input.description,
    created_by: actor.user_id,
    priority: input.priority ?? "Medium",
    deadline: input.deadline,
    status: "Not Started",
  });

  const assignmentDocs = await TaskAssignment.insertMany(
    assigneeUserIds.map((assigneeUserId) => ({
      task_id: task._id,
      assigned_to: assigneeUserId,
    })),
  );

  const assignments = assignmentDocs.map((assignment) =>
    normalizeAssignment({
      _id: assignment._id,
      task_id: assignment.task_id,
      assigned_to: assignment.assigned_to,
      assigned_at: assignment.assigned_at,
    }),
  );

  return {
    task: normalizeTask(task),
    assignments,
  };
};

export const assignTask = async (
  actor: Express.AuthUser,
  input: AssignTaskInput,
) => {
  const task = await Task.findById(input.taskId).lean();
  if (!task) {
    throw new Error("Task not found.");
  }

  const actorId = String(actor.user_id);
  if (
    !canManageGlobally(actor.global_role) &&
    !canManageDepartment(actor.department_role)
  ) {
    if (String(task.created_by) !== actorId) {
      const existingSelfAssignment = await TaskAssignment.findOne({
        task_id: task._id,
        assigned_to: actorId,
      })
        .select("_id")
        .lean();

      if (!existingSelfAssignment) {
        throw new Error(
          "Standard users can only assign people on tasks they created or are assigned to.",
        );
      }
    }
  }

  const assigneeUserIds = uniqueAssignees(input.assignedToUserIds);
  if (assigneeUserIds.length === 0) {
    throw new Error("At least one assignee is required.");
  }

  requireInternIncludesSelf(actor, assigneeUserIds);

  await Promise.all(
    assigneeUserIds.map((assigneeUserId) =>
      assertCanAssign(actor, assigneeUserId),
    ),
  );

  if (
    canManageDepartment(actor.department_role) &&
    !canManageGlobally(actor.global_role)
  ) {
    const taskCreator = await User.findById(task.created_by)
      .select("departments")
      .lean();

    if (
      !taskCreator ||
      !actor.department_id ||
      !userHasDepartment(taskCreator, actor.department_id)
    ) {
      throw new Error(
        "Department managers can only assign tasks within their department.",
      );
    }
  }

  await TaskAssignment.deleteMany({
    task_id: task._id,
    assigned_to: { $nin: assigneeUserIds },
  });

  const assignmentDocs = await Promise.all(
    assigneeUserIds.map((assigneeUserId) =>
      TaskAssignment.findOneAndUpdate(
        { task_id: task._id, assigned_to: assigneeUserId },
        { $setOnInsert: { assigned_at: new Date() } },
        { upsert: true, new: true, setDefaultsOnInsert: true },
      ),
    ),
  );

  if (assignmentDocs.some((item) => !item)) {
    throw new Error("Failed to create task assignment.");
  }

  return assignmentDocs.map((assignment) =>
    normalizeAssignment({
      _id: assignment!._id as Types.ObjectId,
      task_id: assignment!.task_id as Types.ObjectId,
      assigned_to: assignment!.assigned_to as Types.ObjectId,
      assigned_at: assignment!.assigned_at,
    }),
  );
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
      ...normalizeTask(task),
      assignees: assignmentMap.get(String(task._id)) ?? [],
    }));
  }

  if (canManageDepartment(actor.department_role)) {
    const teammates = await User.find({
      is_active: true,
      ...(actor.department_id
        ? createDepartmentMembershipFilter(actor.department_id)
        : {}),
    })
      .select("_id")
      .lean();

    const teammateIds = teammates.map((user) => String(user._id));

    const teammateAssignments = await TaskAssignment.find({
      assigned_to: { $in: teammateIds },
    })
      .select("task_id")
      .lean();

    const taskIdsFromAssignments = teammateAssignments.map(
      (item) => item.task_id,
    );

    const tasks = await Task.find({
      $or: [
        { created_by: { $in: teammateIds } },
        { _id: { $in: taskIdsFromAssignments } },
      ],
    })
      .sort({ created_at: -1 })
      .lean();

    const assignments = await TaskAssignment.find({
      task_id: { $in: tasks.map((task) => task._id) },
    }).lean();
    const assignmentMap = new Map<string, string[]>();
    for (const item of assignments) {
      const taskId = String(item.task_id);
      const list = assignmentMap.get(taskId) ?? [];
      list.push(String(item.assigned_to));
      assignmentMap.set(taskId, list);
    }

    return tasks.map((task) => ({
      ...normalizeTask(task),
      assignees: assignmentMap.get(String(task._id)) ?? [],
    }));
  }

  const selfAssignments = await TaskAssignment.find({ assigned_to: actorId })
    .select("task_id")
    .lean();
  const assignedTaskIds = selfAssignments.map((item) => item.task_id);

  const tasks = await Task.find({
    $or: [{ created_by: actorId }, { _id: { $in: assignedTaskIds } }],
  })
    .sort({ created_at: -1 })
    .lean();

  const assignments = await TaskAssignment.find({
    task_id: { $in: tasks.map((task) => task._id) },
  }).lean();
  const assignmentMap = new Map<string, string[]>();
  for (const item of assignments) {
    const taskId = String(item.task_id);
    const list = assignmentMap.get(taskId) ?? [];
    list.push(String(item.assigned_to));
    assignmentMap.set(taskId, list);
  }

  return tasks.map((task) => ({
    ...normalizeTask(task),
    assignees: assignmentMap.get(String(task._id)) ?? [],
  }));
};

export const listAccessibleTasksPaginated = async (
  actor: Express.AuthUser,
  input: ListTasksInput,
): Promise<PaginatedTasksResponse> => {
  const allTasks = await listAccessibleTasks(actor);

  const taskIds = allTasks.map((task) => String(task.task_id));
  const assigneeMap = await getTaskAssigneeIdsMap(taskIds);
  const commentsCountMap = await getTaskCommentsCountMap(taskIds);

  const userIds = [
    ...new Set(
      allTasks.flatMap((task) => [
        String(task.created_by),
        ...(assigneeMap.get(String(task.task_id)) ?? []),
      ]),
    ),
  ];

  const userMap = await getUsersByIds(userIds);
  const normalizedSearch = (input.search || "").trim().toLowerCase();

  const now = new Date();
  const startOfToday = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
  );
  const startOf7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const startOf30d = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const filtered = allTasks.filter((task) => {
    if (input.status && task.status !== input.status) {
      return false;
    }

    if (input.priority && task.priority !== input.priority) {
      return false;
    }

    const createdAt = new Date(task.created_at);
    if (input.createdDate === "today" && createdAt < startOfToday) {
      return false;
    }

    if (input.createdDate === "7d" && createdAt < startOf7d) {
      return false;
    }

    if (input.createdDate === "30d" && createdAt < startOf30d) {
      return false;
    }

    if (!normalizedSearch) {
      return true;
    }

    const assignedUsers = (assigneeMap.get(String(task.task_id)) ?? [])
      .map((id) => userMap.get(id))
      .filter((item): item is TaskUserSummary => !!item);

    const taskTitle = task.title.toLowerCase();
    const assigneeNames = assignedUsers.map((user) =>
      `${user.first_name} ${user.last_name}`.trim().toLowerCase(),
    );

    return (
      taskTitle.includes(normalizedSearch) ||
      assigneeNames.some((name) => name.includes(normalizedSearch))
    );
  });

  const priorityRank: Record<TaskPriority, number> = {
    Low: 1,
    Medium: 2,
    High: 3,
  };

  const sorted = [...filtered].sort((left, right) => {
    const sortBy = input.sortBy ?? "created_desc";

    if (sortBy === "created_asc") {
      return (
        new Date(left.created_at).getTime() -
        new Date(right.created_at).getTime()
      );
    }

    if (sortBy === "created_desc") {
      return (
        new Date(right.created_at).getTime() -
        new Date(left.created_at).getTime()
      );
    }

    if (sortBy === "priority_desc") {
      return priorityRank[right.priority] - priorityRank[left.priority];
    }

    if (sortBy === "priority_asc") {
      return priorityRank[left.priority] - priorityRank[right.priority];
    }

    if (sortBy === "deadline_asc") {
      const leftDeadline = getDeadlineSortValue(left.deadline);
      const rightDeadline = getDeadlineSortValue(right.deadline);

      if (leftDeadline === null && rightDeadline === null) {
        return 0;
      }

      if (leftDeadline === null) {
        return 1;
      }

      if (rightDeadline === null) {
        return -1;
      }

      return leftDeadline - rightDeadline;
    }

    if (sortBy === "deadline_desc") {
      const leftDeadline = getDeadlineSortValue(left.deadline);
      const rightDeadline = getDeadlineSortValue(right.deadline);

      if (leftDeadline === null && rightDeadline === null) {
        return 0;
      }

      if (leftDeadline === null) {
        return 1;
      }

      if (rightDeadline === null) {
        return -1;
      }

      return rightDeadline - leftDeadline;
    }

    return left.title.localeCompare(right.title);
  });

  const total = sorted.length;
  const totalPages = Math.max(1, Math.ceil(total / input.limit));
  const page = Math.min(input.page, totalPages);
  const start = (page - 1) * input.limit;
  const end = start + input.limit;

  const items: TaskListItem[] = sorted.slice(start, end).map((task) => {
    const assignedUsers = (assigneeMap.get(String(task.task_id)) ?? [])
      .map((id) => userMap.get(id))
      .filter((item): item is TaskUserSummary => !!item);

    return {
      ...task,
      assigned_users: assignedUsers,
      comments_count: commentsCountMap.get(String(task.task_id)) ?? 0,
    };
  });

  return {
    items,
    total,
    page,
    limit: input.limit,
    total_pages: totalPages,
  };
};

export const listTaskStatusHistory = async (
  actor: Express.AuthUser,
  taskId: string,
): Promise<ListTaskStatusHistoryItem[]> => {
  const task = await Task.findById(taskId).select("_id created_by").lean();
  if (!task) {
    throw new Error("Task not found.");
  }

  const hasAccess = await canAccessTaskScope(actor, {
    _id: task._id as Types.ObjectId,
    created_by: task.created_by as Types.ObjectId,
  });

  if (!hasAccess) {
    throw new Error("You do not have permission to view task status history.");
  }

  const historyItems = await TaskStatusHistory.find({ task_id: task._id })
    .sort({ timestamp: -1 })
    .lean();

  const userMap = await getUsersByIds([
    ...new Set(historyItems.map((item) => String(item.updated_by))),
  ]);

  return historyItems.map((item) => ({
    history_id: String(item._id),
    task_id: String(item.task_id),
    updated_by: String(item.updated_by),
    updated_by_user: userMap.get(String(item.updated_by)) ?? null,
    previous_status: item.previous_status,
    new_status: item.new_status,
    update_notes: item.update_notes,
    timestamp: item.timestamp,
  }));
};

export const updateTaskStatus = async (
  actor: Express.AuthUser,
  input: UpdateTaskStatusInput,
) => {
  const task = await Task.findById(input.taskId);
  if (!task) {
    throw new Error("Task not found.");
  }

  const canChange = await canChangeTaskStatus(actor, {
    _id: task._id as Types.ObjectId,
    created_by: task.created_by as Types.ObjectId,
    status: task.status,
  });

  if (!canChange) {
    throw new Error("You do not have permission to update this task status.");
  }

  const previousStatus = task.status;
  if (previousStatus === input.newStatus) {
    throw new Error("Task is already in the requested status.");
  }

  if (previousStatus === "Completed") {
    throw new Error("Completed tasks are locked and can no longer be updated.");
  }

  if (previousStatus === "In Progress" && input.newStatus === "Under Review") {
    const linksCount = await TaskWorkLink.countDocuments({ task_id: task._id });
    if (linksCount === 0) {
      throw new Error(
        "Attach at least one work link before sending a task for review.",
      );
    }
  }

  const allowed = getAllowedTransitions(actor, previousStatus);
  if (!allowed.includes(input.newStatus)) {
    throw new Error(
      `Invalid status transition from ${previousStatus} to ${input.newStatus}.`,
    );
  }

  task.status = input.newStatus;
  await task.save();

  const history = await TaskStatusHistory.create({
    task_id: task._id,
    updated_by: actor.user_id,
    previous_status: previousStatus,
    new_status: input.newStatus,
    update_notes: input.updateNotes?.trim() || undefined,
  });

  const userMap = await getUsersByIds([String(history.updated_by)]);

  return {
    task: normalizeTask(task),
    history: {
      history_id: String(history._id),
      task_id: String(history.task_id),
      updated_by: String(history.updated_by),
      updated_by_user: userMap.get(String(history.updated_by)) ?? null,
      previous_status: history.previous_status,
      new_status: history.new_status,
      update_notes: history.update_notes,
      timestamp: history.timestamp,
    },
  };
};

export const addTaskFeedback = async (
  actor: Express.AuthUser,
  input: AddTaskFeedbackInput,
) => {
  const task = await Task.findById(input.taskId)
    .select("_id created_by")
    .lean();
  if (!task) {
    throw new Error("Task not found.");
  }

  if (
    !canManageGlobally(actor.global_role) &&
    !canManageDepartment(actor.department_role)
  ) {
    throw new Error(
      "Only supervisors, heads, admins, or superadmins can submit feedback.",
    );
  }

  const hasAccess = await canAccessTaskScope(actor, {
    _id: task._id as Types.ObjectId,
    created_by: task.created_by as Types.ObjectId,
  });

  if (!hasAccess) {
    throw new Error(
      "You do not have permission to submit feedback for this task.",
    );
  }

  const feedback = await TaskFeedback.create({
    task_id: task._id,
    supervisor_id: actor.user_id,
    comments: input.comments.trim(),
  });

  return normalizeFeedback({
    _id: feedback._id as Types.ObjectId,
    task_id: feedback.task_id as Types.ObjectId,
    supervisor_id: feedback.supervisor_id as Types.ObjectId,
    comments: feedback.comments,
    created_at: feedback.created_at,
  });
};

export const addTaskWorkLink = async (
  actor: Express.AuthUser,
  input: AddTaskWorkLinkInput,
) => {
  const task = await Task.findById(input.taskId)
    .select("_id created_by status")
    .lean();
  if (!task) {
    throw new Error("Task not found.");
  }

  const hasAccess = await canAccessTaskScope(actor, {
    _id: task._id as Types.ObjectId,
    created_by: task.created_by as Types.ObjectId,
  });

  if (!hasAccess) {
    throw new Error(
      "You do not have permission to attach work links for this task.",
    );
  }

  if (task.status === "Under Review" || task.status === "Completed") {
    throw new Error(
      "Work links can only be added before the task enters review.",
    );
  }

  const created = await TaskWorkLink.create({
    task_id: task._id,
    submitted_by: actor.user_id,
    url: input.url.trim(),
    label: input.label?.trim() || undefined,
  });

  return normalizeWorkLink({
    _id: created._id,
    task_id: created.task_id,
    submitted_by: created.submitted_by,
    url: created.url,
    label: created.label,
    created_at: created.created_at,
  });
};

export const listTaskWorkLinks = async (
  actor: Express.AuthUser,
  taskId: string,
) => {
  const task = await Task.findById(taskId).select("_id created_by").lean();
  if (!task) {
    throw new Error("Task not found.");
  }

  const hasAccess = await canAccessTaskScope(actor, {
    _id: task._id as Types.ObjectId,
    created_by: task.created_by as Types.ObjectId,
  });

  if (!hasAccess) {
    throw new Error(
      "You do not have permission to view work links for this task.",
    );
  }

  const links = await TaskWorkLink.find({ task_id: task._id })
    .sort({ created_at: -1 })
    .lean();

  return links.map((item) =>
    normalizeWorkLink({
      _id: item._id,
      task_id: item.task_id,
      submitted_by: item.submitted_by,
      url: item.url,
      label: item.label,
      created_at: item.created_at,
    }),
  );
};

export const deleteTaskWorkLink = async (
  actor: Express.AuthUser,
  input: DeleteTaskWorkLinkInput,
) => {
  const task = await Task.findById(input.taskId)
    .select("_id created_by status")
    .lean();
  if (!task) {
    throw new Error("Task not found.");
  }

  const hasAccess = await canAccessTaskScope(actor, {
    _id: task._id as Types.ObjectId,
    created_by: task.created_by as Types.ObjectId,
  });

  if (!hasAccess) {
    throw new Error(
      "You do not have permission to remove work links for this task.",
    );
  }

  if (task.status === "Under Review" || task.status === "Completed") {
    throw new Error(
      "Work links can only be removed before the task enters review.",
    );
  }

  const workLink = await TaskWorkLink.findOne({
    _id: input.workLinkId,
    task_id: task._id,
  })
    .select("_id submitted_by")
    .lean();

  if (!workLink) {
    throw new Error("Work link not found.");
  }

  const actorId = String(actor.user_id);
  const isManager =
    canManageGlobally(actor.global_role) ||
    canManageDepartment(actor.department_role);
  const isOwner = String(workLink.submitted_by) === actorId;

  if (!isManager && !isOwner) {
    throw new Error("You can only remove your own work links.");
  }

  await TaskWorkLink.deleteOne({ _id: workLink._id, task_id: task._id });

  return {
    work_link_id: String(workLink._id),
    task_id: String(task._id),
    deleted: true,
  };
};

export const listTaskFeedback = async (
  actor: Express.AuthUser,
  taskId: string,
) => {
  const task = await Task.findById(taskId).select("_id created_by").lean();
  if (!task) {
    throw new Error("Task not found.");
  }

  const hasAccess = await canAccessTaskScope(actor, {
    _id: task._id as Types.ObjectId,
    created_by: task.created_by as Types.ObjectId,
  });

  if (!hasAccess) {
    throw new Error(
      "You do not have permission to view feedback for this task.",
    );
  }

  const feedbackItems = await TaskFeedback.find({ task_id: task._id })
    .sort({ created_at: -1 })
    .lean();

  return feedbackItems.map((item) =>
    normalizeFeedback({
      _id: item._id as Types.ObjectId,
      task_id: item.task_id as Types.ObjectId,
      supervisor_id: item.supervisor_id as Types.ObjectId,
      comments: item.comments,
      created_at: item.created_at,
    }),
  );
};

export const listTaskComments = async (
  actor: Express.AuthUser,
  taskId: string,
): Promise<TaskCommentItem[]> => {
  const task = await resolveTaskOrThrow(taskId);

  const hasAccess = await canAccessTaskScope(actor, {
    _id: task._id as Types.ObjectId,
    created_by: task.created_by as Types.ObjectId,
  });

  if (!hasAccess) {
    throw new Error(
      "You do not have permission to view comments for this task.",
    );
  }

  const comments = await TaskComment.find({ task_id: task._id })
    .sort({ created_at: 1 })
    .lean();

  const userIds = [
    ...new Set(comments.map((comment) => String(comment.user_id))),
  ];
  const userMap = await getUsersByIds(userIds);

  return comments.map((comment) =>
    normalizeComment(
      {
        _id: comment._id,
        task_id: comment.task_id,
        user_id: comment.user_id,
        message: comment.message,
        created_at: comment.created_at,
      },
      userMap,
    ),
  );
};

export const addTaskComment = async (
  actor: Express.AuthUser,
  input: AddTaskCommentInput,
): Promise<TaskCommentItem> => {
  const task = await resolveTaskOrThrow(input.taskId);

  const hasAccess = await canAccessTaskScope(actor, {
    _id: task._id as Types.ObjectId,
    created_by: task.created_by as Types.ObjectId,
  });

  if (!hasAccess) {
    throw new Error("You do not have permission to comment on this task.");
  }

  const created = await TaskComment.create({
    task_id: task._id,
    user_id: actor.user_id,
    message: input.message.trim(),
  });

  const userMap = await getUsersByIds([String(actor.user_id)]);

  return normalizeComment(
    {
      _id: created._id,
      task_id: created.task_id,
      user_id: created.user_id,
      message: created.message,
      created_at: created.created_at,
    },
    userMap,
  );
};

export const updateTaskDetails = async (
  actor: Express.AuthUser,
  input: UpdateTaskDetailsInput,
) => {
  const task = await Task.findById(input.taskId);
  if (!task) {
    throw new Error("Task not found.");
  }

  if (
    !canManageOrOwnTask(actor, {
      created_by: task.created_by as Types.ObjectId,
    })
  ) {
    throw new Error("You do not have permission to update this task.");
  }

  if (input.title !== undefined) {
    task.title = input.title.trim();
  }

  if (input.description !== undefined) {
    task.description = input.description.trim() || undefined;
  }

  if (input.deadline !== undefined) {
    task.deadline = input.deadline || undefined;
  }

  await task.save();
  return normalizeTask(task);
};

export const deleteTasks = async (
  actor: Express.AuthUser,
  input: DeleteTasksInput,
) => {
  const uniqueTaskIds = [
    ...new Set(
      input.taskIds
        .map((taskId) => taskId.trim())
        .filter((taskId) => taskId.length > 0),
    ),
  ];

  if (uniqueTaskIds.length === 0) {
    throw new Error("At least one task id is required.");
  }

  const tasks = await Task.find({ _id: { $in: uniqueTaskIds } })
    .select("_id created_by status")
    .lean();

  if (tasks.length === 0) {
    throw new Error("Task not found.");
  }

  const undeletableTask = tasks.find(
    (task) =>
      !canDeleteTaskByPolicy(actor, {
        created_by: task.created_by,
        status: task.status,
      }),
  );
  if (undeletableTask) {
    throw new Error(
      "You do not have permission to delete one or more selected tasks.",
    );
  }

  const deletableTaskIds = tasks.map((task) => String(task._id));
  const objectIds = deletableTaskIds.map(
    (taskId) => new Types.ObjectId(taskId),
  );

  await Promise.all([
    Task.deleteMany({ _id: { $in: objectIds } }),
    TaskAssignment.deleteMany({ task_id: { $in: objectIds } }),
    TaskComment.deleteMany({ task_id: { $in: objectIds } }),
    TaskFeedback.deleteMany({ task_id: { $in: objectIds } }),
    TaskStatusHistory.deleteMany({ task_id: { $in: objectIds } }),
    TaskWorkLink.deleteMany({ task_id: { $in: objectIds } }),
  ]);

  return {
    deleted_count: deletableTaskIds.length,
    deleted_task_ids: deletableTaskIds,
  };
};

export const getTaskDetail = async (
  actor: Express.AuthUser,
  taskId: string,
): Promise<TaskDetailResponse> => {
  const task = await resolveTaskOrThrow(taskId);

  const hasAccess = await canAccessTaskScope(actor, {
    _id: task._id as Types.ObjectId,
    created_by: task.created_by as Types.ObjectId,
  });

  if (!hasAccess) {
    throw new Error("You do not have permission to view this task.");
  }

  const [assigneeRows, links, historyRows, commentsRows] = await Promise.all([
    TaskAssignment.find({ task_id: task._id }).select("assigned_to").lean(),
    TaskWorkLink.find({ task_id: task._id }).sort({ created_at: -1 }).lean(),
    TaskStatusHistory.find({ task_id: task._id })
      .sort({ timestamp: -1 })
      .lean(),
    TaskComment.find({ task_id: task._id }).sort({ created_at: 1 }).lean(),
  ]);

  const assigneeIds = assigneeRows.map((row) => String(row.assigned_to));
  const historyUserIds = historyRows.map((row) => String(row.updated_by));
  const commentUserIds = commentsRows.map((row) => String(row.user_id));
  const allUserIds = [
    ...new Set([
      String(task.created_by),
      ...assigneeIds,
      ...historyUserIds,
      ...commentUserIds,
    ]),
  ];

  const userMap = await getUsersByIds(allUserIds);

  const involvedUsers = await User.find({ _id: { $in: allUserIds } })
    .select("departments")
    .lean();

  const involved_departments = await getInvolvedDepartments(involvedUsers);

  const history: ListTaskStatusHistoryItem[] = historyRows.map((item) => ({
    history_id: String(item._id),
    task_id: String(item.task_id),
    updated_by: String(item.updated_by),
    updated_by_user: userMap.get(String(item.updated_by)) ?? null,
    previous_status: item.previous_status,
    new_status: item.new_status,
    update_notes: item.update_notes,
    timestamp: item.timestamp,
  }));

  const comments: TaskCommentItem[] = commentsRows.map((item) =>
    normalizeComment(
      {
        _id: item._id,
        task_id: item.task_id,
        user_id: item.user_id,
        message: item.message,
        created_at: item.created_at,
      },
      userMap,
    ),
  );

  const assigned_users = assigneeIds
    .map((id) => userMap.get(id))
    .filter((item): item is TaskUserSummary => !!item);

  const normalizedTask = normalizeTask(task);
  const canEditLinksByStatus =
    task.status !== "Under Review" && task.status !== "Completed";
  const managerCanDeleteAny =
    canManageGlobally(actor.global_role) ||
    canManageDepartment(actor.department_role);
  const link_permissions: TaskLinkPermissions = {
    can_add_links: canEditLinksByStatus,
    can_delete_any_link: canEditLinksByStatus && managerCanDeleteAny,
    can_delete_own_links: canEditLinksByStatus,
  };

  return {
    ...normalizedTask,
    assigned_users,
    involved_departments,
    links: links.map((item) =>
      normalizeWorkLink({
        _id: item._id,
        task_id: item.task_id,
        submitted_by: item.submitted_by,
        url: item.url,
        label: item.label,
        created_at: item.created_at,
      }),
    ),
    links_count: links.length,
    history,
    comments,
    link_permissions,
  };
};
