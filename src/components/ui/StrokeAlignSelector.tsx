import React from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./select";

interface StrokeAlignSelectorProps {
  value: "center" | "inside" | "outside";
  onChange: (value: "center" | "inside" | "outside") => void;
  label: string;
}

const StrokeAlignSelector: React.FC<StrokeAlignSelectorProps> = ({
  value,
  onChange,
  label,
}) => {
  const options = [
    {
      value: "inside" as const,
      label: "Inside",
      icon: (
        <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none">
          {/* Background shape */}
          <rect
            x="1"
            y="3"
            width="14"
            height="10"
            fill="none"
            stroke="currentColor"
            strokeWidth="0.5"
            opacity="0.3"
          />
          {/* Inside stroke - smaller rectangle */}
          <rect
            x="3"
            y="5"
            width="10"
            height="6"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          />
        </svg>
      ),
    },
    {
      value: "center" as const,
      label: "Center",
      icon: (
        <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none">
          {/* Center stroke - centered rectangle */}
          <rect
            x="1"
            y="3"
            width="14"
            height="10"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          />
        </svg>
      ),
    },
    {
      value: "outside" as const,
      label: "Outside",
      icon: (
        <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none">
          {/* Background shape */}
          <rect
            x="1"
            y="3"
            width="14"
            height="10"
            fill="none"
            stroke="currentColor"
            strokeWidth="0.5"
            opacity="0.3"
          />
          {/* Outside stroke - larger rectangle */}
          <rect
            x="0"
            y="2"
            width="16"
            height="12"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          />
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

export default StrokeAlignSelector;
