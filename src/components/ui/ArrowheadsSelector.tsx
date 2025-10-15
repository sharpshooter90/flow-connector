import React from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./select";

interface ArrowheadsSelectorProps {
  value: "none" | "end" | "both";
  onChange: (value: "none" | "end" | "both") => void;
  label: string;
}

const ArrowheadsSelector: React.FC<ArrowheadsSelectorProps> = ({
  value,
  onChange,
  label,
}) => {
  const options = [
    {
      value: "none" as const,
      label: "None",
      icon: (
        <svg className="w-4 h-4" viewBox="0 0 16 8" fill="none">
          <line
            x1="2"
            y1="4"
            x2="14"
            y2="4"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
      ),
    },
    {
      value: "end" as const,
      label: "End",
      icon: (
        <svg className="w-4 h-4" viewBox="0 0 16 8" fill="none">
          <line
            x1="2"
            y1="4"
            x2="12"
            y2="4"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
          <polygon points="10,2 12,4 10,6" fill="currentColor" />
        </svg>
      ),
    },
    {
      value: "both" as const,
      label: "Both",
      icon: (
        <svg className="w-4 h-4" viewBox="0 0 16 8" fill="none">
          <line
            x1="4"
            y1="4"
            x2="12"
            y2="4"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
          <polygon points="4,2 2,4 4,6" fill="currentColor" />
          <polygon points="12,2 14,4 12,6" fill="currentColor" />
        </svg>
      ),
    },
  ];

  return (
    <div className="space-y-2 relative">
      <label className="block text-[10px] font-semibold text-gray-700">
        {label}
      </label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="w-full bg-gray-100 border border-gray-200 rounded text-xs px-2 py-1.5 text-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent h-auto">
          <SelectValue>
            <div className="flex items-center justify-center">
              {options.find((option) => option.value === value)?.icon}
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

export default ArrowheadsSelector;
