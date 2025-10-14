import React from "react";

interface StrokeAlignSelectorProps {
  value: "center" | "inside" | "outside";
  onChange: (value: "center" | "inside" | "outside") => void;
  label: string;
}

const StrokeAlignSelector: React.FC<StrokeAlignSelectorProps> = ({
  value,
  onChange,
  label,
}) => {
  const options = [
    {
      value: "inside" as const,
      label: "Inside",
      icon: (
        <svg className="w-4 h-4" viewBox="0 0 16 16">
          <rect
            x="2"
            y="6"
            width="12"
            height="4"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
          />
          <rect
            x="1"
            y="5"
            width="14"
            height="6"
            fill="none"
            stroke="currentColor"
            strokeWidth="0.5"
            opacity="0.3"
          />
        </svg>
      ),
    },
    {
      value: "center" as const,
      label: "Center",
      icon: (
        <svg className="w-4 h-4" viewBox="0 0 16 16">
          <rect
            x="1"
            y="5"
            width="14"
            height="6"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
          />
        </svg>
      ),
    },
    {
      value: "outside" as const,
      label: "Outside",
      icon: (
        <svg className="w-4 h-4" viewBox="0 0 16 16">
          <rect
            x="1"
            y="5"
            width="14"
            height="6"
            fill="none"
            stroke="currentColor"
            strokeWidth="0.5"
            opacity="0.3"
          />
          <rect
            x="2"
            y="6"
            width="12"
            height="4"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
          />
        </svg>
      ),
    },
  ];

  return (
    <div className="space-y-2">
      <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wide">
        {label}
      </label>
      <select
        value={value}
        onChange={(e) =>
          onChange(e.target.value as "center" | "inside" | "outside")
        }
        className="w-full bg-gray-100 border border-gray-200 rounded text-sm px-3 py-2 text-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
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

export default StrokeAlignSelector;
