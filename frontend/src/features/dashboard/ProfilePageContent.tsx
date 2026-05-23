import { useEffect, useState, useCallback } from 'react';
import { useAuthStore } from '../../store/authStore';
import { userService } from '../../services/userService';
import { departmentService } from '../../services/departmentService';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/Card';
import type { UserProfileResponse } from '../../services/userService';
import { FormInputSkeleton, WidgetSkeleton } from '../../components/ui/Skeleton';
import { useDtrSocket } from '../dtr/hooks/useDtrSocket';

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

  const loadProfile = useCallback(async () => {
    if (!user?.user_id && !user?._id) return;
    setIsLoading(true);
    try {
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
  }, [user]);

  useEffect(() => {
    if (!user) return;
    void loadProfile();
  }, [user, loadProfile]);

  useDtrSocket(useCallback(() => { void loadProfile(); }, [loadProfile]));

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
          {isLoading ? (
            <div className="space-y-4">
              <WidgetSkeleton lines={3} />
              <div className="grid gap-3 sm:grid-cols-2">
                <FormInputSkeleton />
                <FormInputSkeleton />
              </div>
            </div>
          ) : null}

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
          {isLoading ? (
            <div className="space-y-3">
              <FormInputSkeleton />
              <FormInputSkeleton />
              <FormInputSkeleton />
            </div>
          ) : !profile?.intern_profile ? (
            <p className="text-sm text-slate-500">No internship profile details found yet.</p>
          ) : null}

          {!isLoading && profile?.intern_profile ? (() => {
            const ip = profile.intern_profile;
            const rendered = ip.rendered_hours_total ?? 0;
            const required = ip.required_hours ?? 0;
            const pct = required > 0 ? Math.min(100, Math.round((rendered / required) * 100)) : 0;
            const remaining = Math.max(0, required - rendered);

            return (
              <div className="space-y-4">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <p className="text-xs text-slate-500">School / University</p>
                    <p className="text-sm font-medium text-slate-900">{ip.school_university}</p>
                  </div>
                  {ip.expected_completion_date ? (
                    <div>
                      <p className="text-xs text-slate-500">Expected Completion</p>
                      <p className="text-sm font-medium text-slate-900">
                        {new Date(ip.expected_completion_date).toLocaleDateString('en-US', {
                          year: 'numeric', month: 'long', day: 'numeric',
                        })}
                      </p>
                    </div>
                  ) : null}
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs text-slate-500">Progress</span>
                    <span className="text-xs font-semibold text-slate-700">{pct}%</span>
                  </div>
                  <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-500 rounded-full transition-all duration-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <div className="flex justify-between mt-1">
                    <span className="text-xs text-slate-400">{rendered}h rendered</span>
                    <span className="text-xs text-slate-400">{required}h required</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-blue-50 rounded-lg px-3 py-2.5">
                    <p className="text-lg font-bold text-blue-600">{rendered}h</p>
                    <p className="text-xs text-slate-500">Rendered</p>
                  </div>
                  <div className="bg-orange-50 rounded-lg px-3 py-2.5">
                    <p className="text-lg font-bold text-orange-500">{remaining}h</p>
                    <p className="text-xs text-slate-500">Remaining</p>
                  </div>
                </div>
              </div>
            );
          })() : null}
        </CardContent>
      </Card>
    </div>
  );
}