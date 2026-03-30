import { useEffect, useMemo, useRef, useState } from 'react';
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
  const [openPanel, setOpenPanel] = useState<'filter' | 'sort' | null>(null);
  const rootRef = useRef<HTMLDivElement | null>(null);

  const selectClassName = 'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100';
  const labelClassName = 'text-xs font-semibold uppercase tracking-wide text-slate-500';

  const hasActiveFilters = useMemo(
    () => search.trim().length > 0 || status !== 'All' || priority !== 'All' || createdDate !== 'all',
    [search, status, priority, createdDate],
  );

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (!rootRef.current) {
        return;
      }

      if (!rootRef.current.contains(event.target as Node)) {
        setOpenPanel(null);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const clearAllFilters = () => {
    onSearchChange('');
    onStatusChange('All');
    onPriorityChange('All');
    onCreatedDateChange('all');
  };

  return (
    <div ref={rootRef} className="relative flex justify-end gap-2">
      <button
        type="button"
        onClick={() => setOpenPanel((current) => (current === 'filter' ? null : 'filter'))}
        className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition ${
          openPanel === 'filter' || hasActiveFilters
            ? 'border-blue-300 bg-blue-50 text-blue-700'
            : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
        }`}
      >
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 5h18M6 12h12M10 19h4" />
        </svg>
        Filter
      </button>

      <button
        type="button"
        onClick={() => setOpenPanel((current) => (current === 'sort' ? null : 'sort'))}
        className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition ${
          openPanel === 'sort'
            ? 'border-blue-300 bg-blue-50 text-blue-700'
            : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
        }`}
      >
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 7h16M7 12h10M10 17h4" />
        </svg>
        Sort
      </button>

      {openPanel === 'filter' ? (
        <div className="absolute right-0 top-full z-30 mt-2 w-[min(92vw,24rem)] rounded-xl border border-slate-200 bg-white p-4 shadow-xl">
          <div className="space-y-3">
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
          </div>

          <div className="mt-4 flex items-center justify-start border-t border-slate-200 pt-3">
            <button
              type="button"
              onClick={clearAllFilters}
              className="text-sm font-medium text-slate-600 hover:text-slate-900"
            >
              Clear all
            </button>
          </div>
        </div>
      ) : null}

      {openPanel === 'sort' ? (
        <div className="absolute right-0 top-full z-30 mt-2 w-[min(92vw,22rem)] rounded-xl border border-slate-200 bg-white p-4 shadow-xl">
          <div className="space-y-3">
            <label className="block space-y-1">
              <span className={labelClassName}>Sort by</span>
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
        </div>
      ) : null}
    </div>
  );
}
