// frontend/src/components/superadmin/UpdateUserModal.tsx

import { useState, useEffect } from "react";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { userService } from "@/services/userService";
import { departmentService } from "@/services/departmentService";
import { useAuthStore } from "@/store/authStore";
import type { Department, User } from "@/types/user";

import { NumberInput } from "@/components/ui/input/NumberInput";
import { TimeRangeInput } from "@/components/ui/input/TimeRangeInput";

interface Props {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  user: User | null;
  scope?: "full" | "limited";
}

const departmentRoles = ["Intern", "Supervisor", "Head"];

export default function UpdateUserModal({
  open,
  onClose,
  onSuccess,
  user,
  scope = "full",
}: Props) {
  const currentUser = useAuthStore((state) => state.user);
  const setAuthUser = useAuthStore((state) => state.setUser);

  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    email: "",
    password: "",
    global_role: "Standard_User",
    is_active: true,
    department_id: "",
    department_role: "",

    required_hours: 0,
    working_hours: {
      start: "",
      end: "",
    },
    working_days: [] as string[],
  });

  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // ✅ Prefill user data
  useEffect(() => {
    if (!user) return;

    setForm({
      first_name: user.first_name || "",
      last_name: user.last_name || "",
      email: user.email || "",
      password: "",
      global_role: user.global_role || "Standard_User",
      is_active: user.is_active ?? true,
      department_id: user.departments?.[0]?.department_id || "",
      department_role: user.departments?.[0]?.department_role || "",

      // ✅ new fields (safe fallback)
      required_hours: (user as any).required_hours || 0,
      working_hours: {
        start: (user as any).working_hours?.start || "",
        end: (user as any).working_hours?.end || "",
      },
      working_days: (user as any).working_days || [],
    });
  }, [user]);

  useEffect(() => {
    if (!open) return;

    const fetchDepartments = async () => {
      try {
        const data = await departmentService.getAllDepartments();
        setDepartments(data);
      } catch (err) {
        console.error("Failed to fetch departments", err);
      }
    };

    fetchDepartments();
  }, [open]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: name === "is_active" ? value === "true" : value,
    }));
  };

  const toggleWorkingDay = (day: string) => {
    setForm((prev) => {
      const exists = prev.working_days.includes(day);
      return {
        ...prev,
        working_days: exists
          ? prev.working_days.filter((d) => d !== day)
          : [...prev.working_days, day],
      };
    });
  };

  const handleSubmit = async () => {
    if (!user?._id) return;

    setError("");

    try {
      setLoading(true);

      const payload: any = {
        first_name: form.first_name,
        last_name: form.last_name,
        global_role: form.global_role,
        is_active: form.is_active,
      };

      if (scope === "full") {
        payload.global_role = form.global_role;
        payload.is_active = form.is_active;

      // only update password if provided
      if (form.password) {
        payload.password_hash = form.password;
      }

      // departments handling
      if (form.department_id) {
        payload.departments = [
          {
            department_id: form.department_id,
            department_role: form.department_role,
          },
        ];
      } else {
        payload.departments = [];
      }

      const updated = await userService.updateUser(user._id, payload);

      const currentUserId = currentUser?.user_id || currentUser?._id;
      const updatedUserId = updated?.user_id || updated?._id;
      if (currentUserId && updatedUserId && String(currentUserId) === String(updatedUserId)) {
        setAuthUser(updated);
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to update user.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose}>
      <div className="w-full max-w-md sm:max-w-lg md:max-w-xl p-6 sm:p-8 space-y-6 bg-white rounded-2xl shadow-lg">
        {/* Header */}
        <div className="space-y-1 text-center sm:text-left">
          <h2 className="text-2xl font-bold text-gray-800">Update User</h2>
          <p className="text-gray-500 text-sm sm:text-base">
            Modify user account details
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="text-sm text-red-600 bg-red-50 px-4 py-2 rounded-md border border-red-100">
            {error}
          </div>
        )}

        {/* Form */}
        <div className="space-y-4">
          {/* Name */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              name="first_name"
              value={form.first_name}
              onChange={handleInputChange}
              placeholder="First Name"
            />
            <Input
              name="last_name"
              value={form.last_name}
              onChange={handleInputChange}
              placeholder="Last Name"
            />
          </div>

          {/* Email */}
          <Input name="email" value={form.email} disabled />

          {/* Password */}
          <Input
            name="password"
            type="password"
            placeholder="New Password (optional)"
            value={form.password}
            onChange={handleInputChange}
            disabled={scope === "limited"}
          />

          {/* Role + Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <select
              name="global_role"
              value={form.global_role}
              onChange={handleSelectChange}
              disabled={scope === "limited"}
              className="w-full h-10 rounded-lg border px-3"
            >
              <option value="Superadmin">Superadmin</option>
              <option value="Admin">Admin</option>
              <option value="Standard_User">Standard User</option>
            </select>

            <select
              name="is_active"
              value={String(form.is_active)}
              onChange={handleSelectChange}
              disabled={scope === "limited"}
              className="w-full h-10 rounded-lg border px-3"
            >
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </select>
          </div>

          {/* Department */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <select
              name="department_id"
              value={form.department_id}
              onChange={handleSelectChange}
              disabled={scope === "limited"}
              className="w-full h-10 rounded-lg border px-3"
            >
              <option value="">None</option>
              {departments.map((d) => (
                <option key={d._id} value={d._id}>
                  {d.department_name}
                </option>
              ))}
            </select>

            <select
              name="department_role"
              value={form.department_role}
              onChange={handleSelectChange}
              disabled={scope === "limited" || !form.department_id}
              className="w-full h-10 rounded-lg border px-3"
            >
              <option value="">Select role</option>
              {departmentRoles.map((role) => (
                <option key={role} value={role}>
                  {role}
                </option>
              ))}
            </select>
          </div>

          {/* Schedule Section */}
          <div className="space-y-4 pt-4 border-t">
            <h3 className="text-lg font-semibold">Schedule</h3>

            {/* Required Hours */}
            <NumberInput
              label="Required Hours"
              value={form.required_hours}
              min={0}
              onChange={(val) =>
                setForm((prev) => ({ ...prev, required_hours: val }))
              }
            />

            {/* Working Hours */}
            <TimeRangeInput
              label="Working Hours"
              value={form.working_hours}
              onChange={(val) =>
                setForm((prev) => ({ ...prev, working_hours: val }))
              }
              required
            />

            {/* Working Days */}
            <div>
              <label className="text-sm font-medium">Working Days</label>
              <div className="flex flex-wrap gap-2 mt-2">
                {["M", "T", "W", "Th", "F", "Sat", "Sun"].map((day) => (
                  <button
                    key={day}
                    type="button"
                    onClick={() => toggleWorkingDay(day)}
                    className={`px-3 py-1 rounded-full text-sm border ${
                      form.working_days.includes(day)
                        ? "bg-indigo-600 text-white"
                        : "bg-gray-100"
                    }`}
                  >
                    {day}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit}>
            {loading ? "Updating..." : "Update User"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
