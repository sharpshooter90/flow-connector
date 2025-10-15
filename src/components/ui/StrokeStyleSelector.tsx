import React from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./select";

interface StrokeStyleSelectorProps {
  value: "solid" | "dashed" | "dotted";
  onChange: (value: "solid" | "dashed" | "dotted") => void;
  label: string;
}

const StrokeStyleSelector: React.FC<StrokeStyleSelectorProps> = ({
  value,
  onChange,
  label,
}) => {
  const options = [
    {
      value: "solid" as const,
      label: "Solid",
      icon: (
        <svg className="w-4 h-4" viewBox="0 0 16 8" fill="none">
          <line
            x1="2"
            y1="4"
            x2="14"
            y2="4"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      ),
    },
    {
      value: "dashed" as const,
      label: "Dashed",
      icon: (
        <svg className="w-4 h-4" viewBox="0 0 16 8" fill="none">
          <line
            x1="2"
            y1="4"
            x2="6"
            y2="4"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <line
            x1="8"
            y1="4"
            x2="12"
            y2="4"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      ),
    },
    {
      value: "dotted" as const,
      label: "Dotted",
      icon: (
        <svg className="w-4 h-4" viewBox="0 0 16 8" fill="none">
          <circle cx="3" cy="4" r="1" fill="currentColor" />
          <circle cx="6" cy="4" r="1" fill="currentColor" />
          <circle cx="9" cy="4" r="1" fill="currentColor" />
          <circle cx="12" cy="4" r="1" fill="currentColor" />
        </svg>
      ),
    },
  ];

  return (
    <div className="space-y-2 relative">
      <label className="block text-[10px] font-semibold text-gray-700 uppercase tracking-wide">
        {label}
      </label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="w-full bg-gray-100 border border-gray-200 rounded text-xs px-3 py-2 text-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent h-auto">
          <SelectValue>
            <div className="flex items-center gap-2">
              {options.find((option) => option.value === value)?.icon}
              <span>
                {options.find((option) => option.value === value)?.label}
              </span>
            </div>
          </SelectValue>
        </SelectTrigger>
        <SelectContent className="z-[9999]">
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              <div className="flex items-center gap-2">
                {option.icon}
                <span>{option.label}</span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

export default StrokeStyleSelector;
