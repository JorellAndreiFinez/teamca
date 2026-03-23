import React, { useState } from 'react';
import { useAuthStore } from '../../store/authStore';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import CalendarWidget from '../dashboard/components/CalendarWidget';
import DTRAnalyticsWidget from '../dashboard/components/DTRAnalyticsWidget';

export default function DTRPage() {
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const [clockedIn, setClockedIn] = useState(false);
  const [clockInTime, setClockInTime] = useState<Date | null>(null);
  const [mounted, setMounted] = useState(false);
  React.useEffect(() => { setMounted(true); }, []);

  // Wait for client mount so Zustand can hydrate from localStorage
  if (!mounted) return null;

  if (!isAuthenticated) {
    window.location.replace('/login');
    return null;
  }

  const handleClockIn = () => {
    const now = new Date();
    setClockInTime(now);
    setClockedIn(true);
  };

  const handleClockOut = () => {
    if (!clockedIn) return;
    setClockedIn(false);
    setClockInTime(null);
  };

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Daily Time Record</h1>
        <p className="text-sm text-gray-500 mt-1">Track your daily attendance and rendered hours</p>
      </div>

      {/* Clock In/Out Card */}
      <Card className="mb-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-gray-700">
              {new Date().toLocaleDateString('en-US', {
                weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
              })}
            </p>
            <p className="text-2xl font-bold text-gray-900 mt-1">
              {new Date().toLocaleTimeString()}
            </p>
            {clockedIn && clockInTime && (
              <p className="text-sm text-green-600 mt-1">
                Clocked in since {clockInTime.toLocaleTimeString()}
              </p>
            )}
          </div>
          <div className="flex items-center gap-3">
            <div className={`px-3 py-1.5 rounded-full text-sm font-medium ${
              clockedIn ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
            }`}>
              {clockedIn ? '● Active' : '○ Not clocked in'}
            </div>
            {!clockedIn ? (
              <Button onClick={handleClockIn} variant="primary">Clock In</Button>
            ) : (
              <Button onClick={handleClockOut} variant="danger">Clock Out</Button>
            )}
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card title="Attendance Calendar" className="lg:col-span-1">
          <CalendarWidget />
        </Card>

        <div className="lg:col-span-2 space-y-6">
          <Card title="Hours Summary" subtitle="Your internship hours progress">
            <DTRAnalyticsWidget />
          </Card>

          <Card title="Recent DTR Entries" subtitle="Last 7 days">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left py-2 text-gray-500 font-medium">Date</th>
                    <th className="text-left py-2 text-gray-500 font-medium">Clock In</th>
                    <th className="text-left py-2 text-gray-500 font-medium">Clock Out</th>
                    <th className="text-left py-2 text-gray-500 font-medium">Hours</th>
                    <th className="text-left py-2 text-gray-500 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { date: 'Mon, Mar 10', cin: '8:01 AM', cout: '5:02 PM', hours: '9.0h', status: 'Present' },
                    { date: 'Tue, Mar 11', cin: '8:15 AM', cout: '5:00 PM', hours: '8.75h', status: 'Present' },
                    { date: 'Wed, Mar 12', cin: '—', cout: '—', hours: '0h', status: 'Absent' },
                    { date: 'Thu, Mar 13', cin: '8:00 AM', cout: '5:01 PM', hours: '9.0h', status: 'Present' },
                    { date: 'Fri, Mar 14', cin: '8:05 AM', cout: '5:00 PM', hours: '8.9h', status: 'Present' },
                  ].map((row) => (
                    <tr key={row.date} className="border-b border-gray-50 hover:bg-gray-50">
                      <td className="py-2.5 text-gray-700">{row.date}</td>
                      <td className="py-2.5 text-gray-600">{row.cin}</td>
                      <td className="py-2.5 text-gray-600">{row.cout}</td>
                      <td className="py-2.5 font-medium text-gray-800">{row.hours}</td>
                      <td className="py-2.5">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          row.status === 'Present'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-red-100 text-red-700'
                        }`}>
                          {row.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
