import React from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./select";

interface BorderWidthSelectorProps {
  value: number;
  onChange: (value: number) => void;
  label: string;
}

const BorderWidthSelector: React.FC<BorderWidthSelectorProps> = ({
  value,
  onChange,
  label,
}) => {
  const options = [
    {
      value: 0,
      label: "0",
      icon: (
        <svg className="w-4 h-4" viewBox="0 0 16 8" fill="none">
          <line
            x1="2"
            y1="4"
            x2="14"
            y2="4"
            stroke="currentColor"
            strokeWidth="0.5"
            strokeLinecap="round"
          />
        </svg>
      ),
    },
    {
      value: 1,
      label: "1",
      icon: (
        <svg className="w-4 h-4" viewBox="0 0 16 8" fill="none">
          <line
            x1="2"
            y1="4"
            x2="14"
            y2="4"
            stroke="currentColor"
            strokeWidth="1"
            strokeLinecap="round"
          />
        </svg>
      ),
    },
    {
      value: 2,
      label: "2",
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
      value: 3,
      label: "3",
      icon: (
        <svg className="w-4 h-4" viewBox="0 0 16 8" fill="none">
          <line
            x1="2"
            y1="4"
            x2="14"
            y2="4"
            stroke="currentColor"
            strokeWidth="3"
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

export default BorderWidthSelector;
