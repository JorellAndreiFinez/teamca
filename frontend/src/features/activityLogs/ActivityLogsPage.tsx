import React, { useState, useEffect, useRef, useCallback } from "react";
import { activityLogService } from "../../services/activityLogService";
import { ActivityLog, ActivityLogsResponse } from "../../types/activityLog";
import { Button } from "../../components/ui/Button";
import { cn } from "../../lib/utils";

const HEADER_HEIGHT = 60; 
const TABLE_HEADER_HEIGHT = 48;
const ROW_HEIGHT = 50; 
const PADDING = 80; 
const MOBILE_ROW_HEIGHT = 60;

interface PaginationState {
  current: number;
  total: number;
  limit: number;
}

interface FilterState {
  startDate: string;
  endDate: string;
}

export const ActivityLogsPage: React.FC = () => {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [pagination, setPagination] = useState<PaginationState>({
    current: 1,
    total: 0,
    limit: 20,
  });
  const [filters, setFilters] = useState<FilterState>({
    startDate: "",
    endDate: "",
  });
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // calculate items per page based on available viewport height
  const calculateItemsPerPage = useCallback(() => {
    if (!containerRef.current) return 20;

    const availableHeight =
      window.innerHeight - HEADER_HEIGHT - TABLE_HEADER_HEIGHT - PADDING;
    const rowHeight = window.innerWidth < 768 ? MOBILE_ROW_HEIGHT : ROW_HEIGHT;
    const calculated = Math.max(5, Math.floor(availableHeight / rowHeight));
    return calculated;
  }, []);

  const fetchLogs = useCallback(
    async (page: number = 1) => {
      setLoading(true);
      try {
        const limit = calculateItemsPerPage();
        const skip = (page - 1) * limit;

        const response = await activityLogService.getLogs(
          limit,
          skip,
          filters.startDate || undefined,
          filters.endDate || undefined
        );

        setLogs(response.logs);
        setPagination({
          current: page,
          total: response.total,
          limit,
        });
      } catch (error) {
        console.error("Failed to fetch activity logs:", error);
      } finally {
        setLoading(false);
      }
    },
    [filters, calculateItemsPerPage]
  );

  // fetch logs on mount and changes
  useEffect(() => {
    fetchLogs(1);
  }, [fetchLogs]);

  // handle filter changes
  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  // handle pagination
  const handlePageChange = (page: number) => {
    fetchLogs(page);
  };

  // handle csv export
  const handleExport = async () => {
    setExporting(true);
    try {
      const blob = await activityLogService.exportToCSV(
        filters.startDate || undefined,
        filters.endDate || undefined
      );
      const filename = `activity-logs-${new Date().toISOString().split("T")[0]}.csv`;
      activityLogService.downloadCSV(blob, filename);
    } catch (error) {
      console.error("Failed to export logs:", error);
    } finally {
      setExporting(false);
    }
  };

  // calculate total pages
  const totalPages = Math.ceil(
    pagination.total / pagination.limit
  );

  // get action badge color
  const getActionColor = (action: string) => {
    switch (action) {
      case "create":
        return "bg-emerald-100 text-emerald-800";
      case "read":
        return "bg-blue-100 text-blue-800";
      case "update":
        return "bg-amber-100 text-amber-800";
      case "delete":
        return "bg-red-100 text-red-800";
      case "login":
        return "bg-violet-100 text-violet-800";
      case "logout":
        return "bg-orange-100 text-orange-800";
      default:
        return "bg-slate-100 text-slate-800";
    }
  };

  // get status badge color
  const getStatusColor = (status: string) => {
    return status === "success"
      ? "bg-emerald-100 text-emerald-700"
      : "bg-red-100 text-red-700";
  };

  return (
    <div ref={containerRef} className="flex flex-col h-full gap-4 p-4 md:p-6">
      {/* header with title and refresh button */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Activity Logs</h1>
        <Button
          type="button"
          variant="outline"
          size="sm"
          loading={loading}
          onClick={() => fetchLogs(pagination.current)}
          aria-label="Refresh Activity Logs"
          title="Refresh Activity Logs"
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M20 11a8 8 0 0 0-13.66-5.66M4 5v5h5" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 13a8 8 0 0 0 13.66 5.66M20 19v-5h-5" />
          </svg>
        </Button>
      </div>

      {/* simplified filter bar */}
      <div className="flex flex-col md:flex-row gap-2 items-end">
        <input
          type="datetime-local"
          name="startDate"
          value={filters.startDate}
          onChange={handleFilterChange}
          placeholder="start date"
          className="flex-1 px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-slate-500"
        />
        <input
          type="datetime-local"
          name="endDate"
          value={filters.endDate}
          onChange={handleFilterChange}
          placeholder="end date"
          className="flex-1 px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-slate-500"
        />
        <Button
          onClick={() => fetchLogs(1)}
          className="bg-slate-600 hover:bg-slate-700"
        >
          Apply Filters
        </Button>
        <Button
          onClick={handleExport}
          disabled={exporting || logs.length === 0}
          className="bg-emerald-600 hover:bg-emerald-700"
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2M16 10l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          {exporting ? "Exporting..." : "Export CSV"}
        </Button>
      </div>

      {/* table container */}
      <div className="flex-1 overflow-hidden flex flex-col bg-white rounded-lg border border-slate-200">
        {loading && logs.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-slate-500">Loading Activity Logs...</p>
          </div>
        ) : logs.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-slate-500">No Activity Logs Found</p>
          </div>
        ) : (
          <>
            {/* table header */}
            <div className="grid grid-cols-12 gap-3 px-4 py-3 bg-slate-50 border-b border-slate-200 font-medium text-sm text-slate-700 sticky top-0">
              <div className="col-span-2">Timestamp</div>
              <div className="col-span-2">User</div>
              <div className="col-span-1">Action</div>
              <div className="col-span-2">Resource</div>
              <div className="col-span-3">Description</div>
              <div className="col-span-1">Status</div>
            </div>

            {/* table body - scrollable */}
            <div className="overflow-y-auto flex-1">
              {logs.map((log) => (
                <div
                  key={log._id}
                  className="grid grid-cols-12 gap-3 px-4 py-3 border-b border-slate-100 text-sm hover:bg-slate-50 transition-colors"
                >
                  <div className="col-span-2 text-slate-600 truncate">
                    {new Date(log.timestamp).toLocaleDateString()}
                  </div>
                  <div className="col-span-2 text-slate-700 truncate font-medium">
                    {log.user_name}
                  </div>
                  <div className="col-span-1">
                    <span
                      className={cn(
                        "inline-block px-2 py-1 rounded text-xs font-medium",
                        getActionColor(log.action_type)
                      )}
                    >
                      {log.action_type}
                    </span>
                  </div>
                  <div className="col-span-2 text-slate-600 truncate capitalize">
                    {log.resource_type}
                  </div>
                  <div className="col-span-3 text-slate-600 truncate">
                    {log.description}
                  </div>
                  <div className="col-span-1">
                    <span
                      className={cn(
                        "inline-block px-2 py-1 rounded text-xs font-medium",
                        getStatusColor(log.status)
                      )}
                    >
                      {log.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* pagination controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-slate-600">
            Page {pagination.current} of {totalPages} ({pagination.total} total)
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => handlePageChange(pagination.current - 1)}
              disabled={pagination.current === 1 || loading}
              className="bg-slate-600 hover:bg-slate-700 disabled:opacity-50"
            >
              Previous
            </Button>
            <Button
              onClick={() => handlePageChange(pagination.current + 1)}
              disabled={pagination.current === totalPages || loading}
              className="bg-slate-600 hover:bg-slate-700 disabled:opacity-50"
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
