// auth and registration types

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface FirstTimeSetupData {
  email: string;
  first_name: string;
  last_name: string;
  password: string;
  department_id: number;
  school_university: string;
  required_hours: number;
}

export interface EmailCheckResponse {
  exists: boolean;
  needsSetup: boolean;
  message?: string;
}