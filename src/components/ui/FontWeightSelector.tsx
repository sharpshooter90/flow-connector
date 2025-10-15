import React from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./select";

interface FontWeightSelectorProps {
  value: string;
  onChange: (value: string) => void;
  label: string;
}

const FontWeightSelector: React.FC<FontWeightSelectorProps> = ({
  value,
  onChange,
  label,
}) => {
  const options = [
    {
      value: "Light",
      label: "Light",
      icon: (
        <svg className="w-4 h-4" viewBox="0 0 16 8" fill="none">
          <text x="2" y="6" fontSize="8" fontWeight="300" fill="currentColor">
            Aa
          </text>
        </svg>
      ),
    },
    {
      value: "Regular",
      label: "Regular",
      icon: (
        <svg className="w-4 h-4" viewBox="0 0 16 8" fill="none">
          <text x="2" y="6" fontSize="8" fontWeight="400" fill="currentColor">
            Aa
          </text>
        </svg>
      ),
    },
    {
      value: "Medium",
      label: "Medium",
      icon: (
        <svg className="w-4 h-4" viewBox="0 0 16 8" fill="none">
          <text x="2" y="6" fontSize="8" fontWeight="500" fill="currentColor">
            Aa
          </text>
        </svg>
      ),
    },
    {
      value: "Semibold",
      label: "Semibold",
      icon: (
        <svg className="w-4 h-4" viewBox="0 0 16 8" fill="none">
          <text x="2" y="6" fontSize="8" fontWeight="600" fill="currentColor">
            Aa
          </text>
        </svg>
      ),
    },
    {
      value: "Bold",
      label: "Bold",
      icon: (
        <svg className="w-4 h-4" viewBox="0 0 16 8" fill="none">
          <text x="2" y="6" fontSize="8" fontWeight="700" fill="currentColor">
            Aa
          </text>
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

export default FontWeightSelector;
