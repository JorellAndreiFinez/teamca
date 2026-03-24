import Input from '../../../components/ui/Input';
import type { TaskPriority, TaskStatus } from '../../../types/task';

type CreatedDateFilter = 'all' | 'today' | '7d' | '30d';
type SortBy = 'created_desc' | 'created_asc' | 'priority_desc' | 'priority_asc' | 'deadline_asc' | 'deadline_desc' | 'title_asc';

type TaskFiltersProps = {
  search: string;
  status: TaskStatus | 'All';
  priority: TaskPriority | 'All';
  createdDate: CreatedDateFilter;
  sortBy: SortBy;
  limit: number;
  onSearchChange: (value: string) => void;
  onStatusChange: (value: TaskStatus | 'All') => void;
  onPriorityChange: (value: TaskPriority | 'All') => void;
  onCreatedDateChange: (value: CreatedDateFilter) => void;
  onSortByChange: (value: SortBy) => void;
  onLimitChange: (value: number) => void;
};

export default function TaskFilters({
  search,
  status,
  priority,
  createdDate,
  sortBy,
  limit,
  onSearchChange,
  onStatusChange,
  onPriorityChange,
  onCreatedDateChange,
  onSortByChange,
  onLimitChange,
}: TaskFiltersProps) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-[2fr,1fr,1fr,1fr,1fr,1fr] lg:items-end">
        <Input
          label="Search"
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Search by title or assignee"
        />

        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium text-slate-700">Status</span>
          <select
            className="rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900"
            value={status}
            onChange={(event) => onStatusChange(event.target.value as TaskStatus | 'All')}
          >
            <option value="All">All</option>
            <option value="Not Started">Not Started</option>
            <option value="In Progress">In Progress</option>
            <option value="Under Review">Under Review</option>
            <option value="Completed">Completed</option>
          </select>
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium text-slate-700">Priority</span>
          <select
            className="rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900"
            value={priority}
            onChange={(event) => onPriorityChange(event.target.value as TaskPriority | 'All')}
          >
            <option value="All">All</option>
            <option value="Low">Low</option>
            <option value="Medium">Medium</option>
            <option value="High">High</option>
          </select>
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium text-slate-700">Date Created</span>
          <select
            className="rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900"
            value={createdDate}
            onChange={(event) => onCreatedDateChange(event.target.value as CreatedDateFilter)}
          >
            <option value="all">All</option>
            <option value="today">Today</option>
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
          </select>
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium text-slate-700">Sort by</span>
          <select
            className="rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900"
            value={sortBy}
            onChange={(event) => onSortByChange(event.target.value as SortBy)}
          >
            <option value="created_desc">Created (Newest)</option>
            <option value="created_asc">Created (Oldest)</option>
            <option value="priority_desc">Priority (High to Low)</option>
            <option value="priority_asc">Priority (Low to High)</option>
            <option value="deadline_asc">Deadline (Soonest)</option>
            <option value="deadline_desc">Deadline (Latest)</option>
            <option value="title_asc">Title (A-Z)</option>
          </select>
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium text-slate-700">Rows</span>
          <select
            className="rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900"
            value={limit}
            onChange={(event) => onLimitChange(Number(event.target.value))}
          >
            <option value={5}>5</option>
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
          </select>
        </label>
      </div>
    </div>
  );
}
