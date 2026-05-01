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
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(
    null,
  );

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    setOptions((prev) => ({ ...prev, [name]: value }));
    setPreview(null);
  };

  const handlePreview = async () => {
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
    try {
      setIsLoading(true);
      setMessage(null);
      const response = await dtrService.exportDTR(
        options.startDate,
        options.endDate,
        options.format,
        options.type,
      );

      const isJson = options.format === "json";
      const data = (response as any).data;
      const mimeType = isJson
        ? "application/json"
        : options.format === "xlsx"
          ? "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
          : options.format === "pdf"
            ? "application/pdf"
            : "text/csv";

      const blobData = isJson ? JSON.stringify(data, null, 2) : data;
      const blob = new Blob([blobData], { type: mimeType });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute(
        "download",
        `dtr-export-${Date.now()}.${options.format}`,
      );
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);

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

  return (
    <div className="space-y-4">
      <Card className="p-6">
        <h2 className="text-xl font-bold mb-4">Export DTR Records</h2>

        {message && (
          <div
            className={`mb-4 p-3 rounded ${
              message.type === "success"
                ? "bg-green-100 text-green-700"
                : "bg-red-100 text-red-700"
            }`}
          >
            {message.text}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium mb-2">Start Date</label>
            <Input
              type="date"
              name="startDate"
              value={options.startDate}
              onChange={handleChange}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">End Date</label>
            <Input
              type="date"
              name="endDate"
              value={options.endDate}
              onChange={handleChange}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Export Type</label>
            <select
              name="type"
              value={options.type}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="records">Individual Records</option>
              <option value="summary">Weekly/Monthly Summary</option>
              <option value="detailed">Detailed with Breaks</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">File Format</label>
            <select
              name="format"
              value={options.format}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="csv">CSV</option>
              <option value="json">JSON</option>
              <option value="xlsx">Excel (XLSX)</option>
              <option value="pdf">PDF</option>
            </select>
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            onClick={handlePreview}
            disabled={isLoading}
            className="flex-1 bg-gray-600 text-white hover:bg-gray-700"
          >
            {isLoading ? "Loading..." : "Preview"}
          </Button>
          <Button
            onClick={handleDownload}
            disabled={isLoading}
            className="flex-1 bg-blue-600 text-white hover:bg-blue-700"
          >
            {isLoading ? "Processing..." : "Download"}
          </Button>
        </div>
      </Card>

      {preview && (
        <Card className="p-6">
          <h3 className="font-bold mb-4">Preview</h3>
          <div className="bg-gray-50 p-4 rounded overflow-x-auto max-h-96 overflow-y-auto">
            {options.type === "records" && preview.rows ? (
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="border-b">
                    {preview.headers.map((header: string) => (
                      <th key={header} className="text-left p-2 font-medium">
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {preview.rows.slice(0, 10).map((row: any[], idx: number) => (
                    <tr key={idx} className="border-b">
                      {row.map((cell: any, cellIdx: number) => (
                        <td key={cellIdx} className="p-2">
                          {cell}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <pre className="text-xs whitespace-pre-wrap break-words">
                {JSON.stringify(preview, null, 2)}
              </pre>
            )}
            {preview.rows?.length > 10 && (
              <p className="text-xs text-gray-500 mt-2">
                ... and {preview.rows.length - 10} more rows
              </p>
            )}
          </div>
        </Card>
      )}
    </div>
  );
};
