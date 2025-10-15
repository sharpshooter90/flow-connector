import React from "react";

interface RangeSliderProps {
  value: number;
  min: number;
  max: number;
  label: string;
  onChange: (value: number) => void;
  showValue?: boolean;
  step?: number;
}

const RangeSlider: React.FC<RangeSliderProps> = ({
  value,
  min,
  max,
  label,
  onChange,
  showValue = true,
  step = 1,
}) => {
  return (
    <div className="space-y-2 relative">
      <label className="block text-[10px] font-semibold text-gray-700 uppercase tracking-wide">
        {label}
      </label>
      <div className="space-y-2">
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider focus:outline-none focus:ring-2 focus:ring-purple-500"
        />
        {showValue && (
          <div className="flex justify-between text-[10px] text-gray-500">
            <span>{min}</span>
            <span className="font-medium text-gray-700">{value}</span>
            <span>{max}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default RangeSlider;
