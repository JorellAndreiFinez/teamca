// frontend/src/components/ui/input/NumberInput.tsx

import { Input, InputProps } from "../Input";
import { useState, useEffect } from "react";

interface NumberInputProps extends Omit<InputProps, "type" | "onChange"> {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  allowDecimal?: boolean;
}

export function NumberInput({
  value,
  onChange,
  min = 0,
  max,
  allowDecimal = false,
  ...props
}: NumberInputProps) {
  const [error, setError] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value;

    // Prevent invalid chars
    if (!allowDecimal) {
      val = val.replace(/[^0-9]/g, "");
    }

    let num = Number(val);

    if (isNaN(num)) {
      onChange(0);
      return;
    }

    // Constraints
    if (num < min) {
      setError(`Minimum is ${min}`);
      num = min;
    } else if (max !== undefined && num > max) {
      setError(`Maximum is ${max}`);
      num = max;
    } else {
      setError("");
    }

    onChange(num);
  };

  return (
    <Input
      type="number"
      value={value}
      onChange={handleChange}
      error={error}
      min={min}
      max={max}
      {...props}
    />
  );
}
