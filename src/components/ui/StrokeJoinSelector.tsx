import React from "react";

interface StrokeJoinSelectorProps {
  value: "miter" | "round" | "bevel";
  onChange: (value: "miter" | "round" | "bevel") => void;
  label: string;
}

const StrokeJoinSelector: React.FC<StrokeJoinSelectorProps> = ({
  value,
  onChange,
  label,
}) => {
  const options = [
    {
      value: "miter" as const,
      label: "Miter",
      icon: (
        <svg className="w-4 h-4" viewBox="0 0 16 16">
          <path
            d="M2 8 L6 4 L10 8 L6 12 Z"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinejoin="miter"
          />
        </svg>
      ),
    },
    {
      value: "round" as const,
      label: "Round",
      icon: (
        <svg className="w-4 h-4" viewBox="0 0 16 16">
          <path
            d="M2 8 L6 4 L10 8 L6 12 Z"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
        </svg>
      ),
    },
    {
      value: "bevel" as const,
      label: "Bevel",
      icon: (
        <svg className="w-4 h-4" viewBox="0 0 16 16">
          <path
            d="M2 8 L6 4 L10 8 L6 12 Z"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinejoin="bevel"
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
          onChange(e.target.value as "miter" | "round" | "bevel")
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

export default StrokeJoinSelector;
