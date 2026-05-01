import { useState, useEffect } from 'react';
import { Calendar, TrendingUp, AlertCircle, Clock, Download, FileText } from 'lucide-react';
import jsPDF from 'jspdf';
import * as XLSX from 'xlsx';
import { dtrService } from '../../services/dtrService';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Card from '../../components/ui/Card';

interface DTRStats {
  totalWorkingDays: number;
  presentDays: number;
  absentDays: number;
  leaveDays: number;
  totalHoursWorked: number;
  overtimeHours: number;
  undertimeHours: number;
  averageDailyHours: number;
  lateArrivals: number;
  earlyDepartures: number;
}

interface DateRange {
  startDate: string;
  endDate: string;
}

export default function DTRReportsPage() {
  const [stats, setStats] = useState<DTRStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<DateRange>({
    startDate: new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
  });

  useEffect(() => {
    fetchDTRStats();
  }, [dateRange]);

  const fetchDTRStats = async () => {
    try {
      setLoading(true);
      // This will fetch DTR data and calculate stats
      const records = await dtrService.getDTRRecords();
      
      // Filter by date range and calculate stats
      const filteredRecords = records.filter((r) => {
        const recordDate = new Date(r.date).toISOString().split('T')[0];
        return recordDate >= dateRange.startDate && recordDate <= dateRange.endDate;
      });

      // Calculate statistics
      const calculatedStats: DTRStats = {
        totalWorkingDays: filteredRecords.length,
        presentDays: filteredRecords.filter((r) => r.attendanceStatus === 'present').length,
        absentDays: filteredRecords.filter((r) => r.attendanceStatus === 'absent').length,
        leaveDays: filteredRecords.filter((r) => r.status === 'pending' || r.status === 'approved').length,
        totalHoursWorked: filteredRecords.reduce((sum, r) => sum + (r.totalHours || 0), 0),
        overtimeHours: filteredRecords.reduce((sum, r) => {
          const overtime = (r.totalHours || 0) - 8;
          return sum + (overtime > 0 ? overtime : 0);
        }, 0),
        undertimeHours: Math.abs(
          filteredRecords.reduce((sum, r) => {
            const undertime = (r.totalHours || 0) - 8;
            return sum + (undertime < 0 ? undertime : 0);
          }, 0)
        ),
        averageDailyHours: filteredRecords.length > 0
          ? filteredRecords.reduce((sum, r) => sum + (r.totalHours || 0), 0) / filteredRecords.length
          : 0,
        lateArrivals: filteredRecords.filter((r) => r.attendanceStatus === 'late' || r.attendanceStatus === 'very_late').length,
        earlyDepartures: 0, // Would need to calculate from clock times
      };

      setStats(calculatedStats);
    } catch (error) {
      // Silently handle errors - display in UI instead
    } finally {
      setLoading(false);
    }
  };

  const handleDateRangeChange = (start: string, end: string) => {
    setDateRange({ startDate: start, endDate: end });
  };

  const handleSetThisMonth = () => {
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
    handleDateRangeChange(firstDay, lastDay);
  };

  const handleSetLastMonth = () => {
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().split('T')[0];
    const lastDay = new Date(now.getFullYear(), now.getMonth(), 0).toISOString().split('T')[0];
    handleDateRangeChange(firstDay, lastDay);
  };

  const exportToPDF = () => {
    if (!stats) return;

    const doc = new jsPDF();
    const pageHeight = doc.internal.pageSize.height;
    const pageWidth = doc.internal.pageSize.width;
    let yPosition = 15;

    // Title
    doc.setFontSize(16);
    doc.text('DTR Report & Analytics', pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 10;

    // Date Range
    doc.setFontSize(10);
    doc.text(`Report Period: ${dateRange.startDate} to ${dateRange.endDate}`, 15, yPosition);
    yPosition += 8;

    // Main Stats
    doc.setFontSize(12);
    doc.text('Key Metrics:', 15, yPosition);
    yPosition += 7;

    doc.setFontSize(10);
    const mainStats = [
      `Working Days: ${stats.totalWorkingDays}`,
      `Total Hours Worked: ${stats.totalHoursWorked.toFixed(1)}h`,
      `Average Daily Hours: ${stats.averageDailyHours.toFixed(1)}h`,
      `Late Arrivals: ${stats.lateArrivals}`,
    ];

    mainStats.forEach((stat) => {
      doc.text(stat, 15, yPosition);
      yPosition += 6;
    });

    yPosition += 3;

    // Attendance Breakdown
    doc.setFontSize(12);
    doc.text('Attendance Breakdown:', 15, yPosition);
    yPosition += 7;

    doc.setFontSize(10);
    const attendanceStats = [
      `Present Days: ${stats.presentDays}`,
      `Absent Days: ${stats.absentDays}`,
      `Leave Days: ${stats.leaveDays}`,
      `Present Rate: ${stats.totalWorkingDays > 0 ? ((stats.presentDays / stats.totalWorkingDays) * 100).toFixed(1) : 0}%`,
    ];

    attendanceStats.forEach((stat) => {
      doc.text(stat, 15, yPosition);
      yPosition += 6;
    });

    yPosition += 3;

    // Hours Analysis
    doc.setFontSize(12);
    doc.text('Hours Analysis:', 15, yPosition);
    yPosition += 7;

    doc.setFontSize(10);
    const hoursStats = [
      `Overtime Hours: ${stats.overtimeHours.toFixed(1)}h`,
      `Undertime Hours: ${stats.undertimeHours.toFixed(1)}h`,
      `Early Departures: ${stats.earlyDepartures}`,
    ];

    hoursStats.forEach((stat) => {
      doc.text(stat, 15, yPosition);
      yPosition += 6;
    });

    // Save PDF
    doc.save(`DTR_Report_${dateRange.startDate}_to_${dateRange.endDate}.pdf`);
  };

  const exportToExcel = () => {
    if (!stats) return;

    const workbook = XLSX.utils.book_new();

    // Sheet 1: Summary Stats
    const summaryData = [
      ['DTR Report Summary', ''],
      ['Report Period', `${dateRange.startDate} to ${dateRange.endDate}`],
      [''],
      ['Key Metrics', 'Value'],
      ['Working Days', stats.totalWorkingDays],
      ['Total Hours Worked', stats.totalHoursWorked.toFixed(1)],
      ['Average Daily Hours', stats.averageDailyHours.toFixed(1)],
      ['Late Arrivals', stats.lateArrivals],
      [''],
      ['Attendance Breakdown', ''],
      ['Present Days', stats.presentDays],
      ['Absent Days', stats.absentDays],
      ['Leave Days', stats.leaveDays],
      [
        'Present Rate %',
        stats.totalWorkingDays > 0 ? ((stats.presentDays / stats.totalWorkingDays) * 100).toFixed(1) : 0,
      ],
      [''],
      ['Hours Analysis', ''],
      ['Overtime Hours', stats.overtimeHours.toFixed(1)],
      ['Undertime Hours', stats.undertimeHours.toFixed(1)],
      ['Early Departures', stats.earlyDepartures],
    ];

    const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
    summarySheet['!cols'] = [{ wch: 25 }, { wch: 15 }];
    XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary');

    // Save Excel file
    XLSX.writeFile(workbook, `DTR_Report_${dateRange.startDate}_to_${dateRange.endDate}.xlsx`);
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900">DTR Reports & Analytics</h1>
        <p className="text-sm text-slate-600 mt-1">Attendance tracking and analysis</p>
      </div>

      {/* Filters */}
      <Card>
        <div className="p-4 space-y-4">
          <div className="flex gap-4 flex-wrap items-end">
            <div className="flex-1 min-w-[200px]">
              <label className="block text-sm font-medium text-slate-700 mb-1">Start Date</label>
              <Input
                type="date"
                value={dateRange.startDate}
                onChange={(e) => handleDateRangeChange(e.target.value, dateRange.endDate)}
              />
            </div>
            <div className="flex-1 min-w-[200px]">
              <label className="block text-sm font-medium text-slate-700 mb-1">End Date</label>
              <Input
                type="date"
                value={dateRange.endDate}
                onChange={(e) => handleDateRangeChange(dateRange.startDate, e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <Button variant="secondary" size="sm" onClick={handleSetThisMonth}>
                This Month
              </Button>
              <Button variant="secondary" size="sm" onClick={handleSetLastMonth}>
                Last Month
              </Button>
            </div>
          </div>

          {/* Export Buttons */}
          <div className="flex gap-2 pt-2 border-t">
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
      </Card>

      {/* Stats Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-32 bg-slate-100 rounded-lg animate-pulse" />
          ))}
        </div>
      ) : stats ? (
        <>
          {/* Main Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <div className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-slate-600 font-medium">Working Days</p>
                    <p className="text-2xl font-bold text-slate-900 mt-1">{stats.totalWorkingDays}</p>
                  </div>
                  <Calendar className="text-blue-500" size={32} />
                </div>
              </div>
            </Card>

            <Card>
              <div className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-slate-600 font-medium">Total Hours</p>
                    <p className="text-2xl font-bold text-slate-900 mt-1">{stats.totalHoursWorked.toFixed(1)}</p>
                  </div>
                  <Clock className="text-green-500" size={32} />
                </div>
              </div>
            </Card>

            <Card>
              <div className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-slate-600 font-medium">Avg Hours/Day</p>
                    <p className="text-2xl font-bold text-slate-900 mt-1">{stats.averageDailyHours.toFixed(1)}</p>
                  </div>
                  <TrendingUp className="text-purple-500" size={32} />
                </div>
              </div>
            </Card>

            <Card>
              <div className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-slate-600 font-medium">Late Arrivals</p>
                    <p className="text-2xl font-bold text-slate-900 mt-1">{stats.lateArrivals}</p>
                  </div>
                  <AlertCircle className="text-red-500" size={32} />
                </div>
              </div>
            </Card>
          </div>

          {/* Detailed Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <div className="p-4">
                <p className="text-sm font-medium text-slate-700 mb-3">Attendance Breakdown</p>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">Present</span>
                    <span className="font-semibold text-green-700">{stats.presentDays}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">Absent</span>
                    <span className="font-semibold text-red-700">{stats.absentDays}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">On Leave</span>
                    <span className="font-semibold text-blue-700">{stats.leaveDays}</span>
                  </div>
                </div>
              </div>
            </Card>

            <Card>
              <div className="p-4">
                <p className="text-sm font-medium text-slate-700 mb-3">Hours Analysis</p>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">Overtime</span>
                    <span className="font-semibold text-orange-700">{stats.overtimeHours.toFixed(1)}h</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">Undertime</span>
                    <span className="font-semibold text-amber-700">{stats.undertimeHours.toFixed(1)}h</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">Early Departures</span>
                    <span className="font-semibold text-slate-700">{stats.earlyDepartures}</span>
                  </div>
                </div>
              </div>
            </Card>

            <Card>
              <div className="p-4">
                <p className="text-sm font-medium text-slate-700 mb-3">Attendance Rate</p>
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-slate-600">Present %</span>
                      <span className="font-semibold">
                        {stats.totalWorkingDays > 0
                          ? ((stats.presentDays / stats.totalWorkingDays) * 100).toFixed(1)
                          : 0}%
                      </span>
                    </div>
                    <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-green-500 transition-all"
                        style={{
                          width:
                            stats.totalWorkingDays > 0
                              ? `${(stats.presentDays / stats.totalWorkingDays) * 100}%`
                              : '0%',
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </>
      ) : null}
    </div>
  );
}
