import { useState, useEffect } from 'react';
import { TrendingUp, CheckCircle, AlertCircle, Calendar, Download, FileText } from 'lucide-react';
import jsPDF from 'jspdf';
import * as XLSX from 'xlsx';
import { taskService } from '../../services/taskService';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import type { TaskListItem } from '../../types/task';

interface TaskStats {
  totalTasks: number;
  completedTasks: number;
  pendingTasks: number;
  inProgressTasks: number;
  underReviewTasks: number;
  overdueTasks: number;
  completionRate: number;
  averageCompletionTime: number; // in days
  tasksByStatus: Record<string, number>;
  tasksByPriority: Record<string, number>;
  mostAssignedUsers: Array<{ name: string; taskCount: number }>;
}

export default function TaskAnalyticsPage() {
  const [stats, setStats] = useState<TaskStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'all'>('month');

  useEffect(() => {
    fetchTaskAnalytics();
  }, [timeRange]);

  const fetchTaskAnalytics = async () => {
    try {
      setLoading(true);
      // Fetch all tasks for analysis
      const response = await taskService.getTaskList({ limit: 1000, page: 1 });
      const allTasks = response.items || [];

      // Calculate statistics
      const now = new Date();
      let filterDate = new Date();

      if (timeRange === 'week') {
        filterDate.setDate(now.getDate() - 7);
      } else if (timeRange === 'month') {
        filterDate.setMonth(now.getMonth() - 1);
      }

      const filteredTasks = allTasks.filter((t) => {
        if (timeRange === 'all') return true;
        const createdDate = new Date(t.created_at || now);
        return createdDate >= filterDate;
      });

      const completed = filteredTasks.filter((t) => t.status === 'Completed').length;
      const overdue = filteredTasks.filter((t) => {
        if (t.status === 'Completed') return false;
        if (!t.deadline) return false;
        return new Date(t.deadline) < now;
      }).length;

      const statusCounts: Record<string, number> = {};
      const priorityCounts: Record<string, number> = {};
      const userCounts: Record<string, number> = {};

      filteredTasks.forEach((t) => {
        statusCounts[t.status] = (statusCounts[t.status] || 0) + 1;
        priorityCounts[t.priority] = (priorityCounts[t.priority] || 0) + 1;

        if (t.assigned_users && Array.isArray(t.assigned_users)) {
          t.assigned_users.forEach((user) => {
            const userName = `${user.first_name || ''} ${user.last_name || ''}`.trim() || 'Unknown';
            userCounts[userName] = (userCounts[userName] || 0) + 1;
          });
        }
      });

      const calculatedStats: TaskStats = {
        totalTasks: filteredTasks.length,
        completedTasks: completed,
        pendingTasks: statusCounts['Pending'] || 0,
        inProgressTasks: statusCounts['In Progress'] || 0,
        underReviewTasks: statusCounts['Under Review'] || 0,
        overdueTasks: overdue,
        completionRate:
          filteredTasks.length > 0 ? Math.round((completed / filteredTasks.length) * 100) : 0,
        averageCompletionTime: 0, // Would need to calculate from status history
        tasksByStatus: statusCounts,
        tasksByPriority: priorityCounts,
        mostAssignedUsers: Object.entries(userCounts)
          .map(([name, count]) => ({ name, taskCount: count }))
          .sort((a, b) => b.taskCount - a.taskCount)
          .slice(0, 5),
      };

      setStats(calculatedStats);
    } catch (error) {
      // Silently handle errors - display in UI instead
    } finally {
      setLoading(false);
    }
  };

  const exportToPDF = () => {
    if (!stats) return;

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    let yPosition = 15;

    // Title
    doc.setFontSize(16);
    doc.text('Task Analytics Report', pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 10;

    // Report date range
    doc.setFontSize(10);
    const rangeText = timeRange === 'week' ? 'This Week' : timeRange === 'month' ? 'This Month' : 'All Time';
    doc.text(`Report Period: ${rangeText}`, 15, yPosition);
    yPosition += 8;

    // Main Stats
    doc.setFontSize(12);
    doc.text('Key Metrics:', 15, yPosition);
    yPosition += 7;

    doc.setFontSize(10);
    const mainStats = [
      `Total Tasks: ${stats.totalTasks}`,
      `Completed Tasks: ${stats.completedTasks}`,
      `Completion Rate: ${stats.completionRate}%`,
      `In Progress: ${stats.inProgressTasks}`,
      `Pending: ${stats.pendingTasks}`,
      `Under Review: ${stats.underReviewTasks}`,
      `Overdue: ${stats.overdueTasks}`,
    ];

    mainStats.forEach((stat) => {
      doc.text(stat, 15, yPosition);
      yPosition += 6;
    });

    yPosition += 5;

    // Status Distribution
    if (Object.keys(stats.tasksByStatus).length > 0) {
      doc.setFontSize(12);
      doc.text('Status Distribution:', 15, yPosition);
      yPosition += 7;

      doc.setFontSize(10);
      Object.entries(stats.tasksByStatus).forEach(([status, count]) => {
        doc.text(`${status}: ${count}`, 15, yPosition);
        yPosition += 6;
      });

      yPosition += 3;
    }

    // Priority Distribution
    if (Object.keys(stats.tasksByPriority).length > 0) {
      doc.setFontSize(12);
      doc.text('Priority Distribution:', 15, yPosition);
      yPosition += 7;

      doc.setFontSize(10);
      Object.entries(stats.tasksByPriority).forEach(([priority, count]) => {
        doc.text(`${priority}: ${count}`, 15, yPosition);
        yPosition += 6;
      });
    }

    // Save PDF
    doc.save(`Task_Analytics_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const exportToExcel = () => {
    if (!stats) return;

    const workbook = XLSX.utils.book_new();

    // Sheet 1: Summary Stats
    const summaryData = [
      ['Task Analytics Report', ''],
      ['Report Period', timeRange === 'week' ? 'This Week' : timeRange === 'month' ? 'This Month' : 'All Time'],
      ['Generated', new Date().toISOString().split('T')[0]],
      [''],
      ['Key Metrics', 'Value'],
      ['Total Tasks', stats.totalTasks],
      ['Completed Tasks', stats.completedTasks],
      ['Completion Rate %', stats.completionRate],
      ['In Progress', stats.inProgressTasks],
      ['Pending', stats.pendingTasks],
      ['Under Review', stats.underReviewTasks],
      ['Overdue', stats.overdueTasks],
    ];

    const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
    summarySheet['!cols'] = [{ wch: 25 }, { wch: 15 }];
    XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary');

    // Sheet 2: Status Distribution
    if (Object.keys(stats.tasksByStatus).length > 0) {
      const statusData = [
        ['Status', 'Count'],
        ...Object.entries(stats.tasksByStatus).map(([status, count]) => [status, count]),
      ];
      const statusSheet = XLSX.utils.aoa_to_sheet(statusData);
      statusSheet['!cols'] = [{ wch: 20 }, { wch: 10 }];
      XLSX.utils.book_append_sheet(workbook, statusSheet, 'Status');
    }

    // Sheet 3: Priority Distribution
    if (Object.keys(stats.tasksByPriority).length > 0) {
      const priorityData = [
        ['Priority', 'Count'],
        ...Object.entries(stats.tasksByPriority).map(([priority, count]) => [priority, count]),
      ];
      const prioritySheet = XLSX.utils.aoa_to_sheet(priorityData);
      prioritySheet['!cols'] = [{ wch: 20 }, { wch: 10 }];
      XLSX.utils.book_append_sheet(workbook, prioritySheet, 'Priority');
    }

    // Sheet 4: Top Assignees
    if (stats.mostAssignedUsers.length > 0) {
      const assigneeData = [
        ['User', 'Task Count'],
        ...stats.mostAssignedUsers.map((user) => [user.name, user.taskCount]),
      ];
      const assigneeSheet = XLSX.utils.aoa_to_sheet(assigneeData);
      assigneeSheet['!cols'] = [{ wch: 30 }, { wch: 12 }];
      XLSX.utils.book_append_sheet(workbook, assigneeSheet, 'Assignees');
    }

    // Save Excel file
    XLSX.writeFile(workbook, `Task_Analytics_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Task Analytics</h1>
        <p className="text-sm text-slate-600 mt-1">Task completion metrics and insights</p>
      </div>

      {/* Time Range Filter */}
      <div className="flex gap-2 flex-wrap items-center justify-between">
        <div className="flex gap-2">
          <Button
            variant={timeRange === 'week' ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => setTimeRange('week')}
          >
            This Week
          </Button>
          <Button
            variant={timeRange === 'month' ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => setTimeRange('month')}
          >
            This Month
          </Button>
          <Button
            variant={timeRange === 'all' ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => setTimeRange('all')}
          >
            All Time
          </Button>
        </div>

        {/* Export Buttons */}
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" onClick={exportToPDF} className="flex items-center gap-2">
            <Download size={16} />
            Export PDF
          </Button>
          <Button variant="secondary" size="sm" onClick={exportToExcel} className="flex items-center gap-2">
            <FileText size={16} />
            Export Excel
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-32 bg-slate-100 rounded-lg animate-pulse" />
          ))}
        </div>
      ) : stats ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <Card>
              <div className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-slate-600 font-medium">Total Tasks</p>
                    <p className="text-2xl font-bold text-slate-900 mt-1">{stats.totalTasks}</p>
                  </div>
                  <Calendar className="text-blue-500" size={32} />
                </div>
              </div>
            </Card>

            <Card>
              <div className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-slate-600 font-medium">Completed</p>
                    <p className="text-2xl font-bold text-green-600 mt-1">{stats.completedTasks}</p>
                  </div>
                  <CheckCircle className="text-green-500" size={32} />
                </div>
              </div>
            </Card>

            <Card>
              <div className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-slate-600 font-medium">Completion %</p>
                    <p className="text-2xl font-bold text-slate-900 mt-1">{stats.completionRate}%</p>
                  </div>
                  <TrendingUp className="text-purple-500" size={32} />
                </div>
              </div>
            </Card>

            <Card>
              <div className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-slate-600 font-medium">In Progress</p>
                    <p className="text-2xl font-bold text-blue-600 mt-1">{stats.inProgressTasks}</p>
                  </div>
                  <TrendingUp className="text-blue-500" size={32} />
                </div>
              </div>
            </Card>

            <Card>
              <div className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-slate-600 font-medium">Overdue</p>
                    <p className="text-2xl font-bold text-red-600 mt-1">{stats.overdueTasks}</p>
                  </div>
                  <AlertCircle className="text-red-500" size={32} />
                </div>
              </div>
            </Card>
          </div>

          {/* Detailed Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Status Distribution */}
            <Card>
              <div className="p-4">
                <p className="text-sm font-medium text-slate-700 mb-3">Status Distribution</p>
                <div className="space-y-2">
                  {Object.entries(stats.tasksByStatus).map(([status, count]) => (
                    <div key={status} className="flex justify-between items-center text-sm">
                      <span className="text-slate-600">{status}</span>
                      <span className="font-semibold bg-slate-100 px-2 py-1 rounded text-slate-900">
                        {count}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </Card>

            {/* Priority Distribution */}
            <Card>
              <div className="p-4">
                <p className="text-sm font-medium text-slate-700 mb-3">Priority Distribution</p>
                <div className="space-y-2">
                  {Object.entries(stats.tasksByPriority).map(([priority, count]) => (
                    <div key={priority} className="flex justify-between items-center text-sm">
                      <span className="text-slate-600">{priority}</span>
                      <span className="font-semibold bg-slate-100 px-2 py-1 rounded text-slate-900">
                        {count}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </Card>

            {/* Top Assignees */}
            <Card>
              <div className="p-4">
                <p className="text-sm font-medium text-slate-700 mb-3">Most Assigned Users</p>
                <div className="space-y-2">
                  {stats.mostAssignedUsers.length > 0 ? (
                    stats.mostAssignedUsers.map((user, i) => (
                      <div key={i} className="flex justify-between items-center text-sm">
                        <span className="text-slate-600 truncate">{user.name}</span>
                        <span className="font-semibold bg-blue-100 text-blue-700 px-2 py-1 rounded">
                          {user.taskCount}
                        </span>
                      </div>
                    ))
                  ) : (
                    <p className="text-slate-500 text-xs">No data available</p>
                  )}
                </div>
              </div>
            </Card>
          </div>

          {/* Key Metrics */}
          <Card>
            <div className="p-4">
              <p className="text-sm font-medium text-slate-700 mb-3">Key Metrics Summary</p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-slate-600 mb-1">Pending Tasks</p>
                  <p className="text-2xl font-bold text-yellow-600">{stats.pendingTasks}</p>
                </div>
                <div>
                  <p className="text-slate-600 mb-1">Under Review</p>
                  <p className="text-2xl font-bold text-amber-600">{stats.underReviewTasks}</p>
                </div>
                <div>
                  <p className="text-slate-600 mb-1">Completion Rate</p>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-green-500"
                        style={{ width: `${stats.completionRate}%` }}
                      />
                    </div>
                    <span className="font-bold text-green-600">{stats.completionRate}%</span>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </>
      ) : null}
    </div>
  );
}
