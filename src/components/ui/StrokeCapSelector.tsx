import React from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./select";

interface StrokeCapSelectorProps {
  value: "none" | "round" | "square";
  onChange: (value: "none" | "round" | "square") => void;
  label: string;
}

const StrokeCapSelector: React.FC<StrokeCapSelectorProps> = ({
  value,
  onChange,
  label,
}) => {
  const options = [
    {
      value: "none" as const,
      label: "None",
      icon: (
        <svg className="w-4 h-4" viewBox="0 0 16 16">
          <line
            x1="2"
            y1="8"
            x2="14"
            y2="8"
            stroke="currentColor"
            strokeWidth="2"
          />
        </svg>
      ),
    },
    {
      value: "round" as const,
      label: "Round",
      icon: (
        <svg className="w-4 h-4" viewBox="0 0 16 16">
          <line
            x1="2"
            y1="8"
            x2="14"
            y2="8"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      ),
    },
    {
      value: "square" as const,
      label: "Square",
      icon: (
        <svg className="w-4 h-4" viewBox="0 0 16 16">
          <line
            x1="2"
            y1="8"
            x2="14"
            y2="8"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="square"
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

export default StrokeCapSelector;
