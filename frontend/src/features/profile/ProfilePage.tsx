import React, { useState } from 'react';
import { useAuthStore } from '../../store/authStore';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';

export default function ProfilePage() {
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    first_name: user?.first_name ?? '',
    last_name: user?.last_name ?? '',
  });
  const [mounted, setMounted] = useState(false);
  React.useEffect(() => { setMounted(true); }, []);

  React.useEffect(() => {
    setFormData({
      first_name: user?.first_name ?? '',
      last_name: user?.last_name ?? '',
    });
  }, [user?.first_name, user?.last_name]);

  if (!mounted) return null;

  if (!isAuthenticated) {
    window.location.replace('/login');
    return null;
  }

  const handleSave = async () => {
    setSaving(true);
    // TODO: connect to backend userService.updateProfile
    await new Promise((r) => setTimeout(r, 800));
    setSaving(false);
    setEditing(false);
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
              {user ? `${user.first_name[0]}${user.last_name[0]}` : 'U'}
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

      {/* Profile details */}
      <Card title="Account Details">
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
              {user?.department_id && (
                <div>
                  <p className="text-xs font-medium text-gray-500 mb-0.5">Department ID</p>
                  <p className="text-sm text-gray-800">#{user.department_id}</p>
                </div>
              )}
            </>
          )}
        </div>
      </Card>
    </div>
  );
}
