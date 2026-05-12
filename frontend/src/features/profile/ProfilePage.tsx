import React, { useEffect, useState } from 'react';
import { useAuthStore } from '../../store/authStore';
import { userService } from '../../services/userService';
import { internProfileService } from '../../services/internProfileService';
import type { InternProfile } from '../../types/user';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import UserIdenticon from '../../components/common/UserIdenticon';
import { useDtrStore } from '../../store/dtrStore';
import { useDtrSocket } from '../dtr/hooks/useDtrSocket';
import type { DailyTimeRecord } from '../../types/dtr';

const HOURS_PER_DAY = 9;

type ProfileFormState = {
  first_name: string;
  last_name: string;
  email: string;
  school_university: string;
  required_hours: string;
};

const buildFormState = (user: any, profile: InternProfile | null): ProfileFormState => ({
  first_name: user?.first_name ?? '',
  last_name: user?.last_name ?? '',
  email: user?.email ?? '',
  school_university: profile?.school_university ?? '',
  required_hours: profile ? String(profile.required_hours ?? '') : '',
});

const toDateInputValue = (value?: string | Date | null) => {
  if (!value) {
    return '';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '';
  }

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const calculateExpectedEndDateFromRemaining = (remainingHours: number) => {
  if (!Number.isFinite(remainingHours) || remainingHours <= 0) {
    return null;
  }

  const daysNeeded = Math.max(1, Math.ceil(remainingHours / HOURS_PER_DAY));
  const endDate = new Date();
  endDate.setDate(endDate.getDate() + daysNeeded - 1);
  return endDate;
};

const getRenderedHoursFromRecords = (records: DailyTimeRecord[]) => {
  return records.reduce((sum, record) => {
    const clockHours = record.clocks?.reduce((acc, clock) => {
      const hours = Number(clock.totalHours ?? 0);
      return acc + (Number.isFinite(hours) ? hours : 0);
    }, 0) ?? 0;

    const recordTotal = Number(record.totalHours ?? clockHours);
    const baseHours = Number.isFinite(recordTotal) ? recordTotal : clockHours;

    return sum + baseHours;
  }, 0);
};

const formatDate = (value?: string | Date | null) => {
  if (!value) {
    return 'Not provided';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return 'Not provided';
  }

  return new Intl.DateTimeFormat(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(date);
};


function DetailField({
  label,
  children,
  className = '',
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`rounded-xl border border-slate-200 bg-white p-3 shadow-sm ${className}`}>
      <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">{label}</p>
      <div className="mt-1.5 text-sm text-slate-900">{children}</div>
    </div>
  );
}

export default function ProfilePage() {
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const setUser = useAuthStore((state) => state.setUser);
  const dtrRecords = useDtrStore((state) => state.records);
  const refreshRecords = useDtrStore((state) => state.refreshRecords);

  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [error, setError] = useState('');
  const [internProfile, setInternProfile] = useState<InternProfile | null>(null);
  const [formData, setFormData] = useState<ProfileFormState>(() => buildFormState(user, null));

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!isAuthenticated) {
      return;
    }

    refreshRecords().catch(() => {});
  }, [isAuthenticated, refreshRecords]);

  useEffect(() => {
    if (!user?._id) {
      setInternProfile(null);
      return;
    }

    internProfileService
      .getInternProfileByUserId(user._id)
      .then((profile) => {
        setInternProfile(profile);
      })
      .catch(() => {
        setInternProfile(null);
      });
  }, [user?._id]);

  useEffect(() => {
    if (!editing) {
      setFormData(buildFormState(user, internProfile));
    }
  }, [user, internProfile, editing]);

  const handleDtrSocketUpdate = React.useCallback(async () => {
    try {
      await refreshRecords();
    } catch {}
  }, [refreshRecords]);

  useDtrSocket(handleDtrSocketUpdate);

  const fullName = `${user?.first_name ?? ''} ${user?.last_name ?? ''}`.trim() || 'Unnamed User';
  const identiconValue = String(user?.user_id || user?._id || user?.email || fullName || 'user');
  const jobTitleLabel = String((user as any)?.job_title || (user as any)?.job_role || 'Front End Developer');
  const departmentRoleLabel = String(user?.departments?.[0]?.department_role || 'Intern');
  const profileRoleLine = `${jobTitleLabel} · ${departmentRoleLabel}`;

  const hasAnyInternInput = Boolean(
    formData.school_university.trim() ||
      formData.required_hours.trim(),
  );

  const requiredHoursValue = Number(formData.required_hours || internProfile?.required_hours || 0);
  const renderedHoursValue = React.useMemo(
    () => getRenderedHoursFromRecords(dtrRecords),
    [dtrRecords],
  );
  const remainingHoursValue = Math.max(0, requiredHoursValue - renderedHoursValue);
  const expectedEndDate = calculateExpectedEndDateFromRemaining(remainingHoursValue);
  const expectedEndDateLabel = requiredHoursValue <= 0
    ? 'Not provided'
    : remainingHoursValue <= 0
      ? 'Completed'
      : formatDate(expectedEndDate);
  const progressPercentage =
    requiredHoursValue > 0
      ? Math.min(100, Math.round((renderedHoursValue / requiredHoursValue) * 100))
      : 0;

  if (!mounted) {
    return null;
  }

  if (!isAuthenticated) {
    window.location.replace('/login');
    return null;
  }

  const resetForm = () => {
    setFormData(buildFormState(user, internProfile));
  };

  const handleCancel = () => {
    setError('');
    setEditing(false);
    resetForm();
  };

  const handleRequiredHoursChange = (value: string) => {
    setFormData((prev) => ({
      ...prev,
      required_hours: value,
    }));
  };

  const handleEmailBlur = async () => {
    if (!user?._id) {
      return;
    }

    const nextEmail = formData.email.trim().toLowerCase();
    const currentEmail = String(user?.email ?? '').trim().toLowerCase();

    if (!nextEmail || nextEmail === currentEmail) {
      return;
    }

    try {
      const updatedUser = await userService.updateUser(user._id, {
        email: nextEmail,
      });

      setUser(updatedUser);
      setFormData((prev) => ({
        ...prev,
        email: updatedUser.email ?? nextEmail,
      }));
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Failed to update email');
      setFormData((prev) => ({
        ...prev,
        email: currentEmail,
      }));
    }
  };

  const handleSave = async () => {
    if (!user?._id) {
      return;
    }

    const nextFirstName = formData.first_name.trim();
    const nextLastName = formData.last_name.trim();

    if (!nextFirstName || !nextLastName) {
      setError('First name and last name are required.');
      return;
    }

    const shouldPersistInternProfile = Boolean(internProfile || hasAnyInternInput);
    let nextInternProfile = internProfile;

    if (shouldPersistInternProfile) {
      const nextSchool = formData.school_university.trim();
      const nextRequiredHours = Number(formData.required_hours);

      if (!nextSchool || !Number.isFinite(nextRequiredHours) || nextRequiredHours <= 0) {
        setError('School/University and required hours are required for the internship profile.');
        return;
      }

      const internPayload = {
        school_university: nextSchool,
        required_hours: nextRequiredHours,
        actual_end_date: toDateInputValue(internProfile?.actual_end_date ?? null) || null,
      };
      const nextEmail = formData.email.trim().toLowerCase();

      if (!nextEmail) {
        setError('Email is required.');
        return;
      }

      try {
        setError('');
        setSaving(true);

        const updatedUser = await userService.updateUser(user._id, {
          first_name: nextFirstName,
          last_name: nextLastName,
          email: nextEmail,
        });

        if (internProfile) {
          nextInternProfile = await internProfileService.updateInternProfile(user._id, internPayload);
        } else {
          nextInternProfile = await internProfileService.createInternProfile({
            user_id: user._id,
            ...internPayload,
          });
        }

        setUser(updatedUser);
        setInternProfile(nextInternProfile);
        setEditing(false);
        setFormData(buildFormState(updatedUser, nextInternProfile));
      } catch (err: any) {
        setError(err?.response?.data?.message || err?.message || 'Failed to save profile');
      } finally {
        setSaving(false);
      }

      return;
    }

    try {
      setError('');
      setSaving(true);

      const nextEmail = formData.email.trim().toLowerCase();

      if (!nextEmail) {
        setError('Email is required.');
        return;
      }

      const updatedUser = await userService.updateUser(user._id, {
        first_name: nextFirstName,
        last_name: nextLastName,
        email: nextEmail,
      });

      setUser(updatedUser);
      setEditing(false);
      setFormData(buildFormState(updatedUser, internProfile));
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-full bg-transparent">
      <div className="mx-auto max-w-6xl px-4 py-4 sm:px-6 lg:px-8 lg:py-4">
        <div className="mb-4 flex items-start justify-between gap-4">
          <div className="space-y-2">
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900">My Profile</h1>
            <p className="max-w-2xl text-sm text-slate-600">
              Update your account and internship details.
            </p>
          </div>

          <div className="shrink-0">
            {!editing ? (
              <Button variant="primary" size="sm" onClick={() => setEditing(true)}>
                Edit Profile
              </Button>
            ) : (
              <div className="flex flex-wrap gap-2">
                <Button variant="ghost" size="sm" onClick={handleCancel} disabled={saving}>
                  Cancel
                </Button>
                <Button variant="primary" size="sm" loading={saving} onClick={handleSave}>
                  Save Changes
                </Button>
              </div>
            )}
          </div>
        </div>

        <div className="relative overflow-hidden rounded-3xl border border-rose-900/40 bg-[#2b0b10] text-white shadow-[0_12px_36px_-20px_rgba(127,29,29,0.45)]">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(244,63,94,0.18),_transparent_22%),radial-gradient(circle_at_bottom_left,_rgba(220,38,38,0.14),_transparent_24%)]" />
          <div className="relative grid gap-4 p-4 sm:p-5 lg:grid-cols-[minmax(0,1fr)_240px] lg:items-center">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/10 shadow-lg shadow-slate-950/20 backdrop-blur">
                <UserIdenticon
                  value={identiconValue}
                  size={64}
                  className="h-16 w-16"
                  title="User avatar"
                />
              </div>

              <div>
                <h2 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">{fullName}</h2>
                <p className="mt-1 text-sm text-slate-300">{profileRoleLine}</p>
                <p className="mt-1 text-sm text-slate-300">{user?.email}</p>
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/10 p-3.5 backdrop-blur-sm">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-200/80">Internship Progress</p>
              <p className="mt-1.5 text-xl font-semibold text-white">{progressPercentage}%</p>
              <p className="mt-1 text-xs text-slate-200/80">
                {requiredHoursValue > 0
                  ? `${renderedHoursValue} / ${requiredHoursValue} hours`
                  : 'No internship hours yet'}
              </p>
              <div className="mt-2.5 h-2 overflow-hidden rounded-full bg-white/20">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-rose-400 to-orange-300 transition-all duration-300"
                  style={{ width: `${progressPercentage}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <Card
            title="Account Details"
            subtitle="Your personal information"
            className="border-slate-200 shadow-sm shadow-slate-200/60"
          >
            {error && (
              <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <div className="grid gap-3 sm:grid-cols-2">
              <DetailField label="First Name">
                {editing ? (
                  <Input
                    value={formData.first_name}
                    onChange={(e) => setFormData((prev) => ({ ...prev, first_name: e.target.value }))}
                    placeholder="First name"
                  />
                ) : (
                  <p className="text-base font-medium text-slate-900">{user?.first_name || 'Not provided'}</p>
                )}
              </DetailField>

              <DetailField label="Last Name">
                {editing ? (
                  <Input
                    value={formData.last_name}
                    onChange={(e) => setFormData((prev) => ({ ...prev, last_name: e.target.value }))}
                    placeholder="Last name"
                  />
                ) : (
                  <p className="text-base font-medium text-slate-900">{user?.last_name || 'Not provided'}</p>
                )}
              </DetailField>

              <DetailField label="Email" className="sm:col-span-2">
                {editing ? (
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
                    placeholder="Email address"
                    onBlur={handleEmailBlur}
                  />
                ) : (
                  <p className="text-base font-medium text-slate-900">{user?.email || 'Not provided'}</p>
                )}
              </DetailField>
            </div>
          </Card>

          <Card
            title="Internship Profile"
            subtitle="Information regarding your internship status"
            className="border-slate-200 shadow-sm shadow-slate-200/60"
          >
            {internProfile || editing ? (
              <div className="space-y-3">
                <div className="grid gap-3 sm:grid-cols-2">
                  <DetailField label="School / University" className="sm:col-span-2">
                    {editing ? (
                      <Input
                        value={formData.school_university}
                        onChange={(e) => setFormData((prev) => ({ ...prev, school_university: e.target.value }))}
                        placeholder="School or university"
                      />
                    ) : (
                      <p className="text-base font-medium text-slate-900">{internProfile?.school_university || 'Not provided'}</p>
                    )}
                  </DetailField>

                  <DetailField label="Internship Hours">
                    {editing ? (
                      <Input
                        type="number"
                        min="1"
                        value={formData.required_hours}
                        onChange={(e) => handleRequiredHoursChange(e.target.value)}
                        placeholder="Hours needed"
                      />
                    ) : (
                      <p className="text-base font-medium text-slate-900">
                        {internProfile ? `${internProfile.required_hours} hours` : 'Not provided'}
                      </p>
                    )}
                  </DetailField>

                  <DetailField label="Rendered Hours">
                    <p className="text-base font-medium text-slate-900">
                      {requiredHoursValue > 0 ? `${renderedHoursValue.toFixed(2)} hours` : 'Not provided'}
                    </p>
                  </DetailField>

                  <DetailField label="Hours Remaining">
                    <p className="text-base font-medium text-slate-900">
                      {requiredHoursValue > 0 ? `${remainingHoursValue.toFixed(2)} hours` : 'Not provided'}
                    </p>
                  </DetailField>

                  <DetailField label="Expected End Date">
                    <p className="text-base font-medium text-slate-900">
                      {expectedEndDateLabel}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      Based on {HOURS_PER_DAY} hours per day and DTR totals.
                    </p>
                  </DetailField>

                </div>
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-5 py-8 text-center">
                <p className="text-base font-medium text-slate-900">No internship profile yet</p>
                <p className="mt-2 text-sm text-slate-500">
                  Click Edit Profile to add internship details.
                </p>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
