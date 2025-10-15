import React, { memo } from "react";
import { ConnectionConfig } from "../../types";
import ColorOpacityPicker from "../ui/ColorOpacityPicker";
import StrokeAlignSelector from "../ui/StrokeAlignSelector";
import StrokeStyleSelector from "../ui/StrokeStyleSelector";
import StrokeCapSelector from "../ui/StrokeCapSelector";
import StrokeJoinSelector from "../ui/StrokeJoinSelector";
import PositionSelector from "../ui/PositionSelector";
import ArrowheadsSelector from "../ui/ArrowheadsSelector";
import SloppinessSelector from "../ui/SloppinessSelector";
import ArrowTypeSelector from "../ui/ArrowTypeSelector";
import CheckboxControl from "../ui/CheckboxControl";

interface ArrowTabProps {
  config: ConnectionConfig;
  updateConfig: (updates: Partial<ConnectionConfig>) => void;
}

const ArrowTab: React.FC<ArrowTabProps> = memo(({ config, updateConfig }) => {
  const strokeWidthOptions = [
    { value: 1, label: "1", className: "stroke-width-1" },
    { value: 2, label: "2", className: "stroke-width-2" },
    { value: 3, label: "3", className: "stroke-width-3" },
    { value: 4, label: "4", className: "stroke-width-4" },
  ];

  return (
    <div className="space-y-4">
      {/* Combined Color & Opacity */}
      <ColorOpacityPicker
        value={config.color}
        opacity={config.opacity}
        onChange={(color, opacity) => updateConfig({ color, opacity })}
        label="Stroke"
      />

      {/* Stroke Alignment & Width */}
      <div className="grid grid-cols-2 gap-3">
        <StrokeAlignSelector
          value={config.strokeAlign}
          onChange={(strokeAlign) => updateConfig({ strokeAlign })}
          label="Stroke Align"
        />
        <div className="space-y-2">
          <label className="block text-[10px] font-semibold text-gray-700 uppercase tracking-wide">
            Stroke Width
          </label>
          <div className="relative">
            <svg
              className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-600"
              viewBox="0 0 16 16"
            >
              <line
                x1="2"
                y1="4"
                x2="14"
                y2="4"
                stroke="currentColor"
                strokeWidth="1.5"
              />
              <line
                x1="2"
                y1="8"
                x2="14"
                y2="8"
                stroke="currentColor"
                strokeWidth="1.5"
              />
              <line
                x1="2"
                y1="12"
                x2="14"
                y2="12"
                stroke="currentColor"
                strokeWidth="1.5"
              />
            </svg>
            <input
              type="number"
              value={config.strokeWidth}
              onChange={(e) =>
                updateConfig({ strokeWidth: Number(e.target.value) })
              }
              min="1"
              max="20"
              step="1"
              className="w-full bg-gray-100 border border-gray-200 rounded text-xs px-3 py-2 pl-10 text-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* Stroke Style */}
      <StrokeStyleSelector
        value={config.strokeStyle}
        onChange={(strokeStyle) => updateConfig({ strokeStyle })}
        label="Stroke Style"
      />

      {/* Stroke Cap & Join */}
      <div className="grid grid-cols-2 gap-3">
        <StrokeCapSelector
          value={config.strokeCap}
          onChange={(strokeCap) => updateConfig({ strokeCap })}
          label="Stroke Cap"
        />
        <StrokeJoinSelector
          value={config.strokeJoin}
          onChange={(strokeJoin) => updateConfig({ strokeJoin })}
          label="Stroke Join"
        />
      </div>

      {/* Sloppiness, Arrow Type, and Arrowheads in a row */}
      <div className="grid grid-cols-3 gap-3">
        <SloppinessSelector
          value={config.sloppiness}
          onChange={(sloppiness) => updateConfig({ sloppiness })}
          label="Sloppiness"
        />
        <ArrowTypeSelector
          value={config.arrowType}
          onChange={(arrowType) => updateConfig({ arrowType })}
          label="Arrow Type"
        />
        <ArrowheadsSelector
          value={config.arrowheads}
          onChange={(arrowheads) => updateConfig({ arrowheads })}
          label="Arrowheads"
        />
      </div>

      {/* Start & End Position */}
      <PositionSelector
        startPosition={config.startPosition}
        endPosition={config.endPosition}
        onStartPositionChange={(startPosition) =>
          updateConfig({ startPosition })
        }
        onEndPositionChange={(endPosition) => updateConfig({ endPosition })}
        label="Connection Points"
      />

      <div className="space-y-2 relative">
        <label className="block text-[10px] font-semibold text-gray-700 uppercase tracking-wide">
          Connection Offset
        </label>
        <div className="relative">
          <svg
            className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-600"
            viewBox="0 0 16 16"
          >
            <line
              x1="2"
              y1="8"
              x2="14"
              y2="8"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
            <line
              x1="8"
              y1="2"
              x2="8"
              y2="14"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
            <circle
              cx="8"
              cy="8"
              r="2"
              fill="none"
              stroke="currentColor"
              strokeWidth="1"
            />
          </svg>
          <input
            type="number"
            value={config.connectionOffset}
            onChange={(e) =>
              updateConfig({ connectionOffset: Number(e.target.value) })
            }
            min="0"
            max="50"
            step="1"
            className="w-full bg-gray-100 border border-gray-200 rounded text-xs px-3 py-2 pl-10 text-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
        </div>
      </div>

      <CheckboxControl
        checked={config.avoidOverlap}
        onChange={(avoidOverlap) => updateConfig({ avoidOverlap })}
        label="Avoid frame overlap"
      />
    </div>
  );
});

ArrowTab.displayName = "ArrowTab";

export default ArrowTab;
