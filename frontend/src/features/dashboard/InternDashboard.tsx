import { useAuthStore } from '../../store/authStore';
import Card from '../../components/ui/Card';
import CalendarWidget from './components/CalendarWidget';
import DTRAnalyticsWidget from './components/DTRAnalyticsWidget';
import TaskBriefWidget from './components/TaskBriefWidget';
import Button from '../../components/ui/Button';

export default function InternDashboard() {
  const user = useAuthStore((state) => state.user);

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {greeting()}, {user?.first_name ?? 'Intern'}! 👋
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {new Date().toLocaleDateString('en-US', {
              weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
            })}
          </p>
        </div>
        <div className="flex gap-3">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => window.location.href = '/dtr'}
          >
            View DTR
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => window.location.href = '/tasks'}
          >
            My Tasks
          </Button>
        </div>
      </div>

      {/* Clock In/Out Banner */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl p-5 mb-6 flex items-center justify-between text-white shadow-md">
        <div>
          <p className="text-sm font-medium opacity-90">Today's Attendance</p>
          <p className="text-lg font-bold mt-0.5">Not yet clocked in</p>
        </div>
        <div className="flex gap-3">
          <Button
            variant="secondary"
            size="sm"
            className="bg-white/20 border-white/30 text-white hover:bg-white/30"
            onClick={() => alert('Clock-in functionality will be connected to the backend.')}
          >
            Clock In
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="bg-white/10 border-white/20 text-white hover:bg-white/20"
            onClick={() => alert('Clock-out functionality will be connected to the backend.')}
          >
            Clock Out
          </Button>
        </div>
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar - takes 1 col */}
        <Card title="Attendance Calendar" className="lg:col-span-1">
          <CalendarWidget />
        </Card>

        {/* Right column: DTR + Tasks */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          <Card title="DTR Analytics" subtitle="Your internship hours progress">
            <DTRAnalyticsWidget />
          </Card>

          <Card title="Task Brief" subtitle="Your active assignments">
            <TaskBriefWidget />
          </Card>
        </div>
      </div>
    </div>
  );
}
