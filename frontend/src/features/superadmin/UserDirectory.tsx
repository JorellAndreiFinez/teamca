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
    if (!isHydrated) {
      return;
    }

    if (!token) {
      setLoading(false);
      return;
    }

    void fetchUsers();
  }, [token, isHydrated]);

  const handleEdit = (user: User) => {
    setSelectedUser(user);
    setOpenUpdateModal(true);
  };

  const handleDelete = async (user: User) => {
    if (!confirm(`Are you sure you want to delete ${user.first_name} ${user.last_name}?`)) {
      return;
    }

    try {
      await userService.deleteUser(user._id || user.user_id || "");
      await fetchUsers();
    } catch (err) {
      console.error("Failed to delete user:", err);
    }
  };

  if (!isHydrated) {
    return <div>Initializing session...</div>;
  }

  if (loading) {
    return <div>Loading users...</div>;
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">User Directory</h1>
          <p className="text-sm text-muted-foreground">Manage system users and roles</p>
        </div>

        <Button onClick={() => setOpenAddModal(true)} className="rounded-xl px-5">
          + Add User
        </Button>
      </div>

      <Card className="overflow-hidden rounded-2xl border p-0 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px] text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="p-4 text-left">Name</th>
                <th className="p-4 text-left">Email</th>
                <th className="p-4 text-left">Role</th>
                <th className="p-4 text-left">Department</th>
                <th className="p-4 text-left">Status</th>
                <th className="p-4 text-left">Actions</th>
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
                  <tr key={u._id || u.user_id} className="border-t hover:bg-muted/30">
                    <td className="p-4">{`${u.first_name || ""} ${u.last_name || ""}`.trim()}</td>
                    <td className="p-4">{u.email}</td>
                    <td className="p-4">{u.global_role || "N/A"}</td>
                    <td className="p-4">
                      {(u.departments ?? []).length > 0
                        ? (u.departments ?? []).map((d) => d.department_role).join(", ")
                        : "None"}
                    </td>
                    <td className="p-4">
                      <span
                        className={`rounded-full px-3 py-1 text-xs ${
                          u.is_active ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"
                        }`}
                      >
                        {u.is_active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="flex gap-2 p-4">
                      <Button
                        size="sm"
                        variant="outline"
                        className="p-2"
                        onClick={() => handleEdit(u)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>

                      <Button
                        size="sm"
                        variant="outline"
                        className="border-red-600 p-2 text-red-600 hover:bg-red-50"
                        onClick={() => void handleDelete(u)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <AddUserModal
        open={openAddModal}
        onClose={() => setOpenAddModal(false)}
        onSuccess={fetchUsers}
      />

      <UpdateUserModal
        open={openUpdateModal}
        onClose={() => setOpenUpdateModal(false)}
        onSuccess={fetchUsers}
        user={selectedUser}
      />
    </div>
  );
}
