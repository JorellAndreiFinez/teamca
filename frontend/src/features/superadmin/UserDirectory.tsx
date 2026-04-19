import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { io, type Socket } from "socket.io-client";
import { useAuthStore } from "@/store/authStore";
import { userService } from "@/services/userService";
import { User } from "../../types/user";
import type { NotificationItem } from "@/types/notification";
import { config } from "@/config/env";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Modal } from "@/components/ui/Modal";

import AddUserModal from "../../components/superadmin/AddUserModal";
import UpdateUserModal from "../../components/superadmin/UpdateUserModal";

import { Edit, Trash2, CircleStop } from "lucide-react";

export default function UserDirectory() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [openAddModal, setOpenAddModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [openUpdateModal, setOpenUpdateModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<User | null>(null);
  const [openDeleteModal, setOpenDeleteModal] = useState(false);
  const [openDeactivateModal, setOpenDeactivateModal] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deactivateError, setDeactivateError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deactivating, setDeactivating] = useState(false);

  const { token, isHydrated, user: currentUser } = useAuthStore();

  const isSuperadmin = currentUser?.global_role === "Superadmin";
  const isSupervisorAdmin = currentUser?.global_role === "Admin" && currentUser?.departments?.[0]?.department_role === "Supervisor";
  const isHeadAdmin = currentUser?.global_role === "Admin" && currentUser?.departments?.[0]?.department_role === "Head";

  const canEditUsers = isSuperadmin || isSupervisorAdmin || isHeadAdmin;
  const canDeleteUsers = isSuperadmin || isSupervisorAdmin;
  const editScope: "full" | "limited" = isHeadAdmin ? "limited" : "full";

  const refreshTimerRef = useRef<number | null>(null);

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const data = await userService.getAllUsers();
      setUsers(data);
    } catch (err) {
      console.error("Failed to fetch users:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  const scheduleRefresh = useCallback(() => {
    if (refreshTimerRef.current) {
      window.clearTimeout(refreshTimerRef.current);
    }

    refreshTimerRef.current = window.setTimeout(() => {
      void fetchUsers();
      refreshTimerRef.current = null;
    }, 200);
  }, [fetchUsers]);

  const socket = useMemo<Socket | null>(() => {
    if (!token) {
      return null;
    }

    return io(config.backendUrl, {
      transports: ["websocket"],
      auth: { token },
      autoConnect: true,
    });
  }, [token]);

  useEffect(() => {
    if (!isHydrated) {
      return;
    }

    if (!token) {
      setLoading(false);
      return;
    }

    void fetchUsers();
  }, [token, isHydrated, fetchUsers]);

  useEffect(() => {
    if (!socket || !isHydrated || !token) {
      return;
    }

    const handleDirectoryUpdated = () => {
      scheduleRefresh();
    };

    const handleNotification = (payload: NotificationItem) => {
      if (
        payload.event_type === "user_profile_updated"
        || payload.event_type === "user_role_changed"
        || payload.event_type === "user_activation_changed"
        || payload.event_type === "user_deleted"
      ) {
        scheduleRefresh();
      }
    };

    socket.on("user:directory-updated", handleDirectoryUpdated);
    socket.on("notification:received", handleNotification);

    return () => {
      socket.off("user:directory-updated", handleDirectoryUpdated);
      socket.off("notification:received", handleNotification);
      socket.disconnect();
    };
  }, [isHydrated, scheduleRefresh, socket, token]);

  useEffect(() => {
    return () => {
      if (refreshTimerRef.current) {
        window.clearTimeout(refreshTimerRef.current);
      }
    };
  }, []);

  const handleEdit = (user: User) => {
    if (!canEditUsers) {
      return;
    }

    setSelectedUser(user);
    setOpenUpdateModal(true);
  };


  // proper modal flow for delete/deactivate:
  const handleDelete = (user: User) => {
    if (!canDeleteUsers) {
      return;
    }
    setDeleteTarget(user);
    setDeleteError(null);
    setDeactivateError(null);
    if (user.is_active) {
      setOpenDeactivateModal(true);
    } else {
      setOpenDeleteModal(true);
    }
  };

  const handleConfirmDeactivate = async () => {
    if (!deleteTarget) return;
    try {
      setDeactivating(true);
      setDeactivateError(null);
      await userService.updateUser(deleteTarget._id || deleteTarget.user_id || "", { is_active: false });
      setUsers((prev) => prev.map((u) => (u._id === deleteTarget._id ? { ...u, is_active: false } : u)));
      await fetchUsers();
      setOpenDeactivateModal(false);
      setDeleteTarget(null);
      setDeactivating(false);
    } catch (err: any) {
      setDeactivating(false);
      setDeactivateError(err?.message || "Failed to deactivate user.");
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) {
      return;
    }

    try {
      const targetId = deleteTarget._id || deleteTarget.user_id || "";
      if (!targetId) {
        setDeleteError("Unable to delete user: missing user id.");
        return;
      }

      setDeleting(true);
      setDeleteError(null);

      await userService.deleteUser(targetId);

      // Immediately reflect deletion in this client, then re-sync with backend source of truth.
      setUsers((prev) => prev.filter((u) => (u._id || u.user_id) !== targetId));
      setOpenDeleteModal(false);
      setDeleteTarget(null);
      await fetchUsers();
    } catch (err: any) {
      console.error("Failed to delete user:", err);
      const errorMessage = err?.message || "Failed to delete user. Please try again.";
      setDeleteError(errorMessage);
    } finally {
      setDeleting(false);
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

        {isSuperadmin ? (
          <Button onClick={() => setOpenAddModal(true)} className="rounded-xl px-5">
            + Add User
          </Button>
        ) : null}
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
                      {canEditUsers ? (
                        <Button
                          size="sm"
                          variant="outline"
                          className="p-2"
                          onClick={() => handleEdit(u)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      ) : null}

                      {canDeleteUsers ? (
                        u.is_active ? (
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-red-600 p-2 text-red-600 hover:bg-red-50"
                            onClick={() => handleDelete(u)}
                            loading={deactivating && deleteTarget?._id === u._id && openDeactivateModal}
                            disabled={deactivating && deleteTarget?._id === u._id && openDeactivateModal}
                          >
                            <CircleStop className="h-4 w-4 text-red-600" />
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-red-600 p-2 text-red-600 hover:bg-red-50"
                            onClick={() => handleDelete(u)}
                            loading={deleting && deleteTarget?._id === u._id && openDeleteModal}
                            disabled={deleting && deleteTarget?._id === u._id && openDeleteModal}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )
                      ) : null}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {isSuperadmin ? (
        <AddUserModal
          open={openAddModal}
          onClose={() => setOpenAddModal(false)}
          onSuccess={fetchUsers}
        />
      ) : null}

      <UpdateUserModal
        open={openUpdateModal}
        onClose={() => setOpenUpdateModal(false)}
        onSuccess={fetchUsers}
        user={selectedUser}
        scope={editScope}
      />

      <Modal
        open={openDeleteModal}
        onClose={() => {
          if (deleting) {
            return;
          }
          setOpenDeleteModal(false);
          setDeleteTarget(null);
          setDeleteError(null);
        }}
      >
        <div className="space-y-6">
          {/* Header */}
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100">
                <Trash2 className="h-6 w-6 text-red-700" />
              </div>
              <h2 className="text-xl font-semibold text-slate-900">Delete Account Permanently?</h2>
            </div>
            <p className="text-sm text-slate-600 leading-relaxed">
              This action cannot be undone. All associated data will be permanently deleted from the system.
            </p>
          </div>

          {/* Warning Box */}
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 space-y-2">
            <div className="text-xs font-semibold uppercase tracking-wide text-red-700">Account to Delete</div>
            <div className="space-y-1">
              <div className="text-sm font-medium text-slate-900">
                {deleteTarget
                  ? `${deleteTarget.first_name || ""} ${deleteTarget.last_name || ""}`.trim() || "Unknown user"
                  : "-"}
              </div>
              <div className="text-sm text-red-700">{deleteTarget?.email || ""}</div>
            </div>
          </div>

          {/* Error State */}
          {deleteError ? (
            <div className="rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800 space-y-1">
              <div className="font-semibold">Unable to Delete</div>
              <div>{deleteError}</div>
            </div>
          ) : null}

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setOpenDeleteModal(false);
                setDeleteTarget(null);
                setDeleteError(null);
              }}
              disabled={deleting}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="danger"
              onClick={() => void handleConfirmDelete()}
              loading={deleting}
            >
              Permanently Delete
            </Button>
          </div>
        </div>
      </Modal>

      {/* Deactivate Modal */}
      <Modal
        open={openDeactivateModal}
        onClose={() => {
          if (deactivating) return;
          setOpenDeactivateModal(false);
          setDeleteTarget(null);
          setDeactivateError(null);
        }}
      >
        <div className="space-y-6">
          {/* Header */}
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100">
                <CircleStop className="h-6 w-6 text-amber-700" />
              </div>
              <h2 className="text-xl font-semibold text-slate-900">Deactivate Account?</h2>
            </div>
            <p className="text-sm text-slate-600 leading-relaxed">
              This will immediately suspend the account. The user will not be able to log in or access any system features.
            </p>
          </div>

          {/* User Info Box */}
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 space-y-2">
            <div className="text-xs font-semibold uppercase tracking-wide text-amber-700">Account to Deactivate</div>
            <div className="space-y-1">
              <div className="text-sm font-medium text-slate-900">
                {deleteTarget
                  ? `${deleteTarget.first_name || ""} ${deleteTarget.last_name || ""}`.trim() || "Unknown user"
                  : "-"}
              </div>
              <div className="text-sm text-amber-700">{deleteTarget?.email || ""}</div>
            </div>
          </div>

          {/* Error State */}
          {deactivateError ? (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 space-y-1">
              <div className="font-semibold">Error</div>
              <div>{deactivateError}</div>
            </div>
          ) : null}

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setOpenDeactivateModal(false);
                setDeleteTarget(null);
                setDeactivateError(null);
              }}
              disabled={deactivating}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="danger"
              onClick={() => void handleConfirmDeactivate()}
              loading={deactivating}
            >
              Deactivate Account
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
