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
  blue: 'border-blue-200/70 bg-blue-50/80 text-blue-700',
  green: 'border-emerald-200/70 bg-emerald-50/80 text-emerald-700',
  amber: 'border-amber-200/70 bg-amber-50/80 text-amber-700',
  purple: 'border-indigo-200/70 bg-indigo-50/80 text-indigo-700',
  slate: 'border-slate-200/70 bg-slate-50/80 text-slate-700',
};

export default function DashboardStatCard({
  label,
  value,
  icon,
  hint,
  tone = 'slate',
}: DashboardStatCardProps) {
  return (
    <article className="group rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_12px_30px_-24px_rgba(15,23,42,0.55)] transition-all hover:-translate-y-0.5 hover:shadow-[0_18px_36px_-24px_rgba(15,23,42,0.6)]">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">{label}</p>
          <p className="mt-2 text-2xl font-semibold leading-none text-slate-950 tabular-nums">{value}</p>
        </div>
        {icon ? (
          <div className={`flex h-10 w-10 items-center justify-center rounded-xl border ${TONE_STYLES[tone]} shadow-sm`}>
            {icon}
          </div>
        ) : null}
      </div>

      {hint ? <p className="text-xs text-slate-500">{hint}</p> : null}
    </article>
  );
}
