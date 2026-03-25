import type { Types } from 'mongoose';

declare global {
  namespace Express {
    interface AuthUser {
      user_id: Types.ObjectId;
      email: string;
      global_role: 'Superadmin' | 'Admin' | 'Standard_User';
      department_role?: 'Head' | 'Supervisor' | 'Intern';
      department_id?: string;
      is_active: boolean;
    }

    interface Request {
      user?: AuthUser;
    }
  }
}

export {};