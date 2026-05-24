import { useState, useEffect } from "react";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { userService } from "@/services/userService";
import { departmentService } from "@/services/departmentService";
import type { Department } from "@/types/user";
import { NumberInput } from "@/components/ui/input/NumberInput";
import { TimeRangeInput } from "@/components/ui/input/TimeRangeInput";

interface Props {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const departmentRoles = ["Intern", "Supervisor", "Head"];
const globalRoles = ["Standard_User", "Admin", "Superadmin"] as const;

export default function AddUserModal({ open, onClose, onSuccess }: Props) {
  const [isWhitelist, setIsWhitelist] = useState(false);
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

  useEffect(() => {
    if (!open) return;

    const fetchDepartments = async () => {
      try {
        const data = await departmentService.getAllDepartments();
        setDepartments(data);
      } catch (err) {
        // Keep UI responsive even if departments fail to load.
      }
    };

    fetchDepartments();
  }, [open]);

  const handleWhitelistToggle = (e: React.ChangeEvent<HTMLInputElement>) => {
    const checked = e.target.checked;
    setIsWhitelist(checked);
    if (checked) {
      setForm((prev) => ({
        ...prev,
        first_name: "",
        last_name: "",
        password: "",
        global_role:
          prev.global_role === "Superadmin" ? "Standard_User" : prev.global_role,
        department_role: "Intern",
      }));
    }
  };

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
    setError("");

    if (!form.email) {
      setError("Email is required.");
      return;
    }

    if (isWhitelist) {
      if (!form.department_id) {
        setError("Department is required for whitelisted users.");
        return;
      }
      if (!form.department_role) {
        setError("Department role is required for whitelisted users.");
        return;
      }
      try {
        setLoading(true);
        await userService.createWhitelistedUser(form.email, {
          global_role: form.global_role as "Admin" | "Standard_User",
          department_id: form.department_id,
          department_role: form.department_role as "Head" | "Supervisor" | "Intern",
        });
        onSuccess();
        onClose();

        setForm({
          first_name: "",
          last_name: "",
          email: "",
          password: "",
          global_role: "Standard_User",
          is_active: true,
          department_id: "",
          department_role: "",
          required_hours: 8,
          working_hours: { start: "08:00", end: "17:00" },
          working_days: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
        });
        setIsWhitelist(false);
      } catch (err: any) {
        setError(err?.response?.data?.message || "Failed to whitelist email.");
      } finally {
        setLoading(false);
      }
      return;
    }

    if (!form.password) {
      setError("Password is required.");
      return;
    }

    try {
      setLoading(true);

      const payload = {
        first_name: form.first_name,
        last_name: form.last_name,
        email: form.email,
        password_hash: form.password,
        global_role: form.global_role,
        is_active: form.is_active,

        required_hours: form.required_hours,

        working_hours: form.working_hours,
        working_days: form.working_days,

        departments: form.department_id
          ? [
              {
                department_id: form.department_id,
                department_role: form.department_role,
              },
            ]
          : [],
      };

      await userService.createUser(payload);
      onSuccess();
      onClose();

      setForm({
        first_name: "",
        last_name: "",
        email: "",
        password: "",
        global_role: "Standard_User",
        is_active: true,
        department_id: "",
        department_role: "",

        required_hours: 0,
        working_hours: { start: "", end: "" },
        working_days: [],
      });
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to create user.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose}>
      <div className="w-full space-y-6">
        {/* header */}
        <div className="space-y-1">
          <h2 className="text-2xl font-bold text-slate-900">Add User</h2>
          <p className="text-sm text-slate-600">Create a new system account</p>
        </div>

        {/* error alert */}
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* form */}
        <div className="space-y-5">
          {/* whitelist toggle */}
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="isWhitelist"
              checked={isWhitelist}
              onChange={handleWhitelistToggle}
              className="w-4 h-4 rounded border-slate-300"
            />
            <label
              htmlFor="isWhitelist"
              className="text-sm font-medium text-slate-700"
            >
              Whitelist Email Only (No Password Required)
            </label>
          </div>

          {/* name fields - hidden for whitelist */}
          {!isWhitelist && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                name="first_name"
                placeholder="First Name"
                value={form.first_name}
                onChange={handleInputChange}
                className="border rounded-lg"
              />
              <Input
                name="last_name"
                placeholder="Last Name"
                value={form.last_name}
                onChange={handleInputChange}
                className="border rounded-lg"
              />
            </div>
          )}

          {/* email & password */}
          <Input
            name="email"
            type="email"
            placeholder="Email"
            value={form.email}
            onChange={handleInputChange}
            className="border rounded-lg w-full"
          />

          {!isWhitelist && (
            <Input
              name="password"
              type="password"
              placeholder="Password"
              value={form.password}
              onChange={handleInputChange}
              className="border rounded-lg w-full"
            />
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">
                Access Role
              </label>
              <select
                name="global_role"
                value={form.global_role}
                onChange={handleSelectChange}
                className="w-full h-10 rounded-lg border px-3 text-slate-700 bg-white"
              >
                {globalRoles
                  .filter((role) => !isWhitelist || role !== "Superadmin")
                  .map((role) => (
                    <option key={role} value={role}>
                      {role === "Standard_User" ? "Standard User" : role}
                    </option>
                  ))}
              </select>
            </div>

            {!isWhitelist && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">
                  Status
                </label>
                <select
                  name="is_active"
                  value={String(form.is_active)}
                  onChange={handleSelectChange}
                  className="w-full h-10 rounded-lg border px-3 text-slate-700 bg-white"
                >
                  <option value="true">Active</option>
                  <option value="false">Inactive</option>
                </select>
              </div>
            )}
          </div>

          {/* department fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">
                Department
              </label>
              <select
                name="department_id"
                value={form.department_id}
                onChange={handleSelectChange}
                className="w-full h-10 rounded-lg border px-3 text-slate-700 bg-white"
              >
                <option value="">None</option>
                {departments.map((d) => (
                  <option key={d._id} value={d._id}>
                    {d.department_name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">
                Department Role
              </label>
              <select
                name="department_role"
                value={form.department_role}
                onChange={handleSelectChange}
                disabled={!form.department_id}
                className={`w-full h-10 rounded-lg border px-3 text-slate-700 ${
                  !form.department_id
                    ? "bg-slate-100 cursor-not-allowed"
                    : "bg-white"
                }`}
              >
                <option value="">Select role</option>
                {departmentRoles.map((role) => (
                  <option key={role} value={role}>
                    {role}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/*  SCHEDULE SECTION */}
          <div className="space-y-4 pt-4 border-t">
            <h3 className="text-lg font-semibold text-gray-800">Schedule</h3>

            {/* Required Hours */}
            <div className="space-y-1">
              <NumberInput
                label="Required Hours"
                value={form.required_hours}
                min={0}
                onChange={(val) =>
                  setForm((prev) => ({
                    ...prev,
                    required_hours: val,
                  }))
                }
              />
            </div>

            {/* Working Hours */}
            <TimeRangeInput
              label="Working Hours"
              value={form.working_hours}
              onChange={(val) =>
                setForm((prev) => ({
                  ...prev,
                  working_hours: val,
                }))
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

        {/* actions */}
        <div className="flex justify-end gap-3 pt-2">
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? "Creating..." : "Create User"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
