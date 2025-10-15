import React from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./select";

interface ArrowTypeSelectorProps {
  value: "straight" | "curved" | "elbow";
  onChange: (value: "straight" | "curved" | "elbow") => void;
  label: string;
}

const ArrowTypeSelector: React.FC<ArrowTypeSelectorProps> = ({
  value,
  onChange,
  label,
}) => {
  const options = [
    {
      value: "straight" as const,
      label: "Straight",
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
      value: "curved" as const,
      label: "Curved",
      icon: (
        <svg className="w-4 h-4" viewBox="0 0 16 8" fill="none">
          <path
            d="M2,4 Q7,1 12,4"
            stroke="currentColor"
            strokeWidth="1.5"
            fill="none"
            strokeLinecap="round"
          />
          <polygon points="10,2 12,4 10,6" fill="currentColor" />
        </svg>
      ),
    },
    {
      value: "elbow" as const,
      label: "Elbow",
      icon: (
        <svg className="w-4 h-4" viewBox="0 0 16 8" fill="none">
          <path
            d="M2,4 L7,4 L7,2 L12,2"
            stroke="currentColor"
            strokeWidth="1.5"
            fill="none"
            strokeLinecap="round"
          />
          <polygon points="10,1 12,2 10,3" fill="currentColor" />
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

export default ArrowTypeSelector;
