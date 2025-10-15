import React from "react";

interface StrokeCapSelectorProps {
  value: "none" | "round" | "square";
  onChange: (value: "none" | "round" | "square") => void;
  label: string;
}

const StrokeCapSelector: React.FC<StrokeCapSelectorProps> = ({
  value,
  onChange,
  label,
}) => {
  const options = [
    {
      value: "none" as const,
      label: "None",
      icon: (
        <svg className="w-4 h-4" viewBox="0 0 16 16">
          <line
            x1="2"
            y1="8"
            x2="14"
            y2="8"
            stroke="currentColor"
            strokeWidth="2"
          />
        </svg>
      ),
    },
    {
      value: "round" as const,
      label: "Round",
      icon: (
        <svg className="w-4 h-4" viewBox="0 0 16 16">
          <line
            x1="2"
            y1="8"
            x2="14"
            y2="8"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      ),
    },
    {
      value: "square" as const,
      label: "Square",
      icon: (
        <svg className="w-4 h-4" viewBox="0 0 16 16">
          <line
            x1="2"
            y1="8"
            x2="14"
            y2="8"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="square"
          />
        </svg>
      ),
    },
  ];

  return (
    <div className="space-y-2">
      <label className="block text-[10px] font-semibold text-gray-700">
        {label}
      </label>
      <select
        value={value}
        onChange={(e) =>
          onChange(e.target.value as "none" | "round" | "square")
        }
        className="w-full bg-gray-100 border border-gray-200 rounded text-xs px-3 py-2 text-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
};

export default StrokeCapSelector;
