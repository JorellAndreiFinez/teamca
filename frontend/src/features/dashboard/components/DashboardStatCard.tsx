import type { ReactNode } from 'react';

type DashboardStatTone = 'blue' | 'green' | 'amber' | 'purple' | 'slate';

interface DashboardStatCardProps {
  label: string;
  value: string | number;
  icon?: ReactNode;
  hint?: string;
  tone?: DashboardStatTone;
}

const TONE_STYLES: Record<DashboardStatTone, string> = {
  blue: 'border-blue-100 bg-blue-50/70 text-blue-700',
  green: 'border-emerald-100 bg-emerald-50/70 text-emerald-700',
  amber: 'border-amber-100 bg-amber-50/70 text-amber-700',
  purple: 'border-violet-100 bg-violet-50/70 text-violet-700',
  slate: 'border-slate-200 bg-slate-50 text-slate-700',
};

export default function DashboardStatCard({
  label,
  value,
  icon,
  hint,
  tone = 'slate',
}: DashboardStatCardProps) {
  return (
    <article className="rounded-xl border bg-white p-4 shadow-sm transition-shadow hover:shadow-md">
      <div className="mb-3 flex items-start justify-between gap-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
        {icon ? (
          <div className={`flex h-9 w-9 items-center justify-center rounded-lg border ${TONE_STYLES[tone]}`}>
            {icon}
          </div>
        ) : null}
      </div>

      <p className="text-2xl font-bold leading-none text-slate-900">{value}</p>

      {hint ? <p className="mt-2 text-xs text-slate-500">{hint}</p> : null}
    </article>
  );
}
