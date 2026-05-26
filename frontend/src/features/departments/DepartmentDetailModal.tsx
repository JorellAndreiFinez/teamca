import { useEffect, useMemo, useState } from 'react';
import Modal from '../../components/ui/Modal';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { departmentService } from '../../services/departmentService';
import type { Department, DepartmentMember, DepartmentRole } from '../../types/user';

interface Props {
  open: boolean;
  onClose: () => void;
  department: Department | null;
}

const PAGE_SIZE = 10;
const ROLE_OPTIONS: ('' | DepartmentRole)[] = ['', 'Head', 'Supervisor', 'Intern'];

export default function DepartmentDetailModal({ open, onClose, department }: Props) {
  const [members, setMembers] = useState<DepartmentMember[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [role, setRole] = useState<'' | DepartmentRole>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    setPage(1);
    setSearch('');
    setDebouncedSearch('');
    setRole('');
  }, [open, department?._id]);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(search), 250);
    return () => window.clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, role]);

  useEffect(() => {
    if (!open || !department?._id) return;
    let cancelled = false;
    setLoading(true);
    setError('');
    departmentService
      .getDepartmentMembers(department._id, {
        page,
        pageSize: PAGE_SIZE,
        search: debouncedSearch || undefined,
        role: role || undefined,
      })
      .then((data) => {
        if (cancelled) return;
        setMembers(data.members);
        setTotal(data.total);
      })
      .catch(() => {
        if (cancelled) return;
        setError('Failed to load members.');
        setMembers([]);
        setTotal(0);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open, department?._id, page, debouncedSearch, role]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const headName = useMemo(() => {
    if (!department) return '';
    const head = department.department_head as any;
    if (head && typeof head === 'object') {
      return `${head.first_name ?? ''} ${head.last_name ?? ''}`.trim();
    }
    return '';
  }, [department]);

  const createdAt = useMemo(() => {
    const raw = (department as any)?.createdAt;
    if (!raw) return '';
    const date = new Date(raw);
    if (Number.isNaN(date.getTime())) return '';
    return date.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }, [department]);

  const roleCounts = department?.role_counts;

  if (!department) return null;

  return (
    <Modal open={open} onClose={onClose} className="max-w-6xl p-4 sm:p-4">
      <div>
        {/* Header */}
        <div className="space-y-1 mb-3">
          <h2 className="text-2xl font-bold text-slate-900">{department.department_name}</h2>
          {department.description && (
            <p className="text-sm text-slate-600">{department.description}</p>
          )}
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-600 pt-2">
            {headName && (
              <span>
                Head: <span className="font-medium text-slate-900">{headName}</span>
              </span>
            )}
            <span>
              Members: <span className="font-medium text-slate-900">{department.member_count ?? 0}</span>
            </span>
            {createdAt && (
              <span>
                Created: <span className="font-medium text-slate-900">{createdAt}</span>
              </span>
            )}
          </div>
        </div>

        {/* Role badges */}
        {roleCounts && (
          <div className="flex flex-wrap gap-2 mb-3">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-700">
              <span className="font-semibold">{roleCounts.Head}</span> Head{roleCounts.Head === 1 ? '' : 's'}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">
              <span className="font-semibold">{roleCounts.Supervisor}</span> Supervisor{roleCounts.Supervisor === 1 ? '' : 's'}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
              <span className="font-semibold">{roleCounts.Intern}</span> Intern{roleCounts.Intern === 1 ? '' : 's'}
            </span>
          </div>
        )}

        {/* Search + role filter */}
        <div className="flex flex-col sm:flex-row gap-2 mb-3">
          <div className="flex-1">
            <Input
              placeholder="Search name or email"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as '' | DepartmentRole)}
            className="h-10 rounded-lg border border-slate-300 px-3 text-sm text-slate-700"
          >
            {ROLE_OPTIONS.map((r) => (
              <option key={r || 'all'} value={r}>
                {r === '' ? 'All roles' : r}
              </option>
            ))}
          </select>
        </div>

        {/* Error */}
        {error && (
          <div className="p-3 mb-4 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm">
            {error}
          </div>
        )}

        {/* Member list */}
        <div className="border border-slate-200 rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="text-left px-4 py-2 font-medium">Name</th>
                <th className="text-left px-4 py-2 font-medium hidden sm:table-cell">Email</th>
                <th className="text-left px-4 py-2 font-medium">Role</th>
                <th className="text-left px-4 py-2 font-medium hidden sm:table-cell">Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-center text-slate-500">
                    Loading members...
                  </td>
                </tr>
              ) : members.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-center text-slate-500">
                    No members match the current filter.
                  </td>
                </tr>
              ) : (
                members.map((m) => (
                  <tr key={m._id} className="border-t border-slate-100">
                    <td className="px-4 py-2 text-slate-900">
                      {m.first_name} {m.last_name}
                    </td>
                    <td className="px-4 py-2 text-slate-600 hidden sm:table-cell">
                      {m.email}
                    </td>
                    <td className="px-4 py-2 text-slate-700">{m.department_role ?? '—'}</td>
                    <td className="px-4 py-2 hidden sm:table-cell">
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                          m.is_active
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {m.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between mt-3 text-sm text-slate-600">
          <span>
            {total === 0
              ? 'No results'
              : `Showing ${(page - 1) * PAGE_SIZE + 1}–${Math.min(page * PAGE_SIZE, total)} of ${total}`}
          </span>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1 || loading}
            >
              Previous
            </Button>
            <span className="self-center text-slate-700">
              Page {page} of {totalPages}
            </span>
            <Button
              type="button"
              variant="ghost"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages || loading}
            >
              Next
            </Button>
          </div>
        </div>

        <div className="flex justify-end mt-3">
          <Button type="button" variant="ghost" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );
}
