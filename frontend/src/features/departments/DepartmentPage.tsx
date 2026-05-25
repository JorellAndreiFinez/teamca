import { useEffect, useState } from 'react';
import { Plus, Edit2, Trash2, Users } from 'lucide-react';
import { departmentService } from '../../services/departmentService';
import { userService } from '../../services/userService';
import { useAuthStore } from '../../store/authStore';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Modal from '../../components/ui/Modal';
import Card from '../../components/ui/Card';
import type { Department, User } from '../../types/user';
import { WidgetSkeleton } from '../../components/ui/Skeleton';

interface DepartmentForm {
  department_name: string;
  description: string;
  department_head: string;
}

export default function DepartmentPage() {
  const { user: currentUser } = useAuthStore();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Modal states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedDept, setSelectedDept] = useState<Department | null>(null);

  // Form state
  const [form, setForm] = useState<DepartmentForm>({
    department_name: '',
    description: '',
    department_head: '',
  });
  const [users, setUsers] = useState<User[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isSuperadmin = currentUser?.global_role === 'Superadmin';
  const isAdmin = currentUser?.global_role === 'Admin';

  useEffect(() => {
    fetchDepartments();
    if (isSuperadmin || isAdmin) {
      fetchUsers();
    }
  }, [isSuperadmin, isAdmin]);

  const fetchDepartments = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await departmentService.getAllDepartments();
      setDepartments(data);
    } catch (err) {
      setError('Error loading departments');
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const allUsers = await userService.getAllUsers();
      setUsers(allUsers);
    } catch (err) {
      // Error handler
    }
  };

  const handleCreateClick = () => {
    setForm({ department_name: '', description: '', department_head: '' });
    setIsCreateModalOpen(true);
  };

  const handleEditClick = (dept: Department) => {
    setSelectedDept(dept);
    setForm({
      department_name: dept.department_name || '',
      description: dept.description || '',
      department_head: dept.department_head || '',
    });
    setIsEditModalOpen(true);
  };

  const handleDeleteClick = (dept: Department) => {
    setSelectedDept(dept);
    setIsDeleteModalOpen(true);
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.department_name.trim()) {
      setError('Department name is required');
      return;
    }

    setIsSubmitting(true);
    try {
      setError('');
      await departmentService.createDepartment({
        department_name: form.department_name.trim(),
        description: form.description.trim() || undefined,
        department_head: form.department_head || null,
      });
      setSuccessMsg('Department created successfully');
      setIsCreateModalOpen(false);
      await fetchDepartments();
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error creating department');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDept || !form.department_name.trim()) {
      setError('Department name is required');
      return;
    }

    setIsSubmitting(true);
    try {
      setError('');
      await departmentService.updateDepartment(selectedDept._id!, {
        department_name: form.department_name.trim(),
        description: form.description.trim() || undefined,
        department_head: form.department_head || null,
      });
      setSuccessMsg('Department updated successfully');
      setIsEditModalOpen(false);
      await fetchDepartments();
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error updating department');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!selectedDept) return;

    setIsSubmitting(true);
    try {
      setError('');
      await departmentService.deleteDepartment(selectedDept._id!);
      setSuccessMsg('Department deleted successfully');
      setIsDeleteModalOpen(false);
      await fetchDepartments();
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error deleting department');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Helper to get department head name
  const getHeadName = (dept: Department): string => {
    if (typeof dept.department_head === 'object' && dept.department_head !== null) {
      const head = dept.department_head as any;
      return `${head.first_name || ''} ${head.last_name || ''}`.trim();
    }
    return '';
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Department Management</h1>
          <p className="text-sm text-slate-600 mt-1">Manage departments and assign heads</p>
        </div>
        {(isSuperadmin || isAdmin) && (
          <Button
            onClick={handleCreateClick}
            className="flex items-center gap-2"
          >
            <Plus size={18} />
            New Department
          </Button>
        )}
      </div>

      {/* Error Alert */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm">
          {error}
        </div>
      )}

      {/* Success Alert */}
      {successMsg && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-green-800 text-sm">
          {successMsg}
        </div>
      )}

      {/* Loading */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <WidgetSkeleton key={i} lines={3} />
          ))}
        </div>
      ) : departments.length === 0 ? (
        <Card>
          <div className="text-center py-12">
            <Users className="mx-auto mb-4 text-slate-400" size={48} />
            <p className="text-slate-600 font-medium">No departments yet</p>
            <p className="text-sm text-slate-500 mt-1">Create your first department to get started</p>
          </div>
        </Card>
      ) : (
        <div className="grid gap-4">
          {departments.map((dept) => (
            <Card key={dept._id}>
              <div className="flex items-start justify-between p-4">
                <div className="flex-1">
                  <h3 className="font-bold text-lg text-slate-900">{dept.department_name}</h3>
                  {dept.description && (
                    <p className="text-sm text-slate-600 mt-1">{dept.description}</p>
                  )}
                  <div className="flex gap-4 mt-3 text-sm text-slate-600">
                    {getHeadName(dept) && (
                      <span>📋 Head: <span className="font-medium text-slate-900">{getHeadName(dept)}</span></span>
                    )}
                    <span>👥 Members: <span className="font-medium text-slate-900">{dept.member_count ?? 0}</span></span>
                  </div>
                </div>

                {/* Actions */}
                {(isSuperadmin || isAdmin) && (
                  <div className="flex gap-2 ml-4">
                    <button
                      onClick={() => handleEditClick(dept)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Edit department"
                    >
                      <Edit2 size={18} />
                    </button>
                    <button
                      onClick={() => handleDeleteClick(dept)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Delete department"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Create Modal */}
      <Modal open={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)}>
        <div className="bg-white rounded-xl p-6 w-full max-w-md">
          <h2 className="text-xl font-bold text-slate-900 mb-4">Create Department</h2>
          <form onSubmit={handleCreateSubmit} className="space-y-4">
            <Input
              label="Department Name"
              value={form.department_name}
              onChange={(e) => setForm({ ...form, department_name: e.target.value })}
              placeholder="e.g., Engineering, Sales"
              required
            />
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Description (Optional)
              </label>
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Brief description of the department"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Department Head (Optional)
              </label>
              <select
                value={form.department_head}
                onChange={(e) => setForm({ ...form, department_head: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">-- No Head Assigned --</option>
                {users
                  .filter((u) => u.global_role === 'Admin')
                  .map((u) => (
                    <option key={u._id} value={u._id}>
                      {u.first_name} {u.last_name}
                    </option>
                  ))}
              </select>
            </div>
            <div className="flex gap-2 justify-end pt-4">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setIsCreateModalOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Creating...' : 'Create'}
              </Button>
            </div>
          </form>
        </div>
      </Modal>

      {/* Edit Modal */}
      <Modal open={isEditModalOpen} onClose={() => setIsEditModalOpen(false)}>
        <div className="bg-white rounded-xl p-6 w-full max-w-md">
          <h2 className="text-xl font-bold text-slate-900 mb-4">Edit Department</h2>
          <form onSubmit={handleEditSubmit} className="space-y-4">
            <Input
              label="Department Name"
              value={form.department_name}
              onChange={(e) => setForm({ ...form, department_name: e.target.value })}
              placeholder="e.g., Engineering, Sales"
              required
            />
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Description (Optional)
              </label>
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Brief description of the department"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Department Head (Optional)
              </label>
              <select
                value={form.department_head}
                onChange={(e) => setForm({ ...form, department_head: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">-- No Head Assigned --</option>
                {users
                  .filter((u) => u.global_role === 'Admin')
                  .map((u) => (
                    <option key={u._id} value={u._id}>
                      {u.first_name} {u.last_name}
                    </option>
                  ))}
              </select>
            </div>
            <div className="flex gap-2 justify-end pt-4">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setIsEditModalOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Updating...' : 'Update'}
              </Button>
            </div>
          </form>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal open={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)}>
        <div className="bg-white rounded-xl p-6 w-full max-w-md">
          <h2 className="text-xl font-bold text-slate-900 mb-2">Delete Department</h2>
          {selectedDept && (selectedDept.member_count ?? 0) > 0 ? (
            <>
              <div className="p-3 mb-4 bg-amber-50 border border-amber-200 rounded-lg text-amber-900 text-sm">
                <span className="font-semibold">{selectedDept.department_name}</span> has{' '}
                <span className="font-semibold">{selectedDept.member_count}</span> member
                {selectedDept.member_count === 1 ? '' : 's'}. Reassign or remove them before deleting.
              </div>
              <div className="flex justify-end">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setIsDeleteModalOpen(false)}
                >
                  Close
                </Button>
              </div>
            </>
          ) : (
            <>
              <p className="text-sm text-slate-600 mb-6">
                Are you sure you want to delete <span className="font-semibold">{selectedDept?.department_name}</span>? This action cannot be undone.
              </p>
              <div className="flex gap-2 justify-end">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setIsDeleteModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  variant="danger"
                  onClick={handleDeleteConfirm}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Deleting...' : 'Delete'}
                </Button>
              </div>
            </>
          )}
        </div>
      </Modal>
    </div>
  );
}

