import React, { memo } from "react";
import { ConnectionConfig } from "../../types";
import ColorOpacityPicker from "../ui/ColorOpacityPicker";
import StrokeAlignSelector from "../ui/StrokeAlignSelector";
import StrokeCapSelector from "../ui/StrokeCapSelector";
import StrokeJoinSelector from "../ui/StrokeJoinSelector";
import StartPositionSelector from "../ui/StartPositionSelector";
import EndPositionSelector from "../ui/EndPositionSelector";
import ArrowheadsSelector from "../ui/ArrowheadsSelector";
import OptionSelector from "../ui/OptionSelector";
import RangeSlider from "../ui/RangeSlider";
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

  const strokeStyleOptions = [
    { value: "solid" as const, label: "Solid", className: "stroke-solid" },
    { value: "dashed" as const, label: "Dashed", className: "stroke-dashed" },
    { value: "dotted" as const, label: "Dotted", className: "stroke-dotted" },
  ];

  const sloppinessOptions = [
    {
      value: "none" as const,
      label: "None",
      icon: (
        <svg className="w-4 h-2">
          <line
            x1="2"
            y1="4"
            x2="14"
            y2="4"
            stroke="currentColor"
            strokeWidth="1.5"
          />
        </svg>
      ),
    },
    {
      value: "low" as const,
      label: "Low",
      icon: (
        <svg className="w-4 h-2">
          <line
            x1="2"
            y1="4"
            x2="14"
            y2="4"
            stroke="currentColor"
            strokeWidth="1.5"
          />
        </svg>
      ),
    },
    {
      value: "high" as const,
      label: "High",
      icon: (
        <svg className="w-4 h-2">
          <path
            d="M2,4 Q6,2 10,4 T14,4"
            stroke="currentColor"
            strokeWidth="1.5"
            fill="none"
          />
        </svg>
      ),
    },
  ];

  const arrowTypeOptions = [
    {
      value: "straight" as const,
      label: "Straight",
      icon: (
        <svg className="w-4 h-2">
          <line
            x1="2"
            y1="4"
            x2="12"
            y2="4"
            stroke="currentColor"
            strokeWidth="1.5"
          />
          <polygon points="10,2 12,4 10,6" fill="currentColor" />
        </svg>
      ),
    },
    {
      value: "curved" as const,
      label: "Curved",
      icon: (
        <svg className="w-4 h-2">
          <path
            d="M2,4 Q7,1 12,4"
            stroke="currentColor"
            strokeWidth="1.5"
            fill="none"
          />
          <polygon points="10,2 12,4 10,6" fill="currentColor" />
        </svg>
      ),
    },
    {
      value: "elbow" as const,
      label: "Elbow",
      icon: (
        <svg className="w-4 h-2">
          <path
            d="M2,4 L7,4 L7,2 L12,2"
            stroke="currentColor"
            strokeWidth="1.5"
            fill="none"
          />
          <polygon points="10,1 12,2 10,3" fill="currentColor" />
        </svg>
      ),
    },
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
          <div className="bg-gray-100 border border-gray-200 rounded flex items-center px-3 py-2">
            <svg className="w-4 h-4 mr-2 text-gray-600" viewBox="0 0 16 16">
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
            <span className="text-xs text-gray-700">{config.strokeWidth}</span>
          </div>
        </div>
      </div>

      {/* Stroke Style */}
      <OptionSelector
        value={config.strokeStyle}
        options={strokeStyleOptions}
        onChange={(strokeStyle) => updateConfig({ strokeStyle })}
        label="Stroke Style"
        columns={3}
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

      <OptionSelector
        value={config.sloppiness}
        options={sloppinessOptions}
        onChange={(sloppiness) => updateConfig({ sloppiness })}
        label="Sloppiness"
        columns={3}
      />

      <OptionSelector
        value={config.arrowType}
        options={arrowTypeOptions}
        onChange={(arrowType) => updateConfig({ arrowType })}
        label="Arrow Type"
        columns={3}
      />

      {/* Arrowheads */}
      <ArrowheadsSelector
        value={config.arrowheads}
        onChange={(arrowheads) => updateConfig({ arrowheads })}
        label="Arrowheads"
      />

      {/* Start & End Position */}
      <div className="grid grid-cols-2 gap-3">
        <StartPositionSelector
          value={config.startPosition}
          onChange={(startPosition) => updateConfig({ startPosition })}
          label="Start Position"
        />
        <EndPositionSelector
          value={config.endPosition}
          onChange={(endPosition) => updateConfig({ endPosition })}
          label="End Position"
        />
      </div>

      <RangeSlider
        value={config.connectionOffset}
        min={0}
        max={50}
        label="Connection Offset"
        onChange={(connectionOffset) => updateConfig({ connectionOffset })}
      />

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
