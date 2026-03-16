import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';

const WEEK_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export default function CalendarWidget() {
  const { monthLabel, days } = useMemo(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    const firstWeekday = (firstDay.getDay() + 6) % 7;
    const totalDays = lastDay.getDate();

    const values: Array<number | null> = [];
    for (let index = 0; index < firstWeekday; index += 1) {
      values.push(null);
    }

    for (let day = 1; day <= totalDays; day += 1) {
      values.push(day);
    }

    return {
      monthLabel: firstDay.toLocaleString(undefined, { month: 'long', year: 'numeric' }),
      days: values,
    };
  }, []);

  const today = new Date().getDate();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{monthLabel}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-7 gap-1 text-center text-xs text-slate-500">
          {WEEK_DAYS.map((day) => (
            <span key={day}>{day}</span>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1 text-center text-sm">
          {days.map((day, index) => {
            if (!day) {
              return <span key={`empty-${index}`} className="h-8" />;
            }

            const isToday = day === today;
            return (
              <span
                key={day}
                className={`flex h-8 items-center justify-center rounded-md ${
                  isToday ? 'bg-slate-900 text-white' : 'text-slate-700'
                }`}
              >
                {day}
              </span>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}