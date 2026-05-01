import { useEffect, useState } from 'react';
import { useAuthStore } from '../../store/authStore';
import { userService } from '../../services/userService';
import { departmentService } from '../../services/departmentService';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/Card';
import type { UserProfileResponse } from '../../services/userService';

const formatDepartmentRole = (role?: string) => {
  if (!role) return '';
  return role === 'Head' ? 'Head' : role;
};

const buildPositionLabel = (departmentName: string | null, departmentRole?: string) => {
  const normalizedRole = formatDepartmentRole(departmentRole);

  if (departmentName && normalizedRole) {
    return `${departmentName} ${normalizedRole}`;
  }

  if (normalizedRole) {
    return normalizedRole;
  }

  if (departmentName) {
    return departmentName;
  }

  return 'Not assigned';
};

export default function ProfilePageContent() {
  const user = useAuthStore((state) => state.user);
  const [profile, setProfile] = useState<UserProfileResponse | null>(null);
  const [departmentName, setDepartmentName] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      return;
    }

    const loadProfile = async () => {
      setIsLoading(true);
      try {
        if (!user.user_id && !user._id) return;
        const data = await userService.getProfile(user.user_id || user._id || '');
        setProfile(data);

        const departmentId = data.departments?.[0]?.department_id ?? user.departments?.[0]?.department_id;
        if (departmentId !== undefined && departmentId !== null) {
          try {
            const department = await departmentService.getDepartmentById(departmentId);
            setDepartmentName(department.department_name ?? null);
          } catch {
            setDepartmentName(null);
          }
        } else {
          setDepartmentName(null);
        }
      } catch {
        setProfile(null);
        setDepartmentName(null);
      } finally {
        setIsLoading(false);
      }
    };

    void loadProfile();
  }, [user]);

  return (
    <div className="space-y-4 p-4">
      <section>
        <h1 className="text-2xl font-semibold text-slate-900">Profile</h1>
        <p className="text-sm text-slate-500">Your account and internship details</p>
      </section>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Account Information</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? <p className="text-sm text-slate-500">Loading profile...</p> : null}

          {!isLoading && !profile ? (
            <p className="text-sm text-slate-500">Unable to load profile details right now.</p>
          ) : null}

          {!isLoading && profile ? (
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <p className="text-xs text-slate-500">Name</p>
                <p className="text-sm font-medium text-slate-900">
                  {profile.first_name} {profile.last_name}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Email</p>
                <p className="text-sm font-medium text-slate-900">{profile.email}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Position</p>
                <p className="text-sm font-medium text-slate-900">
                  {buildPositionLabel(departmentName, profile.departments?.[0]?.department_role)}
                </p>
              </div>
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Internship Details</CardTitle>
          <CardDescription>Visible when intern profile data is available.</CardDescription>
        </CardHeader>
        <CardContent>
          {!isLoading && !profile?.intern_profile ? (
            <p className="text-sm text-slate-500">No internship profile details found yet.</p>
          ) : null}

          {!isLoading && profile?.intern_profile ? (
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <p className="text-xs text-slate-500">School / University</p>
                <p className="text-sm font-medium text-slate-900">{profile.intern_profile.school_university}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Required Hours</p>
                <p className="text-sm font-medium text-slate-900">{profile.intern_profile.required_hours}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Rendered Hours</p>
                <p className="text-sm font-medium text-slate-900">{profile.intern_profile.rendered_hours_total}</p>
              </div>
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}