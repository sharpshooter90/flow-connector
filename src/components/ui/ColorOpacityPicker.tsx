import React, { useState, useEffect } from "react";
import AdvancedColorPicker from "./AdvancedColorPicker";
import { Input } from "./input";

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
  const [hexInput, setHexInput] = useState(
    (value ?? "#000000").replace("#", "")
  );
  const [opacityInput, setOpacityInput] = useState((opacity ?? 100).toString());
  const [showAdvancedPicker, setShowAdvancedPicker] = useState(false);

  const handleHexChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let input = e.target.value.replace("#", "").toUpperCase();

    // Limit to 6 characters and only allow valid hex
    if (input.length <= 6 && /^[0-9A-F]*$/.test(input)) {
      setHexInput(input);

      if (input.length === 6) {
        const newColor = `#${input}`;
        onChange(newColor, opacity ?? 100);
      }
    }
  };

  const handleOpacityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value;
    const numValue = parseInt(input, 10);

    if (!isNaN(numValue) && numValue >= 0 && numValue <= 100) {
      setOpacityInput(input);
      onChange(value ?? "#000000", numValue);
    }
  };

  const handleOpacityBlur = () => {
    const numValue = parseInt(opacityInput, 10);
    if (isNaN(numValue) || numValue < 0) {
      setOpacityInput("0");
      onChange(value ?? "#000000", 0);
    } else if (numValue > 100) {
      setOpacityInput("100");
      onChange(value ?? "#000000", 100);
    }
  };

  // Sync local state with props
  useEffect(() => {
    setHexInput((value ?? "#000000").replace("#", ""));
    setOpacityInput((opacity ?? 100).toString());
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
      <div className="flex items-center bg-gray-100 rounded border border-gray-200 overflow-hidden p-1.5">
        {/* Color Swatch - Clickable to open advanced picker */}
        <button
          className="w-3 h-3 border-r border-gray-200 flex-shrink-0 hover:opacity-80 transition-opacity cursor-pointer"
          style={{ backgroundColor: value ?? "#000000" }}
          onClick={() => setShowAdvancedPicker(true)}
          title="Click to open color picker"
        />

        {/* Hex Input */}
        <div className="flex items-center px-1.5 flex-1">
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

        {/* Opacity Input */}
        <div className="flex items-center px-1.5 min-w-[50px]">
          <input
            type="number"
            value={opacityInput}
            onChange={handleOpacityChange}
            onBlur={handleOpacityBlur}
            min="0"
            max="20"
            step="1"
            className="text-xs px-2 text-left w-[58px]"
          />
          <span className="text-gray-500 text-[10px] ml-1">%</span>
        </div>
      </div>

      {/* Advanced Color Picker Modal */}
      {showAdvancedPicker && (
        <AdvancedColorPicker
          initialColor={value ?? "#000000"}
          initialOpacity={opacity ?? 100}
          onColorChange={handleAdvancedPickerApply}
          onClose={handleAdvancedPickerClose}
        />
      )}
    </div>
  );
};

export default ColorOpacityPicker;
