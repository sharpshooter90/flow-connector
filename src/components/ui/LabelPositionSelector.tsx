import React from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./select";

interface LabelPositionSelectorProps {
  value: "center" | "top" | "bottom";
  onChange: (value: "center" | "top" | "bottom") => void;
  label: string;
}

const LabelPositionSelector: React.FC<LabelPositionSelectorProps> = ({
  value,
  onChange,
  label,
}) => {
  const options = [
    {
      value: "top" as const,
      label: "Top",
      icon: (
        <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none">
          <line
            x1="8"
            y1="2"
            x2="8"
            y2="14"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
          <circle cx="8" cy="3" r="1.5" fill="currentColor" />
        </svg>
      ),
    },
    {
      value: "center" as const,
      label: "Center",
      icon: (
        <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none">
          <line
            x1="8"
            y1="2"
            x2="8"
            y2="14"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
          <circle cx="8" cy="8" r="1.5" fill="currentColor" />
        </svg>
      ),
    },
    {
      value: "bottom" as const,
      label: "Bottom",
      icon: (
        <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none">
          <line
            x1="8"
            y1="2"
            x2="8"
            y2="14"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
          <circle cx="8" cy="13" r="1.5" fill="currentColor" />
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

export default LabelPositionSelector;
