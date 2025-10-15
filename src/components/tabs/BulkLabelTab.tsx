import React, { memo, RefObject } from "react";
import { ConnectionConfig } from "../../types";
import ColorPicker from "../ui/ColorPicker";
import OptionSelector from "../ui/OptionSelector";
import RangeSlider from "../ui/RangeSlider";
import TextInput from "../ui/TextInput";
import BulkPropertyControl from "../ui/BulkPropertyControl";

interface BulkLabelTabProps {
  config: ConnectionConfig;
  updateConfig: (updates: Partial<ConnectionConfig>) => void;
  mixedPropertyStates: Map<keyof ConnectionConfig, boolean>;
  onApplyToAll: (property: keyof ConnectionConfig, value: any) => Promise<void>;
  inputRef?: RefObject<HTMLInputElement | null>;
  validationErrors?: Record<string, string>;
  isValidating?: boolean;
}

const BulkLabelTab: React.FC<BulkLabelTabProps> = memo(
  ({ config, updateConfig, mixedPropertyStates, onApplyToAll, inputRef, validationErrors = {}, isValidating = false }) => {
    // Ensure mixedPropertyStates is a valid Map
    const safeGetMixedState = (property: keyof ConnectionConfig): boolean => {
      if (!mixedPropertyStates || typeof mixedPropertyStates.get !== 'function') {
        return false;
      }
      return mixedPropertyStates.get(property) || false;
    };
    const textColors = [
      "#333333",
      "#ffffff",
      "#dc3545",
      "#28a745",
      "#1976d2",
      "#ff9800",
    ];

    const backgroundColors = [
      "#ffffff",
      "#f8f9fa",
      "#333333",
      "#1976d2",
      "#28a745",
      "#ff9800",
    ];

    const borderColors = [
      "#e0e0e0",
      "#333333",
      "#dc3545",
      "#28a745",
      "#1976d2",
      "#ff9800",
    ];

    const borderWidthOptions = [
      { value: 0, label: "0" },
      { value: 1, label: "1" },
      { value: 2, label: "2" },
      { value: 3, label: "3" },
    ];

    const labelPositionOptions = [
      { value: "center" as const, label: "Center" },
      { value: "top" as const, label: "Top" },
      { value: "bottom" as const, label: "Bottom" },
    ];

    return (
      <div className="space-y-4">
        <BulkPropertyControl
          label="Label Text"
          isMixed={safeGetMixedState('label')}
          onApplyToAll={() => onApplyToAll('label', config.label)}
        >
          <TextInput
            ref={inputRef}
            value={config.label}
            onChange={(label) => updateConfig({ label })}
            label=""
            placeholder="Enter label text"
          />
        </BulkPropertyControl>

        <BulkPropertyControl
          label="Text Color"
          isMixed={safeGetMixedState('labelTextColor')}
          onApplyToAll={() => onApplyToAll('labelTextColor', config.labelTextColor)}
        >
          <ColorPicker
            value={config.labelTextColor}
            colors={textColors}
            onChange={(labelTextColor) => updateConfig({ labelTextColor })}
            label=""
          />
        </BulkPropertyControl>

        <BulkPropertyControl
          label="Background Color"
          isMixed={safeGetMixedState('labelBg')}
          onApplyToAll={() => onApplyToAll('labelBg', config.labelBg)}
        >
          <ColorPicker
            value={config.labelBg}
            colors={backgroundColors}
            onChange={(labelBg) => updateConfig({ labelBg })}
            label=""
          />
        </BulkPropertyControl>

        <BulkPropertyControl
          label="Border Color"
          isMixed={safeGetMixedState('labelBorderColor')}
          onApplyToAll={() => onApplyToAll('labelBorderColor', config.labelBorderColor)}
        >
          <ColorPicker
            value={config.labelBorderColor}
            colors={borderColors}
            onChange={(labelBorderColor) => updateConfig({ labelBorderColor })}
            label=""
          />
        </BulkPropertyControl>

        <BulkPropertyControl
          label="Border Width"
          isMixed={safeGetMixedState('labelBorderWidth')}
          onApplyToAll={() => onApplyToAll('labelBorderWidth', config.labelBorderWidth)}
        >
          <OptionSelector
            value={config.labelBorderWidth}
            options={borderWidthOptions}
            onChange={(labelBorderWidth) => updateConfig({ labelBorderWidth })}
            label=""
            columns={4}
          />
        </BulkPropertyControl>

        <BulkPropertyControl
          label="Label Position"
          isMixed={safeGetMixedState('labelPosition')}
          onApplyToAll={() => onApplyToAll('labelPosition', config.labelPosition)}
        >
          <OptionSelector
            value={config.labelPosition}
            options={labelPositionOptions}
            onChange={(labelPosition) => updateConfig({ labelPosition })}
            label=""
            columns={3}
          />
        </BulkPropertyControl>

        <BulkPropertyControl
          label="Label Offset"
          isMixed={safeGetMixedState('labelOffset')}
          onApplyToAll={() => onApplyToAll('labelOffset', config.labelOffset)}
        >
          <RangeSlider
            value={config.labelOffset}
            min={0}
            max={30}
            label=""
            onChange={(labelOffset) => updateConfig({ labelOffset })}
          />
        </BulkPropertyControl>

        <BulkPropertyControl
          label="Font Size"
          isMixed={safeGetMixedState('labelFontSize')}
          onApplyToAll={() => onApplyToAll('labelFontSize', config.labelFontSize)}
        >
          <RangeSlider
            value={config.labelFontSize}
            min={8}
            max={24}
            label=""
            onChange={(labelFontSize) => updateConfig({ labelFontSize })}
          />
        </BulkPropertyControl>

        <BulkPropertyControl
          label="Border Radius"
          isMixed={safeGetMixedState('labelBorderRadius')}
          onApplyToAll={() => onApplyToAll('labelBorderRadius', config.labelBorderRadius)}
        >
          <RangeSlider
            value={config.labelBorderRadius}
            min={0}
            max={12}
            label=""
            onChange={(labelBorderRadius) => updateConfig({ labelBorderRadius })}
          />
        </BulkPropertyControl>

        <BulkPropertyControl
          label="Padding"
          isMixed={safeGetMixedState('labelPadding')}
          onApplyToAll={() => onApplyToAll('labelPadding', config.labelPadding)}
        >
          <RangeSlider
            value={config.labelPadding}
            min={2}
            max={12}
            label=""
            onChange={(labelPadding) => updateConfig({ labelPadding })}
          />
        </BulkPropertyControl>
      </div>
    );
  }
);

BulkLabelTab.displayName = "BulkLabelTab";

export default BulkLabelTab;