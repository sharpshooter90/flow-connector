import React from "react";

interface StartPositionSelectorProps {
  value: "auto" | "top" | "right" | "bottom" | "left";
  onChange: (value: "auto" | "top" | "right" | "bottom" | "left") => void;
  label: string;
}

const StartPositionSelector: React.FC<StartPositionSelectorProps> = ({
  value,
  onChange,
  label,
}) => {
  const options = [
    {
      value: "auto" as const,
      label: "Auto",
      icon: (
        <svg className="w-4 h-4" viewBox="0 0 16 16">
          <circle cx="8" cy="8" r="2" fill="currentColor" />
          <path
            d="M8 2 L8 6 M8 10 L8 14 M2 8 L6 8 M10 8 L14 8"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
      ),
    },
    {
      value: "top" as const,
      label: "Top",
      icon: (
        <svg className="w-4 h-4" viewBox="0 0 16 16">
          <path
            d="M8 2 L8 8 M8 2 L6 4 M8 2 L10 4"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
      ),
    },
    {
      value: "right" as const,
      label: "Right",
      icon: (
        <svg className="w-4 h-4" viewBox="0 0 16 16">
          <path
            d="M8 8 L14 8 M14 8 L12 6 M14 8 L12 10"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
      ),
    },
    {
      value: "bottom" as const,
      label: "Bottom",
      icon: (
        <svg className="w-4 h-4" viewBox="0 0 16 16">
          <path
            d="M8 8 L8 14 M8 14 L6 12 M8 14 L10 12"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
      ),
    },
    {
      value: "left" as const,
      label: "Left",
      icon: (
        <svg className="w-4 h-4" viewBox="0 0 16 16">
          <path
            d="M8 8 L2 8 M2 8 L4 6 M2 8 L4 10"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
      ),
    },
  ];

  return (
    <div className="space-y-2">
      <label className="block text-[10px] font-semibold text-gray-700 uppercase tracking-wide">
        {label}
      </label>
      <div className="grid grid-cols-5 gap-1">
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

export default StartPositionSelector;
