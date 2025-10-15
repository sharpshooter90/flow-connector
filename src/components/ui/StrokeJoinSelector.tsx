import React from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./select";

interface StrokeJoinSelectorProps {
  value: "miter" | "round" | "bevel";
  onChange: (value: "miter" | "round" | "bevel") => void;
  label: string;
}

const StrokeJoinSelector: React.FC<StrokeJoinSelectorProps> = ({
  value,
  onChange,
  label,
}) => {
  const options = [
    {
      value: "miter" as const,
      label: "Miter",
      icon: (
        <svg className="w-4 h-4" viewBox="0 0 16 16">
          <path
            d="M2 8 L6 4 L10 8 L6 12 Z"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinejoin="miter"
          />
        </svg>
      ),
    },
    {
      value: "round" as const,
      label: "Round",
      icon: (
        <svg className="w-4 h-4" viewBox="0 0 16 16">
          <path
            d="M2 8 L6 4 L10 8 L6 12 Z"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
        </svg>
      ),
    },
    {
      value: "bevel" as const,
      label: "Bevel",
      icon: (
        <svg className="w-4 h-4" viewBox="0 0 16 16">
          <path
            d="M2 8 L6 4 L10 8 L6 12 Z"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinejoin="bevel"
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

export default StrokeJoinSelector;
