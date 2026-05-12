import React from 'react';

/**
 * StatCardSkeleton - Skeleton for stat/metric cards
 * Used: Dashboards, Reports pages
 */
export function StatCardSkeleton({ tone = 'slate' }: { tone?: string }) {
  const borderClass = {
    blue: 'border-blue-200/70',
    emerald: 'border-emerald-200/70',
    amber: 'border-amber-200/70',
    violet: 'border-violet-200/70',
    slate: 'border-slate-200/80',
  }[tone] || 'border-slate-200/80';

  return (
    <div className={`rounded-2xl border ${borderClass} bg-white p-4 shadow-sm`}>
      <div className="h-3 w-24 animate-pulse rounded bg-slate-200" />
      <div className="mt-2 h-8 w-16 animate-pulse rounded bg-slate-300" />
    </div>
  );
}

/**
 * WidgetSkeleton - Large card skeleton for dashboard widgets
 * Used: Dashboard cards, DTR Analytics, Task widgets
 */
export function WidgetSkeleton({ lines = 4 }: { lines?: number }) {
  return (
    <div className="space-y-3 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm">
      {/* Title */}
      <div className="h-5 w-40 animate-pulse rounded bg-slate-200" />

      {/* Content lines */}
      <div className="space-y-2 pt-2">
        {Array.from({ length: lines }).map((_, i) => (
          <div
            key={i}
            className={`h-3 animate-pulse rounded bg-slate-200 ${
              i === lines - 1 ? 'w-2/3' : 'w-full'
            }`}
          />
        ))}
      </div>
    </div>
  );
}

/**
 * TableHeaderSkeleton - Skeleton for table headers
 * Used: All table pages
 */
export function TableHeaderSkeleton({ columnCount = 6 }: { columnCount?: number }) {
  return (
    <div className="flex animate-pulse border-b border-slate-200 bg-slate-100/70">
      {Array.from({ length: columnCount }).map((_, i) => (
        <div key={i} className="flex-1 space-y-1 px-4 py-3">
          <div className="h-3 w-3/4 rounded bg-slate-300" />
        </div>
      ))}
    </div>
  );
}

/**
 * TableRowSkeleton - Skeleton for table rows
 * Used: DTR History, Tasks, Leave history tables
 */
export function TableRowSkeleton({ columnCount = 6, withCheckbox = false }: { columnCount?: number; withCheckbox?: boolean }) {
  return (
    <div className="flex items-center border-b border-slate-200 bg-white px-0 py-3 animate-pulse">
      {/* Checkbox */}
      {withCheckbox && (
        <div className="w-12 px-4">
          <div className="h-4 w-4 rounded bg-slate-200" />
        </div>
      )}

      {/* Cells */}
      {Array.from({ length: columnCount }).map((_, i) => (
        <div key={i} className="flex-1 space-y-1 px-4">
          <div className={`h-3 rounded bg-slate-200 ${i === columnCount - 1 ? 'w-1/2' : i === 0 ? 'w-2/3' : 'w-4/5'}`} />
        </div>
      ))}
    </div>
  );
}

/**
 * FormInputSkeleton - Skeleton for form inputs
 * Used: Leave request form, Profile form, Filter forms
 */
export function FormInputSkeleton({ label = true, height = 40 }: { label?: boolean; height?: number }) {
  return (
    <div className="space-y-1.5">
      {label && <div className="h-3 w-24 animate-pulse rounded bg-slate-200" />}
      <div
        className="animate-pulse rounded-xl border border-slate-200/80 bg-slate-100"
        style={{ height: `${height}px` }}
      />
    </div>
  );
}

/**
 * ProgressBarSkeleton - Skeleton for progress displays
 * Used: DTR Analytics, Profile page hours
 */
export function ProgressBarSkeleton() {
  return (
    <div className="space-y-2">
      <div className="flex justify-between">
        <div className="h-3 w-32 animate-pulse rounded bg-slate-200" />
        <div className="h-3 w-12 animate-pulse rounded bg-slate-200" />
      </div>
      <div className="h-2 w-full animate-pulse rounded-full bg-slate-200" />
    </div>
  );
}

/**
 * ClockCardSkeleton - Skeleton for clock/DTR card
 * Used: Dashboard, DTR page
 */
export function ClockCardSkeleton() {
  return (
    <div className="space-y-4 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
      {/* Title */}
      <div className="h-5 w-32 animate-pulse rounded bg-slate-200" />

      {/* Clock display */}
      <div className="flex justify-center">
        <div className="h-24 w-24 animate-pulse rounded-full bg-slate-200" />
      </div>

      {/* Time info */}
      <div className="space-y-2 text-center">
        <div className="h-3 w-40 animate-pulse rounded bg-slate-200 mx-auto" />
        <div className="h-3 w-32 animate-pulse rounded bg-slate-200 mx-auto" />
      </div>

      {/* Buttons */}
      <div className="flex gap-2 pt-2">
        <div className="h-10 flex-1 animate-pulse rounded-xl bg-slate-200" />
        <div className="h-10 flex-1 animate-pulse rounded-xl bg-slate-200" />
        <div className="h-10 flex-1 animate-pulse rounded-xl bg-slate-200" />
      </div>
    </div>
  );
}

/**
 * ActivityListItemSkeleton - Skeleton for activity/log items
 * Used: Activity logs, Leave history
 */
export function ActivityListItemSkeleton() {
  return (
    <div className="flex items-start gap-3 border-b border-slate-200 bg-white px-4 py-3 animate-pulse">
      {/* Avatar */}
      <div className="h-10 w-10 flex-shrink-0 rounded-full bg-slate-200" />

      {/* Content */}
      <div className="flex-1 space-y-2 min-w-0">
        <div className="h-3 w-2/3 rounded bg-slate-200" />
        <div className="h-3 w-1/2 rounded bg-slate-200" />
      </div>

      {/* Timestamp */}
      <div className="h-3 w-16 flex-shrink-0 rounded bg-slate-200" />
    </div>
  );
}

/**
 * CalendarSkeleton - Skeleton for calendar widget
 * Used: Dashboard calendar
 */
export function CalendarSkeleton() {
  return (
    <div className="space-y-3">
      {/* Month nav */}
      <div className="flex items-center justify-between">
        <div className="h-4 w-4 animate-pulse rounded bg-slate-200" />
        <div className="h-4 w-24 animate-pulse rounded bg-slate-200" />
        <div className="h-4 w-4 animate-pulse rounded bg-slate-200" />
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 gap-2">
        {Array.from({ length: 7 }).map((_, i) => (
          <div key={i} className="h-3 w-6 animate-pulse rounded bg-slate-200 mx-auto" />
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: 35 }).map((_, i) => (
          <div key={i} className="aspect-square animate-pulse rounded-full bg-slate-200" />
        ))}
      </div>
    </div>
  );
}

/**
 * PageLoadingSkeleton - Full page placeholder during initial load
 * Used: All pages as fallback
 */
export function PageLoadingSkeleton({ title = true }: { title?: boolean }) {
  return (
    <div className="space-y-6">
      {/* Header */}
      {title && (
        <div className="space-y-2">
          <div className="h-8 w-48 animate-pulse rounded bg-slate-200" />
          <div className="h-4 w-64 animate-pulse rounded bg-slate-200" />
        </div>
      )}

      {/* Content grid */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <StatCardSkeleton key={i} />
        ))}
      </div>

      {/* Large widget */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <WidgetSkeleton lines={5} />
        </div>
        <WidgetSkeleton lines={4} />
      </div>
    </div>
  );
}
