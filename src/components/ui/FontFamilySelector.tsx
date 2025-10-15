import React from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./select";

interface FontFamilySelectorProps {
  value: string;
  onChange: (value: string) => void;
  label: string;
}

const FontFamilySelector: React.FC<FontFamilySelectorProps> = ({
  value,
  onChange,
  label,
}) => {
  const options = [
    {
      value: "Inter",
      label: "Inter",
      icon: (
        <svg className="w-4 h-4" viewBox="0 0 16 8" fill="none">
          <text x="2" y="6" fontSize="8" fontFamily="Inter" fill="currentColor">
            Aa
          </text>
        </svg>
      ),
    },
    {
      value: "Helvetica",
      label: "Helvetica",
      icon: (
        <svg className="w-4 h-4" viewBox="0 0 16 8" fill="none">
          <text
            x="2"
            y="6"
            fontSize="8"
            fontFamily="Helvetica"
            fill="currentColor"
          >
            Aa
          </text>
        </svg>
      ),
    },
    {
      value: "Arial",
      label: "Arial",
      icon: (
        <svg className="w-4 h-4" viewBox="0 0 16 8" fill="none">
          <text x="2" y="6" fontSize="8" fontFamily="Arial" fill="currentColor">
            Aa
          </text>
        </svg>
      ),
    },
    {
      value: "Georgia",
      label: "Georgia",
      icon: (
        <svg className="w-4 h-4" viewBox="0 0 16 8" fill="none">
          <text
            x="2"
            y="6"
            fontSize="8"
            fontFamily="Georgia"
            fill="currentColor"
          >
            Aa
          </text>
        </svg>
      ),
    },
    {
      value: "Times New Roman",
      label: "Times New Roman",
      icon: (
        <svg className="w-4 h-4" viewBox="0 0 16 8" fill="none">
          <text
            x="2"
            y="6"
            fontSize="8"
            fontFamily="Times New Roman"
            fill="currentColor"
          >
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

export default FontFamilySelector;
