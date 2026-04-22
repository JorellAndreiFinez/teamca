// frontend/src/types/User.ts
export type GlobalRole = "Superadmin" | "Admin" | "Standard_User";
export type DepartmentRole = "Head" | "Supervisor" | "Intern";

export interface DepartmentAssignment {
  department_id: string;
  department_role: DepartmentRole;
}

export interface User {
  user_id?: string;
  _id?: string;

  first_name?: string;
  last_name?: string;
  email?: string;

  global_role?: GlobalRole;
  is_active?: boolean;

  departments?: DepartmentAssignment[];

  required_hours?: number;

  working_hours?: {
    start?: string;
    end?: string;
  };

  working_days?: ("M" | "T" | "W" | "Th" | "F" | "Sat" | "Sun")[];

  createdAt?: string;
  updatedAt?: string;
}
export interface InternProfile {
  profile_id: number;
  user_id: string;
  school_university: string;
  required_hours: number;
  rendered_hours_total: number;
  expected_end_date: Date;
  actual_end_date?: Date;
}

export interface Department {
  _id?: string;
  department_id?: number | string;
  department_name: string;
  supervisor_id?: string;
  head_id?: string;
  created_at?: Date;
}

export interface WhitelistedEmail {
  whitelist_id: number;
  email: string;
  is_setup_complete: boolean;
  whitelisted_by: string;
  whitelisted_at: Date;
}

export interface UserProfile extends User {
  intern_profile?: InternProfile;
  department?: Department;
}
