export type UserRole = 'Superadmin' | 'Admin' | 'Supervisor' | 'Intern';

export interface User {
  user_id: string; // uuid
  first_name: string;
  last_name: string;
  email: string;
  role: UserRole;
  department_id?: number;
  is_active: boolean;
}

export interface InternProfile {
  profile_id: number;
  user_id: string; // uuid
  school_university: string;
  required_hours: number;
  rendered_hours_total: number;
  expected_end_date: Date;
  actual_end_date?: Date;
}

export interface Department {
  department_id: number;
  department_name: string;
  supervisor_id?: string; // uuid
}