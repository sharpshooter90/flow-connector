import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  hexToRgb,
  rgbToHex,
  rgbToHsv,
  hsvToRgb,
  getRecentColors,
  saveRecentColor,
} from "../../utils/colorUtils";

interface AdvancedColorPickerProps {
  initialColor: string;
  initialOpacity: number;
  onColorChange: (color: string, opacity: number) => void;
  onClose: () => void;
}

interface ColorPickerState {
  hue: number;
  saturation: number;
  brightness: number;
  opacity: number;
  hex: string;
  format: "hex" | "rgb" | "hsl";
}

const AdvancedColorPicker: React.FC<AdvancedColorPickerProps> = ({
  initialColor,
  initialOpacity,
  onColorChange,
  onClose,
}) => {
  const [state, setState] = useState<ColorPickerState>(() => {
    const rgb = hexToRgb(initialColor);
    const hsv = rgbToHsv(rgb.r, rgb.g, rgb.b);
    return {
      hue: hsv.h,
      saturation: hsv.s,
      brightness: hsv.v,
      opacity: initialOpacity,
      hex: initialColor,
      format: "hex",
    };
  });

  const [recentColors] = useState<string[]>(getRecentColors());
  const [isDragging, setIsDragging] = useState<
    "hue" | "saturation" | "opacity" | null
  >(null);

  const squareRef = useRef<HTMLDivElement>(null);
  const hueRef = useRef<HTMLDivElement>(null);
  const opacityRef = useRef<HTMLDivElement>(null);

  // Update hex when HSV changes
  useEffect(() => {
    const rgb = hsvToRgb(state.hue, state.saturation, state.brightness);
    const newHex = rgbToHex(rgb.r, rgb.g, rgb.b);
    setState((prev) => ({ ...prev, hex: newHex }));
  }, [state.hue, state.saturation, state.brightness]);

  // Handle color square interaction
  const handleSquareMouseDown = useCallback((e: React.MouseEvent) => {
    if (!squareRef.current) return;

    setIsDragging("saturation");
    const rect = squareRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(rect.width, e.clientX - rect.left));
    const y = Math.max(0, Math.min(rect.height, e.clientY - rect.top));

    const saturation = Math.round((x / rect.width) * 100);
    const brightness = Math.round(100 - (y / rect.height) * 100);

    setState((prev) => ({ ...prev, saturation, brightness }));
  }, []);

  const handleSquareMouseMove = useCallback(
    (e: MouseEvent) => {
      if (isDragging !== "saturation" || !squareRef.current) return;

      const rect = squareRef.current.getBoundingClientRect();
      const x = Math.max(0, Math.min(rect.width, e.clientX - rect.left));
      const y = Math.max(0, Math.min(rect.height, e.clientY - rect.top));

      const saturation = Math.round((x / rect.width) * 100);
      const brightness = Math.round(100 - (y / rect.height) * 100);

      setState((prev) => ({ ...prev, saturation, brightness }));
    },
    [isDragging]
  );

  // Handle hue slider interaction
  const handleHueMouseDown = useCallback((e: React.MouseEvent) => {
    if (!hueRef.current) return;

    setIsDragging("hue");
    const rect = hueRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(rect.width, e.clientX - rect.left));
    const hue = Math.round((x / rect.width) * 360);

    setState((prev) => ({ ...prev, hue }));
  }, []);

  const handleHueMouseMove = useCallback(
    (e: MouseEvent) => {
      if (isDragging !== "hue" || !hueRef.current) return;

      const rect = hueRef.current.getBoundingClientRect();
      const x = Math.max(0, Math.min(rect.width, e.clientX - rect.left));
      const hue = Math.round((x / rect.width) * 360);

      setState((prev) => ({ ...prev, hue }));
    },
    [isDragging]
  );

  // Handle opacity slider interaction
  const handleOpacityMouseDown = useCallback((e: React.MouseEvent) => {
    if (!opacityRef.current) return;

    setIsDragging("opacity");
    const rect = opacityRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(rect.width, e.clientX - rect.left));
    const opacity = Math.round((x / rect.width) * 100);

    setState((prev) => ({ ...prev, opacity }));
  }, []);

  const handleOpacityMouseMove = useCallback(
    (e: MouseEvent) => {
      if (isDragging !== "opacity" || !opacityRef.current) return;

      const rect = opacityRef.current.getBoundingClientRect();
      const x = Math.max(0, Math.min(rect.width, e.clientX - rect.left));
      const opacity = Math.round((x / rect.width) * 100);

      setState((prev) => ({ ...prev, opacity }));
    },
    [isDragging]
  );

  // Mouse event handlers
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      handleSquareMouseMove(e);
      handleHueMouseMove(e);
      handleOpacityMouseMove(e);
    };

    const handleMouseUp = () => {
      setIsDragging(null);
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    }

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [
    isDragging,
    handleSquareMouseMove,
    handleHueMouseMove,
    handleOpacityMouseMove,
    onClose,
  ]);

  // Handle hex input
  const handleHexChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      let value = e.target.value.replace("#", "").toUpperCase();

      if (value.length <= 6 && /^[0-9A-F]*$/.test(value)) {
        if (value.length === 6) {
          const rgb = hexToRgb(`#${value}`);
          const hsv = rgbToHsv(rgb.r, rgb.g, rgb.b);
          setState((prev) => ({
            ...prev,
            hue: hsv.h,
            saturation: hsv.s,
            brightness: hsv.v,
            hex: `#${value}`,
          }));
        }
      }
    },
    []
  );

  // Handle opacity input
  const handleOpacityInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = parseInt(e.target.value, 10);
      if (!isNaN(value) && value >= 0 && value <= 100) {
        setState((prev) => ({ ...prev, opacity: value }));
      }
    },
    []
  );

  // Handle recent color selection
  const handleRecentColorSelect = useCallback((color: string) => {
    const rgb = hexToRgb(color);
    const hsv = rgbToHsv(rgb.r, rgb.g, rgb.b);
    setState((prev) => ({
      ...prev,
      hue: hsv.h,
      saturation: hsv.s,
      brightness: hsv.v,
      hex: color,
    }));
  }, []);

  // Apply color and close
  const handleApply = useCallback(() => {
    saveRecentColor(state.hex);
    onColorChange(state.hex, state.opacity);
    onClose();
  }, [state.hex, state.opacity, onColorChange, onClose]);

  // Calculate positions for handles
  const squareHandleStyle = {
    left: `${state.saturation}%`,
    top: `${100 - state.brightness}%`,
  };

  const hueHandleStyle = {
    left: `${(state.hue / 360) * 100}%`,
  };

  const opacityHandleStyle = {
    left: `${state.opacity}%`,
  };

  // Current color for square background
  const hueColor = `hsl(${state.hue}, 100%, 50%)`;

  return (
    <div
      className="fixed inset-0 flex items-center justify-start pl-4 left-[-340px] z-50"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg shadow-xl p-5 w-80"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="space-y-4">
          {/* Main color selection square */}
          <div className="relative">
            <div
              ref={squareRef}
              className="w-full h-48 rounded border border-gray-300 cursor-crosshair relative overflow-hidden"
              style={{
                background: `linear-gradient(to right, white, ${hueColor}), linear-gradient(to bottom, transparent, black)`,
                backgroundBlendMode: "multiply",
              }}
              onMouseDown={handleSquareMouseDown}
            >
              <div
                className="absolute w-4 h-4 bg-white border-2 border-gray-800 rounded-full transform -translate-x-1/2 -translate-y-1/2 pointer-events-none shadow-lg"
                style={squareHandleStyle}
              />
            </div>
          </div>

          {/* Hue slider */}
          <div className="relative">
            <div className="flex items-center space-x-3">
              <div
                ref={hueRef}
                className="flex-1 h-4 rounded border border-gray-300 cursor-pointer relative"
                style={{
                  background:
                    "linear-gradient(to right, #ff0000, #ffff00, #00ff00, #00ffff, #0000ff, #ff00ff, #ff0000)",
                }}
                onMouseDown={handleHueMouseDown}
              >
                <div
                  className="absolute w-4 h-4 bg-white border-2 border-gray-800 rounded-full transform -translate-x-1/2 -translate-y-1/2 pointer-events-none shadow-lg top-1/2"
                  style={hueHandleStyle}
                />
              </div>
            </div>
          </div>

          {/* Opacity slider */}
          <div className="relative">
            <div
              ref={opacityRef}
              className="w-full h-4 rounded border border-gray-300 cursor-pointer relative overflow-hidden"
              style={{
                backgroundImage: `
                  linear-gradient(to right, ${state.hex}00, ${state.hex}ff),
                  conic-gradient(#ccc 0deg 90deg, #fff 90deg 180deg, #ccc 180deg 270deg, #fff 270deg 360deg)
                `,
                backgroundSize: "100% 100%, 8px 8px",
                backgroundPosition: "0 0, 0 0",
              }}
              onMouseDown={handleOpacityMouseDown}
            >
              <div
                className="absolute w-4 h-4 bg-white border-2 border-gray-800 rounded-full transform -translate-x-1/2 -translate-y-1/2 pointer-events-none shadow-lg top-1/2"
                style={opacityHandleStyle}
              />
            </div>
          </div>

          {/* Color input fields */}
          <div className="flex items-center space-x-2">
            <select
              value={state.format}
              onChange={(e) =>
                setState((prev) => ({
                  ...prev,
                  format: e.target.value as "hex" | "rgb" | "hsl",
                }))
              }
              className="px-3 py-2 border border-gray-300 rounded text-sm bg-white"
            >
              <option value="hex">Hex</option>
              <option value="rgb">RGB</option>
              <option value="hsl">HSL</option>
            </select>

            <input
              type="text"
              value={state.hex.replace("#", "")}
              onChange={handleHexChange}
              className="flex-1 w-full px-3 py-2 border border-gray-300 rounded text-sm font-mono bg-white"
              placeholder="FFFFFF"
              maxLength={6}
            />

            <div className="flex items-center">
              <input
                type="number"
                min="0"
                max="100"
                value={state.opacity}
                onChange={handleOpacityInputChange}
                className="w-16 px-2 py-2 border border-gray-300 rounded text-sm text-center bg-white"
                placeholder="100"
              />
              <span className="text-sm text-gray-500 ml-1">%</span>
            </div>
          </div>

          {/* Recent colors */}
          {recentColors.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">
                  Recent colors
                </span>
                <svg
                  className="w-4 h-4 text-gray-500"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <polyline points="6,9 12,15 18,9" />
                </svg>
              </div>
              <div className="grid grid-cols-8 gap-1.5">
                {recentColors.slice(0, 16).map((color, index) => (
                  <button
                    key={index}
                    onClick={() => handleRecentColorSelect(color)}
                    className="w-6 h-6 rounded border border-gray-300 hover:border-gray-400 transition-colors"
                    style={{ backgroundColor: color }}
                    title={color}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex justify-end space-x-3 pt-4">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleApply}
              className="px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
            >
              Apply
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdvancedColorPicker;
