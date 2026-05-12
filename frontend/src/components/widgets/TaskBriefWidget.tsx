import type { Task } from '../../types/task';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { ActivityListItemSkeleton } from '../ui/Skeleton';

type TaskBriefWidgetProps = {
  tasks: Task[];
  isLoading?: boolean;
};

export default function TaskBriefWidget({ tasks, isLoading = false }: TaskBriefWidgetProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Tasks To Do</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 4 }).map((_, index) => (
              <ActivityListItemSkeleton key={index} />
            ))}
          </div>
        ) : null}

        {!isLoading && tasks.length === 0 ? (
          <p className="text-sm text-slate-500">No tasks available yet.</p>
        ) : null}

        {!isLoading && tasks.length > 0 ? (
          <ul className="space-y-2">
            {tasks.slice(0, 5).map((task) => (
              <li key={task.task_id} className="rounded-md border border-slate-200 p-3">
                <p className="text-sm font-medium text-slate-900">{task.title}</p>
                <p className="text-xs text-slate-500">{task.status}</p>
              </li>
            ))}
          </ul>
        ) : null}
      </CardContent>
    </Card>
  );
}