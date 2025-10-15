import React from "react";

interface PositionSelectorProps {
  startPosition: "auto" | "top" | "right" | "bottom" | "left";
  endPosition: "auto" | "top" | "right" | "bottom" | "left";
  onStartPositionChange: (
    value: "auto" | "top" | "right" | "bottom" | "left"
  ) => void;
  onEndPositionChange: (
    value: "auto" | "top" | "right" | "bottom" | "left"
  ) => void;
  label: string;
}

const PositionSelector: React.FC<PositionSelectorProps> = ({
  startPosition,
  endPosition,
  onStartPositionChange,
  onEndPositionChange,
  label,
}) => {
  const positions = [
    { value: "auto" as const, label: "Auto" },
    { value: "top" as const, label: "Top" },
    { value: "right" as const, label: "Right" },
    { value: "bottom" as const, label: "Bottom" },
    { value: "left" as const, label: "Left" },
  ];

  const getPositionDot = (position: string, isActive: boolean) => {
    const baseClasses = `absolute w-2 h-2 rounded-full transition-all duration-200 ${
      isActive ? "bg-blue-500" : "bg-gray-300"
    }`;

    switch (position) {
      case "top":
        return (
          <div
            className={`${baseClasses} top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2`}
          />
        );
      case "right":
        return (
          <div
            className={`${baseClasses} top-1/2 right-0 transform translate-x-1/2 -translate-y-1/2`}
          />
        );
      case "bottom":
        return (
          <div
            className={`${baseClasses} bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1/2`}
          />
        );
      case "left":
        return (
          <div
            className={`${baseClasses} top-1/2 left-0 transform -translate-x-1/2 -translate-y-1/2`}
          />
        );
      case "auto":
        return (
          <div
            className={`${baseClasses} top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2`}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-3">
      <label className="block text-[10px] font-semibold text-gray-700">
        {label}
      </label>

      {/* Visual representation with two boxes */}
      <div className="flex items-center justify-center gap-8 p-4 bg-gray-50 rounded-lg border">
        {/* Start Frame */}
        <div className="flex flex-col items-center gap-2">
          <span className="text-xs font-medium text-gray-600">Start</span>
          <div className="relative">
            <div className="w-12 h-8 bg-blue-200 border-2 border-blue-300 rounded relative">
              {getPositionDot(startPosition, true)}
            </div>
          </div>
        </div>

        {/* Arrow */}
        <div className="flex items-center">
          <svg className="w-6 h-4 text-gray-400" viewBox="0 0 24 16">
            <path
              d="M2 8 L18 8 M18 8 L14 4 M18 8 L14 12"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
          </svg>
        </div>

        {/* End Frame */}
        <div className="flex flex-col items-center gap-2">
          <span className="text-xs font-medium text-gray-600">End</span>
          <div className="relative">
            <div className="w-12 h-8 bg-green-200 border-2 border-green-300 rounded relative">
              {getPositionDot(endPosition, true)}
            </div>
          </div>
        </div>
      </div>

      {/* Position Controls */}
      <div className="grid grid-cols-2 gap-4">
        {/* Start Position */}
        <div className="space-y-2">
          <label className="block text-[10px] font-semibold text-gray-600 uppercase tracking-wide">
            Start Position
          </label>
          <select
            value={startPosition}
            onChange={(e) => onStartPositionChange(e.target.value as any)}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {positions.map((pos) => (
              <option key={pos.value} value={pos.value}>
                {pos.label}
              </option>
            ))}
          </select>
        </div>

        {/* End Position */}
        <div className="space-y-2">
          <label className="block text-[10px] font-semibold text-gray-600 uppercase tracking-wide">
            End Position
          </label>
          <select
            value={endPosition}
            onChange={(e) => onEndPositionChange(e.target.value as any)}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {positions.map((pos) => (
              <option key={pos.value} value={pos.value}>
                {pos.label}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
};

export default PositionSelector;
