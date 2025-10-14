import React, { memo, RefObject } from "react";
import { ConnectionConfig } from "../../types";
import ColorPicker from "../ui/ColorPicker";
import OptionSelector from "../ui/OptionSelector";
import RangeSlider from "../ui/RangeSlider";
import TextInput from "../ui/TextInput";

interface LabelTabProps {
  config: ConnectionConfig;
  updateConfig: (updates: Partial<ConnectionConfig>) => void;
  inputRef?: RefObject<HTMLInputElement | null>;
}

const LabelTab: React.FC<LabelTabProps> = memo(
  ({ config, updateConfig, inputRef }) => {
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
        <TextInput
          ref={inputRef}
          value={config.label}
          onChange={(label) => updateConfig({ label })}
          label="Label Text"
          placeholder="Enter label text"
        />

        <ColorPicker
          value={config.labelTextColor}
          colors={textColors}
          onChange={(labelTextColor) => updateConfig({ labelTextColor })}
          label="Text Color"
        />

        <ColorPicker
          value={config.labelBg}
          colors={backgroundColors}
          onChange={(labelBg) => updateConfig({ labelBg })}
          label="Background Color"
        />

        <ColorPicker
          value={config.labelBorderColor}
          colors={borderColors}
          onChange={(labelBorderColor) => updateConfig({ labelBorderColor })}
          label="Border Color"
        />

        <OptionSelector
          value={config.labelBorderWidth}
          options={borderWidthOptions}
          onChange={(labelBorderWidth) => updateConfig({ labelBorderWidth })}
          label="Border Width"
          columns={4}
        />

        <OptionSelector
          value={config.labelPosition}
          options={labelPositionOptions}
          onChange={(labelPosition) => updateConfig({ labelPosition })}
          label="Label Position"
          columns={3}
        />

        <RangeSlider
          value={config.labelOffset}
          min={0}
          max={30}
          label="Label Offset"
          onChange={(labelOffset) => updateConfig({ labelOffset })}
        />

        <RangeSlider
          value={config.labelFontSize}
          min={8}
          max={24}
          label="Font Size"
          onChange={(labelFontSize) => updateConfig({ labelFontSize })}
        />

        <RangeSlider
          value={config.labelBorderRadius}
          min={0}
          max={12}
          label="Border Radius"
          onChange={(labelBorderRadius) => updateConfig({ labelBorderRadius })}
        />

        <RangeSlider
          value={config.labelPadding}
          min={2}
          max={12}
          label="Padding"
          onChange={(labelPadding) => updateConfig({ labelPadding })}
        />
      </div>
    );
  }
);

LabelTab.displayName = "LabelTab";

export default LabelTab;
