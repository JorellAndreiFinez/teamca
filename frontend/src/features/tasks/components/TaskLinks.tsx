import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import type { TaskWorkLink } from '../../../types/task';

const LINK_ACTION_BUTTON_BASE = 'rounded-md border px-2 py-1 text-[11px] font-medium leading-none transition-colors';

type TaskLinksProps = {
  currentUserId: string;
  links: TaskWorkLink[];
  linkDraft: { url: string; label: string };
  submitting: boolean;
  deletingId: string | null;
  copiedId: string | null;
  canAdd: boolean;
  canDeleteAny: boolean;
  canDeleteOwn: boolean;
  onDraftChange: (draft: { url: string; label: string }) => void;
  onAdd: () => void;
  onDelete: (workLinkId: string) => void;
  onCopy: (workLinkId: string, url: string) => void;
};

export default function TaskLinks({
  currentUserId,
  links,
  linkDraft,
  submitting,
  deletingId,
  copiedId,
  canAdd,
  canDeleteAny,
  canDeleteOwn,
  onDraftChange,
  onAdd,
  onDelete,
  onCopy,
}: TaskLinksProps) {
  return (
    <section className="space-y-3 rounded-xl border border-slate-200 bg-white p-4">
      <h4 className="text-sm font-semibold text-slate-900">Links</h4>

      {canAdd ? (
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <Input
            label="URL"
            value={linkDraft.url}
            onChange={(event) => onDraftChange({ ...linkDraft, url: event.target.value })}
            placeholder="https://..."
          />
          <Input
            label="Label (optional)"
            value={linkDraft.label}
            onChange={(event) => onDraftChange({ ...linkDraft, label: event.target.value })}
            placeholder="Link Title"
          />
          <div className="sm:col-span-2">
            <Button type="button" size="sm" loading={submitting} onClick={onAdd}>
              Add link
            </Button>
          </div>
        </div>
      ) : null}

      <div className="space-y-2">
        {!links.length ? (
          <p className="text-sm text-slate-500">No links yet.</p>
        ) : (
          links.map((link) => (
            <div key={link.work_link_id} className="rounded-md border border-slate-200 p-3">
              <a className="text-sm text-blue-700 underline break-all" href={link.url} target="_blank" rel="noreferrer">
                {link.label?.trim() || link.url}
              </a>
              <div className="mt-2 flex items-center gap-2">
                <button
                  type="button"
                  className={`${LINK_ACTION_BUTTON_BASE} border-slate-300 text-slate-700 hover:bg-slate-50`}
                  onClick={() => onCopy(link.work_link_id, link.url)}
                >
                  {copiedId === link.work_link_id ? 'Copied' : 'Copy'}
                </button>
                {((canDeleteAny || (canDeleteOwn && link.submitted_by === currentUserId))) ? (
                  <button
                    type="button"
                    disabled={deletingId === link.work_link_id}
                    className={`${LINK_ACTION_BUTTON_BASE} border-red-300 text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60`}
                    onClick={() => onDelete(link.work_link_id)}
                  >
                    {deletingId === link.work_link_id ? 'Deleting...' : 'Delete'}
                  </button>
                ) : null}
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );
}
