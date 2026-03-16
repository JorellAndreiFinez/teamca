export type GlobalRole = 'Superadmin' | 'Admin' | 'Standard_User';
export type DepartmentRole = 'Head' | 'Supervisor' | 'Intern';

export interface User {
  user_id: string; // UUID
  first_name: string;
  last_name: string;
  email: string; 
  global_role: GlobalRole; 
  department_role: DepartmentRole;
  department_id?: number | string;
  is_active: boolean;
  created_at?: Date;
  updated_at?: Date;
}
export interface InternProfile {
  profile_id: number;
  user_id: string; // UUID - FK to User.user_id
  school_university: string;
  required_hours: number; // total
  rendered_hours_total: number; // accumulated
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

export function isIntern(user: User): boolean {
  return user.department_role === 'Intern';
}

export function isSupervisor(user: User): boolean {
  return user.department_role === 'Supervisor';
}

export function isDepartmentHead(user: User): boolean {
  return user.department_role === 'Head';
}

export function isSuperadmin(user: User): boolean {
  return user.global_role === 'Superadmin';
}

export function isAdmin(user: User): boolean {
  return user.global_role === 'Admin';
}