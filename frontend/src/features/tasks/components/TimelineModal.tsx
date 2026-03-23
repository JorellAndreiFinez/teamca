import Modal from '../../../components/ui/Modal';
import type { Task, TaskStatusHistory } from '../../../types/task';

type TimelineModalProps = {
  open: boolean;
  task: Task | null;
  history: TaskStatusHistory[];
  loading: boolean;
  onClose: () => void;
};

export default function TimelineModal({ open, task, history, loading, onClose }: TimelineModalProps) {
  return (
    <Modal open={open} onClose={onClose} title={`Status Timeline${task ? `: ${task.title}` : ''}`}>
      <div className="space-y-2">
        {loading ? (
          <p className="text-sm text-gray-500">Loading status timeline...</p>
        ) : history.length === 0 ? (
          <p className="text-sm text-gray-500">No status changes yet.</p>
        ) : (
          history.map((item) => (
            <div key={item.history_id} className="rounded-md border border-slate-200 bg-white p-3">
              <p className="text-sm text-slate-700">
                {item.previous_status} &rarr; {item.new_status}
              </p>
              {item.update_notes && <p className="mt-1 text-xs text-slate-500">{item.update_notes}</p>}
              <p className="mt-1 text-[11px] text-slate-400">{new Date(item.timestamp).toLocaleString()}</p>
            </div>
          ))
        )}
      </div>
    </Modal>
  );
}
