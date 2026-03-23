import type { Types } from 'mongoose';

declare global {
  namespace Express {
    interface AuthUser {
      user_id: Types.ObjectId;
      email: string;
      global_role: 'Superadmin' | 'Admin' | 'Standard_User';
      is_active: boolean;
      departments: Array<{
        department_id: Types.ObjectId;
        department_role: 'Head' | 'Supervisor' | 'Intern';
      }>;
    }

    interface Request {
      user?: AuthUser;
    }
  }
}

export {};