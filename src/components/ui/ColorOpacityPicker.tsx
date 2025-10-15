import React, { useState, useEffect } from "react";
import AdvancedColorPicker from "./AdvancedColorPicker";

interface ColorOpacityPickerProps {
  value: string;
  opacity: number;
  onChange: (color: string, opacity: number) => void;
  label: string;
}

const ColorOpacityPicker: React.FC<ColorOpacityPickerProps> = ({
  value,
  opacity,
  onChange,
  label,
}) => {
  const [hexInput, setHexInput] = useState(value.replace("#", ""));
  const [opacityInput, setOpacityInput] = useState(opacity.toString());
  const [showAdvancedPicker, setShowAdvancedPicker] = useState(false);

  const handleHexChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let input = e.target.value.replace("#", "").toUpperCase();

    // Limit to 6 characters and only allow valid hex
    if (input.length <= 6 && /^[0-9A-F]*$/.test(input)) {
      setHexInput(input);

      if (input.length === 6) {
        const newColor = `#${input}`;
        onChange(newColor, opacity);
      }
    }
  };

  const handleOpacityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value;
    const numValue = parseInt(input, 10);

    if (!isNaN(numValue) && numValue >= 0 && numValue <= 100) {
      setOpacityInput(input);
      onChange(value, numValue);
    }
  };

  const handleOpacityBlur = () => {
    const numValue = parseInt(opacityInput, 10);
    if (isNaN(numValue) || numValue < 0) {
      setOpacityInput("0");
      onChange(value, 0);
    } else if (numValue > 100) {
      setOpacityInput("100");
      onChange(value, 100);
    }
  };

  // Sync local state with props
  useEffect(() => {
    setHexInput(value.replace("#", ""));
    setOpacityInput(opacity.toString());
  }, [value, opacity]);

  // Handle advanced picker
  const handleAdvancedPickerClose = () => {
    setShowAdvancedPicker(false);
  };

  const handleAdvancedPickerApply = (newColor: string, newOpacity: number) => {
    onChange(newColor, newOpacity);
    setShowAdvancedPicker(false);
  };

  return (
    <div className="space-y-2">
      <label className="block text-[10px] font-semibold text-gray-700">
        {label}
      </label>
      <div className="flex items-center bg-gray-100 rounded border border-gray-200 overflow-hidden">
        {/* Color Swatch - Clickable to open advanced picker */}
        <button
          className="w-5 h-5 border-r border-gray-200 flex-shrink-0 hover:opacity-80 transition-opacity cursor-pointer"
          style={{ backgroundColor: value }}
          onClick={() => setShowAdvancedPicker(true)}
          title="Click to open color picker"
        />

        {/* Hex Input */}
        <div className="flex items-center px-1.5 py-1 flex-1">
          <span className="text-gray-500 text-[10px] mr-1">#</span>
          <input
            type="text"
            value={hexInput}
            onChange={handleHexChange}
            className="bg-transparent border-none outline-none text-xs font-mono text-gray-700 w-full"
            placeholder="FF9800"
            maxLength={6}
          />
        </div>

        {/* Separator */}
        <div className="w-px h-5 bg-gray-200" />

        {/* Opacity Input */}
        <div className="flex items-center px-1.5 py-1 min-w-[50px]">
          <input
            type="text"
            value={opacityInput}
            onChange={handleOpacityChange}
            onBlur={handleOpacityBlur}
            className="bg-transparent border-none outline-none text-xs text-gray-700 w-full text-right"
            placeholder="100"
          />
          <span className="text-gray-500 text-[10px] ml-1">%</span>
        </div>
      </div>

      {/* Advanced Color Picker Modal */}
      {showAdvancedPicker && (
        <AdvancedColorPicker
          initialColor={value}
          initialOpacity={opacity}
          onColorChange={handleAdvancedPickerApply}
          onClose={handleAdvancedPickerClose}
        />
      )}
    </div>
  );
};

export default ColorOpacityPicker;
