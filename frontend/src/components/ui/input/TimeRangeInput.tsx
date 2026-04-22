// frontend/src/components/ui/input/TimeRangeInput.tsx

import { useState, useEffect } from "react";
import { Input } from "../Input";

interface TimeRange {
  start: string;
  end: string;
}

interface Props {
  label?: string;
  value: TimeRange;
  onChange: (value: TimeRange) => void;
  required?: boolean;
}

export function TimeRangeInput({
  label,
  value,
  onChange,
  required = false,
}: Props) {
  const [error, setError] = useState("");

  const validate = (start: string, end: string) => {
    if (!start && !end) return "";

    if (required && (!start || !end)) {
      return "Both start and end time are required";
    }

    if (start && end && start > end) {
      return "Start time must not be later than end time";
    }

    return "";
  };

  const handleChange = (field: "start" | "end", val: string) => {
    const updated = { ...value, [field]: val };

    const err = validate(updated.start, updated.end);
    setError(err);

    onChange(updated);
  };

  useEffect(() => {
    setError(validate(value.start, value.end));
  }, [value.start, value.end]);

  return (
    <div className="space-y-1">
      {label && (
        <label className="text-sm font-medium text-gray-700">{label}</label>
      )}

      <div className="grid grid-cols-2 gap-4">
        <Input
          type="time"
          value={value.start}
          onChange={(e) => handleChange("start", e.target.value)}
          className={error ? "border-red-400 focus:ring-red-500" : ""}
        />

        <Input
          type="time"
          value={value.end}
          onChange={(e) => handleChange("end", e.target.value)}
          className={error ? "border-red-400 focus:ring-red-500" : ""}
        />
      </div>

      {/* ✅ ONLY ONE ERROR MESSAGE */}
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
