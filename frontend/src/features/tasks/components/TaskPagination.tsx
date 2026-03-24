import Button from '../../../components/ui/Button';

type TaskPaginationProps = {
  page: number;
  totalPages: number;
  total: number;
  limit: number;
  onPageChange: (page: number) => void;
};

export default function TaskPagination({ page, totalPages, total, limit, onPageChange }: TaskPaginationProps) {
  const start = total === 0 ? 0 : (page - 1) * limit + 1;
  const end = Math.min(page * limit, total);

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3">
      <p className="text-xs text-slate-500">
        Showing {start}-{end} of {total}
      </p>
      <div className="flex items-center gap-2">
        <Button type="button" size="sm" variant="outline" disabled={page <= 1} onClick={() => onPageChange(page - 1)}>
          Previous
        </Button>
        <span className="text-xs text-slate-600">
          Page {page} / {totalPages}
        </span>
        <Button type="button" size="sm" variant="outline" disabled={page >= totalPages} onClick={() => onPageChange(page + 1)}>
          Next
        </Button>
      </div>
    </div>
  );
}
