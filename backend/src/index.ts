import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import rateLimit from 'express-rate-limit';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const MS_PER_HOUR = 3_600_000;
const HOURS_DECIMAL_PLACES = 100; // multiply then divide to keep 2 decimal places
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  if (process.env.NODE_ENV === 'production') {
    console.error('FATAL: JWT_SECRET environment variable must be set in production.');
    process.exit(1);
  }
  console.warn('WARNING: JWT_SECRET not set. Using insecure default — DO NOT use in production.');
}
const JWT_SECRET_RESOLVED = JWT_SECRET || 'teamca-dev-secret-change-in-production';

const allowedOrigins = (process.env.FRONTEND_URL || 'http://localhost:4321')
  .split(',')
  .map((o) => o.trim())
  .concat(['http://127.0.0.1:4321', 'http://localhost:4321']);

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (e.g., curl, Postman) or matching origins
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`Origin ${origin} not allowed by CORS`));
    }
  },
  credentials: true,
}));
app.use(express.json());

// ── Rate limiters ─────────────────────────────────────────────────────────────

/** Stricter limiter for authentication endpoints (login, setup, etc.) */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many requests from this IP, please try again after 15 minutes.' },
});

/** General limiter for authenticated API routes */
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many requests from this IP, please try again after 15 minutes.' },
});

interface MockUser {
  user_id: string;
  first_name: string;
  last_name: string;
  email: string;
  password_hash: string;
  global_role: 'Superadmin' | 'Admin' | 'Standard_User';
  department_role: 'Head' | 'Supervisor' | 'Intern';
  department_id?: number;
  is_active: boolean;
}

const mockUsers: MockUser[] = [
  {
    user_id: 'superadmin-uuid-001',
    first_name: 'Admin',
    last_name: 'User',
    email: 'superadmin@teamca.com',
    password_hash: bcrypt.hashSync('password123', 10),
    global_role: 'Superadmin',
    department_role: 'Head',
    is_active: true,
  },
  {
    user_id: 'admin-uuid-002',
    first_name: 'Jane',
    last_name: 'Admin',
    email: 'admin@teamca.com',
    password_hash: bcrypt.hashSync('password123', 10),
    global_role: 'Admin',
    department_role: 'Supervisor',
    department_id: 1,
    is_active: true,
  },
  {
    user_id: 'intern-uuid-003',
    first_name: 'Juan',
    last_name: 'Dela Cruz',
    email: 'intern@teamca.com',
    password_hash: bcrypt.hashSync('password123', 10),
    global_role: 'Standard_User',
    department_role: 'Intern',
    department_id: 1,
    is_active: true,
  },
];

const whitelistedEmails: string[] = [
  'superadmin@teamca.com',
  'admin@teamca.com',
  'intern@teamca.com',
  'new.intern@teamca.com',
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function toPublicUser(u: MockUser) {
  const { password_hash, ...pub } = u;
  return pub;
}

function authMiddleware(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ message: 'Unauthorized' });
    return;
  }
  const token = authHeader.slice(7);
  try {
    const payload = jwt.verify(token, JWT_SECRET_RESOLVED) as { user_id: string };
    (req as any).userId = payload.user_id;
    next();
  } catch (err) {
    console.warn('[auth] Token verification failed:', (err as Error).message);
    res.status(401).json({ message: 'Invalid or expired token' });
  }
}

// ── Route-level rate limiting ─────────────────────────────────────────────────
app.use('/auth', authLimiter);
app.use('/users', apiLimiter);
app.use('/dtr', apiLimiter);
app.use('/tasks', apiLimiter);

// ── Auth Routes ───────────────────────────────────────────────────────────────

app.post('/auth/check-email', (req, res) => {
  const { email } = req.body as { email: string };
  if (!email) { res.status(400).json({ message: 'Email is required' }); return; }

  const normalised = email.toLowerCase();
  const user = mockUsers.find((u) => u.email.toLowerCase() === normalised);
  const isWhitelisted = whitelistedEmails.includes(normalised);

  if (user) {
    res.json({ exists: true, needsSetup: false });
  } else if (isWhitelisted) {
    res.json({ exists: false, needsSetup: true });
  } else {
    res.json({ exists: false, needsSetup: false });
  }
});

app.post('/auth/login', (req, res) => {
  const { email, password } = req.body as { email: string; password: string };
  if (!email || !password) {
    res.status(400).json({ message: 'Email and password are required' });
    return;
  }

  const user = mockUsers.find((u) => u.email.toLowerCase() === email.toLowerCase());
  if (!user || !bcrypt.compareSync(password, user.password_hash)) {
    res.status(401).json({ message: 'Invalid email or password' });
    return;
  }
  if (!user.is_active) {
    res.status(403).json({ message: 'Account is inactive. Contact your administrator.' });
    return;
  }

  const token = jwt.sign({ user_id: user.user_id }, JWT_SECRET_RESOLVED, { expiresIn: '7d' });
  res.json({ token, user: toPublicUser(user) });
});

app.post('/auth/complete-setup', (req, res) => {
  const { email, first_name, last_name, password, department_id } = req.body;
  if (!email || !first_name || !last_name || !password) {
    res.status(400).json({ message: 'Missing required fields' });
    return;
  }
  if (mockUsers.find((u) => u.email.toLowerCase() === email.toLowerCase())) {
    res.status(409).json({ message: 'Account already exists for this email' });
    return;
  }

  const newUser: MockUser = {
    user_id: `user-${Date.now()}`,
    first_name,
    last_name,
    email,
    password_hash: bcrypt.hashSync(password, 10),
    global_role: 'Standard_User',
    department_role: 'Intern',
    department_id: department_id || undefined,
    is_active: true,
  };
  mockUsers.push(newUser);

  const token = jwt.sign({ user_id: newUser.user_id }, JWT_SECRET_RESOLVED, { expiresIn: '7d' });
  res.status(201).json({ token, user: toPublicUser(newUser) });
});

app.post('/auth/logout', (_req, res) => {
  res.json({ message: 'Logged out successfully' });
});

// ── User Routes ───────────────────────────────────────────────────────────────

app.get('/users', apiLimiter, authMiddleware, (_req, res) => {
  res.json(mockUsers.map(toPublicUser));
});

app.get('/users/:userId', apiLimiter, authMiddleware, (req, res) => {
  const user = mockUsers.find((u) => u.user_id === req.params.userId);
  if (!user) { res.status(404).json({ message: 'User not found' }); return; }
  res.json(toPublicUser(user));
});

app.put('/users/:userId', apiLimiter, authMiddleware, (req, res) => {
  const idx = mockUsers.findIndex((u) => u.user_id === req.params.userId);
  if (idx === -1) { res.status(404).json({ message: 'User not found' }); return; }
  const { first_name, last_name } = req.body;
  if (first_name) mockUsers[idx].first_name = first_name;
  if (last_name) mockUsers[idx].last_name = last_name;
  res.json(toPublicUser(mockUsers[idx]));
});

app.post('/users/whitelist', apiLimiter, authMiddleware, (req, res) => {
  const { email } = req.body as { email: string };
  if (!email) { res.status(400).json({ message: 'Email is required' }); return; }
  if (!whitelistedEmails.includes(email.toLowerCase())) {
    whitelistedEmails.push(email.toLowerCase());
  }
  res.status(201).json({ message: `${email} has been whitelisted` });
});

app.delete('/users/whitelist/:email', apiLimiter, authMiddleware, (req, res) => {
  const emailToRemove = decodeURIComponent(String(req.params.email)).toLowerCase();
  const idx = whitelistedEmails.indexOf(emailToRemove);
  if (idx !== -1) whitelistedEmails.splice(idx, 1);
  res.json({ message: 'Email removed from whitelist' });
});

// ── DTR Routes ────────────────────────────────────────────────────────────────

interface DTRRecord {
  dtr_id: number;
  user_id: string;
  date: string;
  clock_in_time: string;
  clock_out_time?: string;
  hours_rendered: number;
  status: string;
}

const dtrRecords: DTRRecord[] = [];
let dtrIdCounter = 1;

app.post('/dtr/clock-in', apiLimiter, authMiddleware, (req, res) => {
  const userId = (req as any).userId;
  const now = new Date();
  const today = now.toISOString().split('T')[0];

  const existing = dtrRecords.find(
    (r) => r.user_id === userId && r.date === today && !r.clock_out_time
  );
  if (existing) { res.status(409).json({ message: 'Already clocked in today' }); return; }

  const record: DTRRecord = {
    dtr_id: dtrIdCounter++,
    user_id: userId,
    date: today,
    clock_in_time: now.toISOString(),
    hours_rendered: 0,
    status: 'Present',
  };
  dtrRecords.push(record);
  res.status(201).json(record);
});

app.post('/dtr/clock-out', apiLimiter, authMiddleware, (req, res) => {
  const userId = (req as any).userId;
  const now = new Date();
  const today = now.toISOString().split('T')[0];

  const record = dtrRecords.find(
    (r) => r.user_id === userId && r.date === today && !r.clock_out_time
  );
  if (!record) { res.status(404).json({ message: 'No active clock-in found for today' }); return; }

  record.clock_out_time = now.toISOString();
  const ms = now.getTime() - new Date(record.clock_in_time).getTime();
  record.hours_rendered = Math.round((ms / MS_PER_HOUR) * HOURS_DECIMAL_PLACES) / HOURS_DECIMAL_PLACES;
  res.json(record);
});

app.get('/dtr/:userId', apiLimiter, authMiddleware, (req, res) => {
  res.json(dtrRecords.filter((r) => r.user_id === req.params.userId));
});

// ── Task Routes ───────────────────────────────────────────────────────────────

interface TaskRecord {
  task_id: number;
  title: string;
  description: string;
  created_by: string;
  status: string;
  priority: string;
  deadline: string;
  created_at: string;
}

const taskRecords: TaskRecord[] = [
  {
    task_id: 1,
    title: 'Update Project Documentation',
    description: 'Review and update the README and API docs',
    created_by: 'admin-uuid-002',
    status: 'In Progress',
    priority: 'High',
    deadline: new Date(Date.now() + 2 * 86400000).toISOString(),
    created_at: new Date(Date.now() - 3 * 86400000).toISOString(),
  },
  {
    task_id: 2,
    title: 'Complete UI Wireframes',
    description: 'Create wireframes for the dashboard redesign',
    created_by: 'admin-uuid-002',
    status: 'Not Started',
    priority: 'Medium',
    deadline: new Date(Date.now() + 5 * 86400000).toISOString(),
    created_at: new Date(Date.now() - 86400000).toISOString(),
  },
];
let taskIdCounter = 3;

app.get('/tasks', apiLimiter, authMiddleware, (_req, res) => {
  res.json(taskRecords);
});

app.post('/tasks', apiLimiter, authMiddleware, (req, res) => {
  const { title, description, priority, deadline } = req.body;
  if (!title || !deadline) {
    res.status(400).json({ message: 'Title and deadline are required' });
    return;
  }
  const newTask: TaskRecord = {
    task_id: taskIdCounter++,
    title,
    description: description || '',
    created_by: (req as any).userId,
    status: 'Not Started',
    priority: priority || 'Medium',
    deadline,
    created_at: new Date().toISOString(),
  };
  taskRecords.push(newTask);
  res.status(201).json(newTask);
});

app.put('/tasks/:taskId', apiLimiter, authMiddleware, (req, res) => {
  const idx = taskRecords.findIndex((t) => t.task_id === parseInt(String(req.params.taskId), 10));
  if (idx === -1) { res.status(404).json({ message: 'Task not found' }); return; }
  const { status, title, description, priority, deadline } = req.body;
  if (status) taskRecords[idx].status = status;
  if (title) taskRecords[idx].title = title;
  if (description !== undefined) taskRecords[idx].description = description;
  if (priority) taskRecords[idx].priority = priority;
  if (deadline) taskRecords[idx].deadline = deadline;
  res.json(taskRecords[idx]);
});

app.delete('/tasks/:taskId', apiLimiter, authMiddleware, (req, res) => {
  const idx = taskRecords.findIndex((t) => t.task_id === parseInt(String(req.params.taskId), 10));
  if (idx !== -1) taskRecords.splice(idx, 1);
  res.json({ message: 'Task deleted' });
});

// ── Health check ──────────────────────────────────────────────────────────────

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ── Start server ──────────────────────────────────────────────────────────────

app.listen(PORT, () => {
  console.log(`TeamCA backend running on http://localhost:${PORT}`);
  console.log('\nDemo accounts:');
  console.log('  Superadmin: superadmin@teamca.com / password123');
  console.log('  Admin:      admin@teamca.com / password123');
  console.log('  Intern:     intern@teamca.com / password123');
});
