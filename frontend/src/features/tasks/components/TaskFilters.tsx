import { useMemo } from 'react';
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
  deleteMode: boolean;
  selectedDeleteCount: number;
  onDeleteModeClick: () => void;
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
  deleteMode,
  selectedDeleteCount,
  onDeleteModeClick,
}: TaskFiltersProps) {
  const selectClassName = 'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100';
  const labelClassName = 'text-xs font-semibold uppercase tracking-wide text-slate-500';

  const hasActiveFilters = useMemo(
    () => search.trim().length > 0 || status !== 'All' || priority !== 'All' || createdDate !== 'all',
    [search, status, priority, createdDate],
  );

  const clearAllFilters = () => {
    onSearchChange('');
    onStatusChange('All');
    onPriorityChange('All');
    onCreatedDateChange('all');
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-[minmax(220px,1.4fr)_repeat(4,minmax(140px,1fr))_minmax(140px,1fr)]">
        <label className="block space-y-1">
          <span className={labelClassName}>Search</span>
          <input
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Search by title or assignee"
            className={selectClassName}
          />
        </label>

        <label className="block space-y-1">
          <span className={labelClassName}>Status</span>
          <select
            className={selectClassName}
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

        <label className="block space-y-1">
          <span className={labelClassName}>Priority</span>
          <select
            className={selectClassName}
            value={priority}
            onChange={(event) => onPriorityChange(event.target.value as TaskPriority | 'All')}
          >
            <option value="All">All</option>
            <option value="Low">Low</option>
            <option value="Medium">Medium</option>
            <option value="High">High</option>
          </select>
        </label>

        <label className="block space-y-1">
          <span className={labelClassName}>Date Created</span>
          <select
            className={selectClassName}
            value={createdDate}
            onChange={(event) => onCreatedDateChange(event.target.value as CreatedDateFilter)}
          >
            <option value="all">All</option>
            <option value="today">Today</option>
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
          </select>
        </label>

        <label className="block space-y-1">
          <span className={labelClassName}>Sort</span>
          <select
            className={selectClassName}
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

        <label className="block space-y-1">
          <span className={labelClassName}>Rows</span>
          <select
            className={selectClassName}
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

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-slate-200 pt-3">
        <div className="text-xs text-slate-500">
          {hasActiveFilters ? 'Filters applied' : 'No filters applied'}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={clearAllFilters}
            disabled={!hasActiveFilters}
            className="text-sm font-medium text-slate-600 transition hover:text-slate-900 disabled:cursor-not-allowed disabled:text-slate-300"
          >
            Clear filters
          </button>
          <button
            type="button"
            onClick={onDeleteModeClick}
            className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition ${
              deleteMode
                ? 'border-red-300 bg-red-50 text-red-700 hover:bg-red-100'
                : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
            }`}
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 7h12M9 7V5h6v2m-8 0l1 12h6l1-12" />
            </svg>
            {deleteMode ? (selectedDeleteCount > 0 ? `Delete (${selectedDeleteCount})` : 'Cancel') : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  );
}
