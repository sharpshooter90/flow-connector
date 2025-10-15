import React from "react";

interface ColorPickerProps {
  value: string;
  colors: string[];
  onChange: (color: string) => void;
  label: string;
}

const ColorPicker: React.FC<ColorPickerProps> = ({
  value,
  colors,
  onChange,
  label,
}) => {
  return (
    <div className="space-y-2 relative">
      <label className="block text-[10px] font-semibold text-gray-700">
        {label}
      </label>
      <div className="grid grid-cols-6 gap-1">
        {colors.map((color) => (
          <button
            key={color}
            onClick={() => onChange(color)}
            className={`w-6 h-6 rounded border-2 transition-all hover:scale-110 ${
              value === color
                ? "border-purple-500 scale-110 shadow-md"
                : "border-transparent hover:border-gray-300"
            }`}
            style={{ backgroundColor: color }}
            title={color}
          />
        ))}
      </div>
    </div>
  );
};

export default ColorPicker;
