// frontend\src\components\ui\Input.tsx

import React from "react";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export function Input({
  label,
  error,
  helperText,
  className = "",
  id,
  ...props
}: InputProps) {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, "-");

  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label htmlFor={inputId} className="text-sm font-medium text-slate-700">
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={`w-full rounded-md border px-3 py-2 text-sm text-slate-900 placeholder-slate-400
          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
          disabled:bg-slate-50 disabled:text-slate-500
          ${error ? "border-red-400 focus:ring-red-500" : "border-slate-300"}
          ${className}`}
        {...props}
      />
      {error && <p className="text-xs text-red-600">{error}</p>}
      {helperText && !error && (
        <p className="text-xs text-slate-500">{helperText}</p>
      )}
    </div>
  );
}

export default Input;
