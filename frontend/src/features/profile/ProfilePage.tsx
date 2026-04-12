import React, { useState } from 'react';
import { useAuthStore } from '../../store/authStore';
import { userService } from '../../services/userService';
import { internProfileService } from '../../services/internProfileService';
import type { InternProfile } from '../../types/user';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';

export default function ProfilePage() {
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [internProfile, setInternProfile] = useState<InternProfile | null>(null);
  const [formData, setFormData] = useState({
    first_name: user?.first_name ?? '',
    last_name: user?.last_name ?? '',
    school_university: '',
    required_hours: 0,
    expected_end_date: '',
    actual_end_date: '',
  });
  const [mounted, setMounted] = useState(false);
  const [error, setError] = useState('');
  const setUser = useAuthStore((state) => state.setUser);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  React.useEffect(() => {
    if (user?._id) {
      internProfileService
        .getInternProfileByUserId(user._id)
        .then((profile) => {
          if (!profile) {
            setInternProfile(null);
            return;
          }
          setInternProfile(profile);
          const endDate = profile.expected_end_date
            ? new Date(profile.expected_end_date).toISOString().split('T')[0]
            : '';
          const actualDate = profile.actual_end_date
            ? new Date(profile.actual_end_date).toISOString().split('T')[0]
            : '';
          setFormData((prev) => ({
            ...prev,
            school_university: profile.school_university,
            required_hours: profile.required_hours,
            expected_end_date: endDate,
            actual_end_date: actualDate,
          }));
        })
        .catch((err) => {
          console.error('Failed to fetch intern profile:', err);
          setInternProfile(null);
        });
    }
  }, [user?._id]);

  React.useEffect(() => {
    setFormData((prev) => ({
      ...prev,
      first_name: user?.first_name ?? '',
      last_name: user?.last_name ?? '',
    }));
  }, [user?._id]);

  if (!mounted) return null;

  if (!isAuthenticated) {
    window.location.replace('/login');
    return null;
  }

  const handleSave = async () => {
    if (!user) return;

    try {
      setError('');
      setSaving(true);

      const userPromise = userService.updateUser(user._id, {
        first_name: formData.first_name,
        last_name: formData.last_name,
      });

      const profilePromise = internProfile
        ? internProfileService.updateInternProfile(user._id, {
            school_university: formData.school_university,
            required_hours: formData.required_hours,
            expected_end_date: formData.expected_end_date,
            actual_end_date: formData.actual_end_date || null,
          })
        : Promise.resolve(null);

      const [updatedUser, updatedProfile] = await Promise.all([userPromise, profilePromise]);

      setUser(updatedUser);
      if (updatedProfile) {
        setInternProfile(updatedProfile);
      }
      setSaving(false);
      setEditing(false);
    } catch (err: any) {
      setError(err?.message || 'Failed to save profile');
      setSaving(false);
    }
  };

  const roleLabel = user?.global_role === 'Superadmin'
    ? 'Super Admin'
    : user?.global_role === 'Admin'
    ? 'Admin'
    : user?.departments?.[0]?.department_role || 'Intern';

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>
        <p className="text-sm text-gray-500 mt-1">Manage your personal information</p>
      </div>

      {/* Avatar + name */}
      <Card className="mb-6">
        <div className="flex items-center gap-5">
          <div className="w-16 h-16 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0">
            <span className="text-white text-2xl font-bold">
              {user && user.first_name && user.last_name
                ? `${user.first_name[0]}${user.last_name[0]}`
                : 'U'}
            </span>
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              {user?.first_name} {user?.last_name}
            </h2>
            <p className="text-sm text-gray-500">{user?.email}</p>
            <span className="inline-block mt-1.5 px-3 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
              {roleLabel}
            </span>
          </div>
          <div className="ml-auto">
            {!editing ? (
              <Button variant="secondary" size="sm" onClick={() => setEditing(true)}>
                Edit Profile
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={() => setEditing(false)}>
                  Cancel
                </Button>
                <Button variant="primary" size="sm" loading={saving} onClick={handleSave}>
                  Save
                </Button>
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Account Details */}
      <Card title="Account Details">
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
            {error}
          </div>
        )}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {editing ? (
            <>
              <Input
                label="First Name"
                value={formData.first_name}
                onChange={(e) => setFormData((p) => ({ ...p, first_name: e.target.value }))}
              />
              <Input
                label="Last Name"
                value={formData.last_name}
                onChange={(e) => setFormData((p) => ({ ...p, last_name: e.target.value }))}
              />
              <Input
                label="Email"
                type="email"
                value={user?.email ?? ''}
                helperText="Contact admin to change email"
                disabled
              />
              <div>
                <p className="text-xs font-medium text-gray-500 mb-0.5">Role</p>
                <p className="text-sm font-medium text-gray-800">{roleLabel}</p>
              </div>
            </>
          ) : (
            <>
              <div>
                <p className="text-xs font-medium text-gray-500 mb-0.5">First Name</p>
                <p className="text-sm text-gray-800">{user?.first_name}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 mb-0.5">Last Name</p>
                <p className="text-sm text-gray-800">{user?.last_name}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 mb-0.5">Email</p>
                <p className="text-sm text-gray-800">{user?.email}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 mb-0.5">Role</p>
                <p className="text-sm text-gray-800">{roleLabel}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 mb-0.5">Account Status</p>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                  user?.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                }`}>
                  {user?.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>
            </>
          )}
        </div>
      </Card>

      {/* Internship Details */}
      {internProfile && (
        <Card title="Internship Details" className="mt-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {editing ? (
              <>
                <Input
                  label="School/University"
                  value={formData.school_university}
                  onChange={(e) => setFormData((p) => ({ ...p, school_university: e.target.value }))}
                />
                <Input
                  label="Required Hours"
                  type="number"
                  min="1"
                  value={formData.required_hours}
                  onChange={(e) => setFormData((p) => ({ ...p, required_hours: parseInt(e.target.value) || 0 }))}
                />
                <Input
                  label="Expected End Date"
                  type="date"
                  value={formData.expected_end_date}
                  onChange={(e) => setFormData((p) => ({ ...p, expected_end_date: e.target.value }))}
                />
                <Input
                  label="Actual End Date (Optional)"
                  type="date"
                  value={formData.actual_end_date}
                  onChange={(e) => setFormData((p) => ({ ...p, actual_end_date: e.target.value }))}
                />
              </>
            ) : (
              <>
                <div>
                  <p className="text-xs font-medium text-gray-500 mb-0.5">School/University</p>
                  <p className="text-sm text-gray-800">{internProfile.school_university}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500 mb-0.5">Required Hours</p>
                  <p className="text-sm text-gray-800">{internProfile.required_hours} hours</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500 mb-0.5">Rendered Hours</p>
                  <p className="text-sm text-gray-800">{internProfile.rendered_hours_total} hours</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500 mb-0.5">Expected End Date</p>
                  <p className="text-sm text-gray-800">
                    {new Date(internProfile.expected_end_date).toLocaleDateString()}
                  </p>
                </div>
                {internProfile.actual_end_date && (
                  <div>
                    <p className="text-xs font-medium text-gray-500 mb-0.5">Actual End Date</p>
                    <p className="text-sm text-gray-800">
                      {new Date(internProfile.actual_end_date).toLocaleDateString()}
                    </p>
                  </div>
                )}
              </>
            )}
          </div>
        </Card>
      )}
    </div>
  );
}
