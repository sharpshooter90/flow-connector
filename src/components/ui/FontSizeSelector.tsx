import React from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./select";

interface FontSizeSelectorProps {
  value: number;
  onChange: (value: number) => void;
  label: string;
}

const FontSizeSelector: React.FC<FontSizeSelectorProps> = ({
  value,
  onChange,
  label,
}) => {
  const options = [
    {
      value: 8,
      label: "8",
      icon: (
        <svg className="w-4 h-4" viewBox="0 0 16 8" fill="none">
          <text x="2" y="6" fontSize="6" fill="currentColor">
            Aa
          </text>
        </svg>
      ),
    },
    {
      value: 10,
      label: "10",
      icon: (
        <svg className="w-4 h-4" viewBox="0 0 16 8" fill="none">
          <text x="2" y="6" fontSize="7" fill="currentColor">
            Aa
          </text>
        </svg>
      ),
    },
    {
      value: 12,
      label: "12",
      icon: (
        <svg className="w-4 h-4" viewBox="0 0 16 8" fill="none">
          <text x="2" y="6" fontSize="8" fill="currentColor">
            Aa
          </text>
        </svg>
      ),
    },
    {
      value: 14,
      label: "14",
      icon: (
        <svg className="w-4 h-4" viewBox="0 0 16 8" fill="none">
          <text x="2" y="6" fontSize="9" fill="currentColor">
            Aa
          </text>
        </svg>
      ),
    },
    {
      value: 16,
      label: "16",
      icon: (
        <svg className="w-4 h-4" viewBox="0 0 16 8" fill="none">
          <text x="2" y="6" fontSize="10" fill="currentColor">
            Aa
          </text>
        </svg>
      ),
    },
    {
      value: 18,
      label: "18",
      icon: (
        <svg className="w-4 h-4" viewBox="0 0 16 8" fill="none">
          <text x="2" y="6" fontSize="11" fill="currentColor">
            Aa
          </text>
        </svg>
      ),
    },
    {
      value: 20,
      label: "20",
      icon: (
        <svg className="w-4 h-4" viewBox="0 0 16 8" fill="none">
          <text x="2" y="6" fontSize="12" fill="currentColor">
            Aa
          </text>
        </svg>
      ),
    },
    {
      value: 24,
      label: "24",
      icon: (
        <svg className="w-4 h-4" viewBox="0 0 16 8" fill="none">
          <text x="2" y="6" fontSize="13" fill="currentColor">
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
      <Select
        value={String(value)}
        onValueChange={(val) => onChange(Number(val))}
      >
        <SelectTrigger className="w-full bg-gray-100 border border-gray-200 rounded text-xs px-3 py-2 text-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent h-auto">
          <SelectValue>
            <div className="flex items-center justify-center">
              {options.find((option) => option.value === value)?.icon}
            </div>
          </SelectValue>
        </SelectTrigger>
        <SelectContent className="z-[9999]">
          {options.map((option) => (
            <SelectItem key={option.value} value={String(option.value)}>
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

export default FontSizeSelector;
