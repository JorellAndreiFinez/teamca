// src/features/superadmin/components/AddUserModal.tsx
import { useState, useEffect } from "react";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { userService } from "@/services/userService";
import { departmentService } from "@/services/departmentService";
import type { Department } from "@/types/user";

interface Props {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const departmentRoles = ["Intern", "Supervisor", "Head"];

export default function AddUserModal({ open, onClose, onSuccess }: Props) {
  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    email: "",
    password: "",
    global_role: "Standard_User",
    is_active: true,
    department_id: "",
    department_role: "",
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

  const handleSubmit = async () => {
    setError("");

    if (!form.email || !form.password) {
      setError("Email and password are required.");
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
      });
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to create user.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose}>
      <div className="w-full max-w-md sm:max-w-lg md:max-w-xl p-6 sm:p-8 space-y-6 bg-white rounded-2xl shadow-lg">
        {/* Header */}
        <div className="space-y-1 text-center sm:text-left">
          <h2 className="text-2xl font-bold text-gray-800">Add User</h2>
          <p className="text-gray-500 text-sm sm:text-base">
            Create a new system account
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
              placeholder="First Name"
              value={form.first_name}
              onChange={handleInputChange}
              className="shadow-sm border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
            <Input
              name="last_name"
              placeholder="Last Name"
              value={form.last_name}
              onChange={handleInputChange}
              className="shadow-sm border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          {/* Email & Password */}
          <Input
            name="email"
            type="email"
            placeholder="Email"
            value={form.email}
            onChange={handleInputChange}
            className="shadow-sm border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 w-full"
          />
          <Input
            name="password"
            type="password"
            placeholder="Password"
            value={form.password}
            onChange={handleInputChange}
            className="shadow-sm border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 w-full"
          />

          {/* Role & Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700">
                Access Role
              </label>
              <select
                name="global_role"
                value={form.global_role}
                onChange={handleSelectChange}
                className="w-full h-10 rounded-lg border shadow-sm px-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-700 bg-white"
              >
                <option value="Superadmin">Superadmin</option>
                <option value="Admin">Admin</option>
                <option value="Standard_User">Standard User</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700">
                Status
              </label>
              <select
                name="is_active"
                value={String(form.is_active)}
                onChange={handleSelectChange}
                className="w-full h-10 rounded-lg border shadow-sm px-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-700 bg-white"
              >
                <option value="true">Active</option>
                <option value="false">Inactive</option>
              </select>
            </div>
          </div>

          {/* Department & Department Role */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700">
                Department
              </label>
              <select
                name="department_id"
                value={form.department_id}
                onChange={handleSelectChange}
                className="w-full h-10 rounded-lg border shadow-sm px-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-700 bg-white"
              >
                <option value="">None</option>
                {departments.map((d) => (
                  <option key={d._id} value={d._id}>
                    {d.department_name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700">
                Department Role
              </label>
              <select
                name="department_role"
                value={form.department_role}
                onChange={handleSelectChange}
                disabled={!form.department_id}
                className={`w-full h-10 rounded-lg border shadow-sm px-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-700 ${
                  !form.department_id
                    ? "bg-gray-100 cursor-not-allowed"
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
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4">
          <Button
            variant="ghost"
            onClick={onClose}
            disabled={loading}
            className="w-full sm:w-auto"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-white shadow-md rounded-lg"
          >
            {loading ? "Creating..." : "Create User"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
