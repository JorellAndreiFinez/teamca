// src/features/superadmin/UserDirectory.tsx

import React, { useEffect, useState } from "react";
import { useAuthStore } from "@/store/authStore";
import { userService } from "@/services/userService";
import { User } from "../../types/user";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

import AddUserModal from "../../components/superadmin/AddUserModal";
import UpdateUserModal from "../../components/superadmin/UpdateUserModal";

import { Edit, Trash2 } from "lucide-react";

export default function UserDirectory() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  const [openAddModal, setOpenAddModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [openUpdateModal, setOpenUpdateModal] = useState(false);

  const { token, isHydrated } = useAuthStore();

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const data = await userService.getAllUsers();
      setUsers(data);
    } catch (err) {
      console.error("Failed to fetch users:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isHydrated) return;
    if (!token) {
      setLoading(false);
      return;
    }

    fetchUsers();
  }, [token, isHydrated]);

  const handleEdit = (user: User) => {
    setSelectedUser(user);
    setOpenUpdateModal(true);
  };

  const handleDelete = async (user: User) => {
    if (
      !confirm(
        `Are you sure you want to delete ${user.first_name} ${user.last_name}?`,
      )
    )
      return;
    try {
      await userService.deleteUser(user._id!); // assuming _id exists
      fetchUsers();
    } catch (err) {
      console.error("Failed to delete user:", err);
    }
  };

  if (!isHydrated) return <div>Initializing session...</div>;
  if (loading) return <div>Loading users...</div>;

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">User Directory</h1>
          <p className="text-sm text-muted-foreground">
            Manage system users and roles
          </p>
        </div>

        <Button
          onClick={() => setOpenAddModal(true)}
          className="rounded-xl px-5"
        >
          + Add User
        </Button>
      </div>

      {/* Table */}
      <Card className="p-0 overflow-hidden rounded-2xl shadow-sm border">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px] text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left p-4">Name</th>
                <th className="text-left p-4">Email</th>
                <th className="text-left p-4">Role</th>
                <th className="text-left p-4">Department</th>
                <th className="text-left p-4">Status</th>
                <th className="text-left p-4">Actions</th>
              </tr>
            </thead>

            <tbody>
              {users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-6 text-center">
                    No users found
                  </td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr key={u._id} className="border-t hover:bg-muted/30">
                    <td className="p-4">{`${u.first_name || ""} ${u.last_name || ""}`}</td>
                    <td className="p-4">{u.email}</td>
                    <td className="p-4">{u.global_role || "N/A"}</td>
                    <td className="p-4">
                      {(u.departments || []).length > 0
                        ? u.departments.map((d) => d.department_role).join(", ")
                        : "None"}
                    </td>
                    <td className="p-4">
                      <span
                        className={`px-3 py-1 text-xs rounded-full ${
                          u.is_active
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-600"
                        }`}
                      >
                        {u.is_active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="p-4 flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="p-2"
                        onClick={() => handleEdit(u)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>

                      <Button
                        size="sm"
                        variant="outline"
                        className="p-2 text-red-600 border-red-600 hover:bg-red-50"
                        onClick={() => handleDelete(u)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* ADD USER MODAL */}
      <AddUserModal
        open={openAddModal}
        onClose={() => setOpenAddModal(false)}
        onSuccess={fetchUsers}
      />

      {/* UPDATE USER MODAL */}
      <UpdateUserModal
        open={openUpdateModal}
        onClose={() => setOpenUpdateModal(false)}
        onSuccess={fetchUsers}
        user={selectedUser}
      />
    </div>
  );
}
