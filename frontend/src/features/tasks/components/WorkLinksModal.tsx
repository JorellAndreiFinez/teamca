import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import Modal from '../../../components/ui/Modal';
import type { Task, TaskWorkLink } from '../../../types/task';

type WorkLinksModalProps = {
  open: boolean;
  task: Task | null;
  links: TaskWorkLink[];
  loading: boolean;
  canEdit: boolean;
  draft: { url: string; label: string };
  submitting: boolean;
  deletingId: string | null;
  copiedId: string | null;
  onClose: () => void;
  onCopy: (workLinkId: string, url: string) => void;
  onRequestDelete: (taskId: string, link: TaskWorkLink) => void;
  onDraftChange: (draft: { url: string; label: string }) => void;
  onSubmitLink: (taskId: string) => void;
};

export default function WorkLinksModal({
  open,
  task,
  links,
  loading,
  canEdit,
  draft,
  submitting,
  deletingId,
  copiedId,
  onClose,
  onCopy,
  onRequestDelete,
  onDraftChange,
  onSubmitLink,
}: WorkLinksModalProps) {
  return (
    <Modal open={open} onClose={onClose} title={`Work Links${task ? `: ${task.title}` : ''}`}>
      <div className="space-y-3">
        {loading ? (
          <p className="text-sm text-gray-500">Loading work links...</p>
        ) : links.length === 0 ? (
          <p className="text-sm text-gray-500">No work links attached yet.</p>
        ) : (
          <div className="space-y-2">
            {links.map((link) => (
              <div key={link.work_link_id} className="rounded-md border border-indigo-200 bg-white p-3">
                <a href={link.url} target="_blank" rel="noreferrer" className="break-all text-sm font-medium text-indigo-700 underline">
                  {link.label?.trim() || link.url}
                </a>
                <div className="mt-2 flex items-center gap-2">
                  <button
                    type="button"
                    className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-700"
                    title="Copy link"
                    onClick={() => onCopy(link.work_link_id, link.url)}
                  >
                    {copiedId === link.work_link_id ? 'Copied' : 'Copy'}
                  </button>
                  {task && canEdit && (
                    <Button
                      type="button"
                      size="sm"
                      variant="danger"
                      loading={deletingId === link.work_link_id}
                      onClick={() => onRequestDelete(String(task.task_id), link)}
                    >
                      Remove
                    </Button>
                  )}
                  <p className="text-[11px] text-indigo-400">{new Date(link.created_at).toLocaleString()}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {task && canEdit && (
          <div className="space-y-2 rounded-md border border-indigo-200 bg-indigo-50 p-3">
            <p className="text-xs font-semibold text-indigo-700">+ Add Link</p>
            <Input
              label="Work URL"
              value={draft.url}
              onChange={(e) => onDraftChange({ ...draft, url: e.target.value })}
              placeholder="https://drive.google.com/..."
            />
            <Input
              label="Label (optional)"
              value={draft.label}
              onChange={(e) => onDraftChange({ ...draft, label: e.target.value })}
              placeholder="Canva design, Demo video, etc."
            />
            <div className="flex justify-end">
              <Button
                type="button"
                size="sm"
                variant="primary"
                loading={submitting}
                onClick={() => onSubmitLink(String(task.task_id))}
              >
                + Attach Link
              </Button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
