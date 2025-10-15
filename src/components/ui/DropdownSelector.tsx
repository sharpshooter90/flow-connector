import React from "react";
import { ChevronDown } from "lucide-react";

interface DropdownSelectorOption<T> {
  value: T;
  label: string;
  icon?: React.ReactNode;
}

interface DropdownSelectorProps<T> {
  value: T;
  options: DropdownSelectorOption<T>[];
  onChange: (value: T) => void;
  label: string;
}

function DropdownSelector<T extends string | number>({
  value,
  options,
  onChange,
  label,
}: DropdownSelectorProps<T>) {
  const selectedOption = options.find(option => option.value === value);

  return (
    <div className="space-y-2">
      <label className="block text-[10px] font-semibold text-gray-700 uppercase tracking-wide">
        {label}
      </label>
      <div className="relative">
        <select
          value={String(value)}
          onChange={(e) => {
            const selectedValue = options.find(opt => String(opt.value) === e.target.value)?.value;
            if (selectedValue !== undefined) {
              onChange(selectedValue);
            }
          }}
          className="w-full appearance-none bg-white border border-gray-300 rounded-md px-3 py-2 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          {options.map((option) => (
            <option key={String(option.value)} value={String(option.value)}>
              {option.label}
            </option>
          ))}
        </select>
        <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
          <ChevronDown className="h-4 w-4 text-gray-400" />
        </div>
      </div>
      
      {/* Visual preview of selected option */}
      {selectedOption && (
        <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-md border">
          {selectedOption.icon && (
            <div className="flex items-center justify-center">
              {selectedOption.icon}
            </div>
          )}
          <span className="text-sm text-gray-700">{selectedOption.label}</span>
        </div>
      )}
    </div>
  );
}

export default DropdownSelector;