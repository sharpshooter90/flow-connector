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
import BulkPropertyControl from "../ui/BulkPropertyControl";

interface BulkArrowTabProps {
  config: ConnectionConfig;
  updateConfig: (updates: Partial<ConnectionConfig>) => void;
  mixedPropertyStates: Map<keyof ConnectionConfig, boolean>;
  onApplyToAll: (property: keyof ConnectionConfig, value: any) => Promise<void>;
  validationErrors?: Record<string, string>;
  isValidating?: boolean;
}

const BulkArrowTab: React.FC<BulkArrowTabProps> = memo(({ 
  config, 
  updateConfig, 
  mixedPropertyStates,
  onApplyToAll,
  validationErrors = {},
  isValidating = false
}) => {
  // Ensure mixedPropertyStates is a valid Map
  const safeGetMixedState = (property: keyof ConnectionConfig): boolean => {
    if (!mixedPropertyStates || typeof mixedPropertyStates.get !== 'function') {
      return false;
    }
    return mixedPropertyStates.get(property) || false;
  };
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

  const isColorMixed = safeGetMixedState('color');
  const isOpacityMixed = safeGetMixedState('opacity');
  const isColorOrOpacityMixed = isColorMixed || isOpacityMixed;

  return (
    <div className="space-y-4">
      {/* Combined Color & Opacity */}
      <BulkPropertyControl
        label="Stroke"
        isMixed={isColorOrOpacityMixed}
        onApplyToAll={() => {
          onApplyToAll('color', config.color);
          onApplyToAll('opacity', config.opacity);
        }}
      >
        <ColorOpacityPicker
          value={config.color}
          opacity={config.opacity}
          onChange={(color, opacity) => updateConfig({ color, opacity })}
          label=""
        />
      </BulkPropertyControl>

      {/* Stroke Alignment & Width */}
      <div className="grid grid-cols-2 gap-3">
        <BulkPropertyControl
          label="Stroke Align"
          isMixed={safeGetMixedState('strokeAlign')}
          onApplyToAll={() => onApplyToAll('strokeAlign', config.strokeAlign)}
        >
          <StrokeAlignSelector
            value={config.strokeAlign}
            onChange={(strokeAlign) => updateConfig({ strokeAlign })}
            label=""
          />
        </BulkPropertyControl>
        
        <BulkPropertyControl
          label="Stroke Width"
          isMixed={safeGetMixedState('strokeWidth')}
          onApplyToAll={() => onApplyToAll('strokeWidth', config.strokeWidth)}
        >
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
        </BulkPropertyControl>
      </div>

      {/* Stroke Style */}
      <BulkPropertyControl
        label="Stroke Style"
        isMixed={safeGetMixedState('strokeStyle')}
        onApplyToAll={() => onApplyToAll('strokeStyle', config.strokeStyle)}
      >
        <OptionSelector
          value={config.strokeStyle}
          options={strokeStyleOptions}
          onChange={(strokeStyle) => updateConfig({ strokeStyle })}
          label=""
          columns={3}
        />
      </BulkPropertyControl>

      {/* Stroke Cap & Join */}
      <div className="grid grid-cols-2 gap-3">
        <BulkPropertyControl
          label="Stroke Cap"
          isMixed={safeGetMixedState('strokeCap')}
          onApplyToAll={() => onApplyToAll('strokeCap', config.strokeCap)}
        >
          <StrokeCapSelector
            value={config.strokeCap}
            onChange={(strokeCap) => updateConfig({ strokeCap })}
            label=""
          />
        </BulkPropertyControl>
        
        <BulkPropertyControl
          label="Stroke Join"
          isMixed={safeGetMixedState('strokeJoin')}
          onApplyToAll={() => onApplyToAll('strokeJoin', config.strokeJoin)}
        >
          <StrokeJoinSelector
            value={config.strokeJoin}
            onChange={(strokeJoin) => updateConfig({ strokeJoin })}
            label=""
          />
        </BulkPropertyControl>
      </div>

      <BulkPropertyControl
        label="Sloppiness"
        isMixed={safeGetMixedState('sloppiness')}
        onApplyToAll={() => onApplyToAll('sloppiness', config.sloppiness)}
      >
        <OptionSelector
          value={config.sloppiness}
          options={sloppinessOptions}
          onChange={(sloppiness) => updateConfig({ sloppiness })}
          label=""
          columns={3}
        />
      </BulkPropertyControl>

      <BulkPropertyControl
        label="Arrow Type"
        isMixed={safeGetMixedState('arrowType')}
        onApplyToAll={() => onApplyToAll('arrowType', config.arrowType)}
      >
        <OptionSelector
          value={config.arrowType}
          options={arrowTypeOptions}
          onChange={(arrowType) => updateConfig({ arrowType })}
          label=""
          columns={3}
        />
      </BulkPropertyControl>

      {/* Arrowheads */}
      <BulkPropertyControl
        label="Arrowheads"
        isMixed={safeGetMixedState('arrowheads')}
        onApplyToAll={() => onApplyToAll('arrowheads', config.arrowheads)}
      >
        <ArrowheadsSelector
          value={config.arrowheads}
          onChange={(arrowheads) => updateConfig({ arrowheads })}
          label=""
        />
      </BulkPropertyControl>

      {/* Start & End Position */}
      <div className="grid grid-cols-2 gap-3">
        <BulkPropertyControl
          label="Start Position"
          isMixed={safeGetMixedState('startPosition')}
          onApplyToAll={() => onApplyToAll('startPosition', config.startPosition)}
        >
          <StartPositionSelector
            value={config.startPosition}
            onChange={(startPosition) => updateConfig({ startPosition })}
            label=""
          />
        </BulkPropertyControl>
        
        <BulkPropertyControl
          label="End Position"
          isMixed={safeGetMixedState('endPosition')}
          onApplyToAll={() => onApplyToAll('endPosition', config.endPosition)}
        >
          <EndPositionSelector
            value={config.endPosition}
            onChange={(endPosition) => updateConfig({ endPosition })}
            label=""
          />
        </BulkPropertyControl>
      </div>

      <BulkPropertyControl
        label="Connection Offset"
        isMixed={safeGetMixedState('connectionOffset')}
        onApplyToAll={() => onApplyToAll('connectionOffset', config.connectionOffset)}
      >
        <RangeSlider
          value={config.connectionOffset}
          min={0}
          max={50}
          label=""
          onChange={(connectionOffset) => updateConfig({ connectionOffset })}
        />
      </BulkPropertyControl>

      <BulkPropertyControl
        label="Avoid frame overlap"
        isMixed={safeGetMixedState('avoidOverlap')}
        onApplyToAll={() => onApplyToAll('avoidOverlap', config.avoidOverlap)}
        showApplyToAll={false}
      >
        <CheckboxControl
          checked={config.avoidOverlap}
          onChange={(avoidOverlap) => updateConfig({ avoidOverlap })}
          label="Avoid frame overlap"
        />
      </BulkPropertyControl>
    </div>
  );
});

BulkArrowTab.displayName = "BulkArrowTab";

export default BulkArrowTab;