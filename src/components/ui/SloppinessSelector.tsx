import React from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./select";

interface SloppinessSelectorProps {
  value: "none" | "low" | "high";
  onChange: (value: "none" | "low" | "high") => void;
  label: string;
}

const SloppinessSelector: React.FC<SloppinessSelectorProps> = ({
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
      value: "low" as const,
      label: "Low",
      icon: (
        <svg className="w-4 h-4" viewBox="0 0 16 8" fill="none">
          <path
            d="M2,4 Q6,3 10,4 T14,4"
            stroke="currentColor"
            strokeWidth="1.5"
            fill="none"
            strokeLinecap="round"
          />
        </svg>
      ),
    },
    {
      value: "high" as const,
      label: "High",
      icon: (
        <svg className="w-4 h-4" viewBox="0 0 16 8" fill="none">
          <path
            d="M2,4 Q6,2 10,4 T14,4"
            stroke="currentColor"
            strokeWidth="1.5"
            fill="none"
            strokeLinecap="round"
          />
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

export default SloppinessSelector;
