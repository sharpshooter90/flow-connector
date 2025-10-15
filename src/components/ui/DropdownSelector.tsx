import React from "react";
import { ChevronDown } from "lucide-react";
import { DROPDOWN_STYLES } from "../../utils/dropdownStyles";

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
  const selectedOption = options.find((option) => option.value === value);

  return (
    <div className={DROPDOWN_STYLES.container}>
      <label className={DROPDOWN_STYLES.label}>{label}</label>
      <div className="relative">
        <select
          value={String(value)}
          onChange={(e) => {
            const selectedValue = options.find(
              (opt) => String(opt.value) === e.target.value
            )?.value;
            if (selectedValue !== undefined) {
              onChange(selectedValue);
            }
          }}
          className={`${DROPDOWN_STYLES.select} appearance-none pr-8`}
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
          <span className="text-xs text-gray-700">{selectedOption.label}</span>
        </div>
      )}
    </div>
  );
}

export default DropdownSelector;
