import React from "react";

interface OptionSelectorOption<T> {
  value: T;
  label: string;
  icon?: React.ReactNode;
  className?: string;
}

interface OptionSelectorProps<T> {
  value: T;
  options: OptionSelectorOption<T>[];
  onChange: (value: T) => void;
  label: string;
  columns?: number;
}

function OptionSelector<T extends string | number>({
  value,
  options,
  onChange,
  label,
  columns = 4,
}: OptionSelectorProps<T>) {
  const gridCols =
    {
      2: "grid-cols-2",
      3: "grid-cols-3",
      4: "grid-cols-4",
      5: "grid-cols-5",
      6: "grid-cols-6",
    }[columns] || "grid-cols-4";

  return (
    <div className="space-y-2">
      <label className="block text-[10px] font-semibold text-gray-700">
        {label}
      </label>
      <div className={`grid ${gridCols} gap-1`}>
        {options.map((option) => (
          <button
            key={String(option.value)}
            onClick={() => onChange(option.value)}
            className={`
              p-2 border-2 rounded text-[11px] transition-all hover:border-purple-400 
              flex items-center justify-center min-h-[32px] relative
              ${
                value === option.value
                  ? "border-purple-500 bg-purple-500 text-white"
                  : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
              }
              ${option.className || ""}
            `}
            title={option.label}
          >
            {option.icon ? (
              <div className="flex items-center justify-center">
                {option.icon}
              </div>
            ) : (
              option.label
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

export default OptionSelector;
