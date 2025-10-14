import React from "react";

interface ArrowheadsSelectorProps {
  value: "none" | "end" | "both";
  onChange: (value: "none" | "end" | "both") => void;
  label: string;
}

const ArrowheadsSelector: React.FC<ArrowheadsSelectorProps> = ({
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
            strokeWidth="1.5"
          />
        </svg>
      ),
    },
    {
      value: "end" as const,
      label: "End",
      icon: (
        <svg className="w-4 h-4" viewBox="0 0 16 16">
          <line
            x1="2"
            y1="8"
            x2="12"
            y2="8"
            stroke="currentColor"
            strokeWidth="1.5"
          />
          <polygon points="10,6 12,8 10,10" fill="currentColor" />
        </svg>
      ),
    },
    {
      value: "both" as const,
      label: "Both",
      icon: (
        <svg className="w-4 h-4" viewBox="0 0 16 16">
          <line
            x1="4"
            y1="8"
            x2="12"
            y2="8"
            stroke="currentColor"
            strokeWidth="1.5"
          />
          <polygon points="4,6 2,8 4,10" fill="currentColor" />
          <polygon points="12,6 14,8 12,10" fill="currentColor" />
        </svg>
      ),
    },
  ];

  return (
    <div className="space-y-2">
      <label className="block text-[10px] font-semibold text-gray-700 uppercase tracking-wide">
        {label}
      </label>
      <div className="grid grid-cols-3 gap-1">
        {options.map((option) => (
          <button
            key={option.value}
            onClick={() => onChange(option.value)}
            className={`
              p-2 rounded-md border-2 text-[10px] font-medium shadow-sm transition-all duration-200
              flex flex-col items-center justify-center min-h-[48px] relative
              ${
                value === option.value
                  ? "border-blue-400 bg-blue-100 text-blue-900 shadow-md"
                  : "border-gray-300 bg-gray-200 text-gray-400 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700"
              }
            `}
            title={option.label}
          >
            <div className="flex items-center justify-center mb-1">
              {option.icon}
            </div>
            <span className="text-[10px] font-medium">{option.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default ArrowheadsSelector;
