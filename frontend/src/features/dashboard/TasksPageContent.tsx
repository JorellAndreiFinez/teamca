import { useEffect, useMemo, useState } from 'react';
import { taskService } from '../../services/taskService';
import { useAuthStore } from '../../store/authStore';
import type { Task } from '../../types/task';
import StatCard from '../../components/widgets/StatCard';
import TaskBriefWidget from '../../components/widgets/TaskBriefWidget';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { ActivityListItemSkeleton } from '../../components/ui/Skeleton';

export default function TasksPageContent() {
  const { user, canManageOwnDepartment, canViewAllDepartments } = useAuthStore((state) => ({
    user: state.user,
    canManageOwnDepartment: state.canManageOwnDepartment,
    canViewAllDepartments: state.canViewAllDepartments,
  }));

  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadTasks = async () => {
      setIsLoading(true);
      try {
        const data = await taskService.getTasks();
        setTasks(data);
      } catch {
        setTasks([]);
      } finally {
        setIsLoading(false);
      }
    };

    void loadTasks();
  }, []);

  const visibleTasks = useMemo(() => {
    if (!user) {
      return [];
    }

    if (canViewAllDepartments() || canManageOwnDepartment()) {
      return tasks;
    }

    return tasks.filter((task) => task.created_by === user.user_id || task.status !== 'Completed');
  }, [canManageOwnDepartment, canViewAllDepartments, tasks, user]);

  const openCount = visibleTasks.filter((task) => task.status !== 'Completed').length;
  const completedCount = visibleTasks.filter((task) => task.status === 'Completed').length;

  return (
    <div className="space-y-4 p-4">
      <section>
        <h1 className="text-2xl font-semibold text-slate-900">Tasks</h1>
        <p className="text-sm text-slate-500">Track assigned tasks and progress</p>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total Tasks" value={visibleTasks.length} />
        <StatCard label="Open" value={openCount} />
        <StatCard label="Completed" value={completedCount} />
        <StatCard
          label="Scope"
          value={canViewAllDepartments() ? 'Company' : canManageOwnDepartment() ? 'Department' : 'Personal'}
        />
      </section>

      <TaskBriefWidget tasks={visibleTasks} isLoading={isLoading} />

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Task Status Snapshot</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 4 }).map((_, index) => (
                <ActivityListItemSkeleton key={index} />
              ))}
            </div>
          ) : (
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
              {['Not Started', 'In Progress', 'Under Review', 'Completed'].map((status) => {
                const count = visibleTasks.filter((task) => task.status === status).length;
                return (
                  <div key={status} className="rounded-md border border-slate-200 p-3">
                    <p className="text-xs text-slate-500">{status}</p>
                    <p className="text-lg font-semibold text-slate-900">{count}</p>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}