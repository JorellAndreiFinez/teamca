import React, { useState } from "react";
import { dtrService } from "../services/dtrService";
import Button from "./ui/Button";
import Input from "./ui/Input";
import Card from "./ui/Card";

type ExportType = "records" | "summary" | "detailed";
type ExportFormat = "csv" | "json" | "xlsx" | "pdf";

interface ExportOptions {
  startDate: string;
  endDate: string;
  format: ExportFormat;
  type: ExportType;
}

export const ExportOptions: React.FC = () => {
  const [options, setOptions] = useState<ExportOptions>({
    startDate: new Date(new Date().setDate(new Date().getDate() - 7))
      .toISOString()
      .split("T")[0],
    endDate: new Date().toISOString().split("T")[0],
    format: "csv",
    type: "records",
  });

  const [isLoading, setIsLoading] = useState(false);
  const [preview, setPreview] = useState<any>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(
    null,
  );

  const validateDates = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (options.startDate > options.endDate) {
      newErrors.dates = "Start date must be before end date";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    setOptions((prev) => ({ ...prev, [name]: value }));
    setPreview(null);
    setErrors({});
  };

  const handlePreview = async () => {
    if (!validateDates()) return;

    try {
      setIsLoading(true);
      setMessage(null);
      const data = await dtrService.previewExport(
        options.startDate,
        options.endDate,
        options.type,
      );
      setPreview(data);
    } catch (error: any) {
      setMessage({
        type: "error",
        text: error.response?.data?.message || "Failed to preview export",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = async () => {
    if (!validateDates()) return;

    try {
      setIsLoading(true);
      setMessage(null);
      const response = await dtrService.exportDTR(
        options.startDate,
        options.endDate,
        options.format,
        options.type,
      );

      const data = (response as any).data;
      let blobData: any;
      let mimeType: string;
      let fileExtension: string;

      switch (options.format) {
        case "json":
          blobData = JSON.stringify(data, null, 2);
          mimeType = "application/json";
          fileExtension = "json";
          break;
        case "xlsx":
          blobData = data;
          mimeType = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
          fileExtension = "xlsx";
          break;
        case "pdf":
          blobData = data;
          mimeType = "application/pdf";
          fileExtension = "pdf";
          break;
        case "csv":
        default:
          blobData = data;
          mimeType = "text/csv";
          fileExtension = "csv";
          break;
      }

      const blob = new Blob([blobData], { type: mimeType });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `dtr-export-${Date.now()}.${fileExtension}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      setMessage({ type: "success", text: "Export downloaded successfully" });
    } catch (error: any) {
      setMessage({
        type: "error",
        text: error.response?.data?.message || "Failed to download export",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const formatTypeLabel = {
    records: "Individual Records",
    summary: "Weekly/Monthly Summary",
    detailed: "Detailed with Breaks",
  };

  return (
    <div className="space-y-4">
      {/* Options Section */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-6">Export DTR Records</h2>

        {(message || Object.keys(errors).length > 0) && (
          <div
            className={`mb-6 p-4 rounded-lg ${
              message?.type === "success" || !message
                ? "bg-green-50 text-green-800 border border-green-200"
                : "bg-red-50 text-red-800 border border-red-200"
            }`}
          >
            {message?.text || errors.dates}
          </div>
        )}

        {/* Date Inputs */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6 pb-6 border-b border-gray-200">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Start Date
            </label>
            <Input
              type="date"
              name="startDate"
              value={options.startDate}
              onChange={handleChange}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              End Date
            </label>
            <Input
              type="date"
              name="endDate"
              value={options.endDate}
              onChange={handleChange}
            />
          </div>
        </div>

        {/* Export Options */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Export Type
            </label>
            <select
              name="type"
              value={options.type}
              onChange={handleChange}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-sm"
            >
              <option value="records">Individual Records</option>
              <option value="summary">Weekly/Monthly Summary</option>
              <option value="detailed">Detailed with Breaks</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              File Format
            </label>
            <select
              name="format"
              value={options.format}
              onChange={handleChange}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-sm"
            >
              <option value="csv">CSV</option>
              <option value="json">JSON</option>
              <option value="xlsx">Excel (XLSX)</option>
              <option value="pdf">PDF</option>
            </select>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <Button
            onClick={handlePreview}
            disabled={isLoading}
            className="flex-1 bg-gray-500 text-white hover:bg-gray-600 py-2.5 rounded-lg font-medium transition"
          >
            {isLoading ? "Loading..." : "Preview"}
          </Button>
          <Button
            onClick={handleDownload}
            disabled={isLoading}
            className="flex-1 bg-blue-600 text-white hover:bg-blue-700 py-2.5 rounded-lg font-medium transition"
          >
            {isLoading ? "Processing..." : "Download"}
          </Button>
        </div>
      </Card>

      {/* Preview Section */}
      {preview && (
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">
              Preview ({formatTypeLabel[options.type]})
            </h3>
            <span className="text-xs bg-gray-100 text-gray-600 px-3 py-1 rounded-full">
              {preview.rows?.length || 0} rows
            </span>
          </div>

          <div className="bg-gray-50 rounded-lg overflow-hidden border border-gray-200">
            <div className="overflow-x-auto max-h-96 overflow-y-auto">
              {options.type === "records" && preview.rows ? (
                <table className="w-full text-sm">
                  <thead className="bg-gray-100 sticky top-0">
                    <tr>
                      {preview.headers.map((header: string) => (
                        <th
                          key={header}
                          className="text-left px-4 py-3 font-medium text-gray-700 whitespace-nowrap border-b border-gray-200"
                        >
                          {header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {preview.rows.slice(0, 10).map((row: any[], idx: number) => (
                      <tr key={idx} className="border-b border-gray-200 hover:bg-gray-100">
                        {row.map((cell: any, cellIdx: number) => (
                          <td key={cellIdx} className="px-4 py-3 text-gray-900">
                            {cell}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <pre className="p-4 text-xs text-gray-700 whitespace-pre-wrap break-words font-mono">
                  {JSON.stringify(preview, null, 2)}
                </pre>
              )}
            </div>

            {preview.rows?.length > 10 && (
              <div className="bg-gray-100 px-4 py-3 text-xs text-gray-600 border-t border-gray-200">
                Showing 10 of {preview.rows.length} rows
              </div>
            )}
          </div>
        </Card>
      )}
    </div>
  );
};
