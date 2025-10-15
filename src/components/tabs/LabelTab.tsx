import React, { memo, RefObject } from "react";
import { ConnectionConfig } from "../../types";
import ColorOpacityPicker from "../ui/ColorOpacityPicker";
import BorderWidthSelector from "../ui/BorderWidthSelector";
import LabelPositionSelector from "../ui/LabelPositionSelector";
import FontFamilySelector from "../ui/FontFamilySelector";
import FontWeightSelector from "../ui/FontWeightSelector";
import FontSizeSelector from "../ui/FontSizeSelector";
import TextInput from "../ui/TextInput";

interface LabelTabProps {
  config: ConnectionConfig;
  updateConfig: (updates: Partial<ConnectionConfig>) => void;
  inputRef?: RefObject<HTMLInputElement | null>;
}

const LabelTab: React.FC<LabelTabProps> = memo(
  ({ config, updateConfig, inputRef }) => {
    return (
      <div className="space-y-4">
        <TextInput
          ref={inputRef}
          value={config.label}
          onChange={(label) => updateConfig({ label })}
          label="Label Text"
          placeholder="Enter label text"
        />

        <ColorOpacityPicker
          value={config.labelTextColor}
          opacity={config.labelTextColorOpacity}
          onChange={(labelTextColor, labelTextColorOpacity) =>
            updateConfig({ labelTextColor, labelTextColorOpacity })
          }
          label="Text Color"
        />

        <ColorOpacityPicker
          value={config.labelBg}
          opacity={config.labelBgOpacity}
          onChange={(labelBg, labelBgOpacity) =>
            updateConfig({ labelBg, labelBgOpacity })
          }
          label="Background Color"
        />

        <ColorOpacityPicker
          value={config.labelBorderColor}
          opacity={config.labelBorderColorOpacity}
          onChange={(labelBorderColor, labelBorderColorOpacity) =>
            updateConfig({ labelBorderColor, labelBorderColorOpacity })
          }
          label="Border Color"
        />

        {/* Border Width and Label Position in a row */}
        <div className="grid grid-cols-2 gap-3">
          <BorderWidthSelector
            value={config.labelBorderWidth}
            onChange={(labelBorderWidth) => updateConfig({ labelBorderWidth })}
            label="Border Width"
          />

          <LabelPositionSelector
            value={config.labelPosition}
            onChange={(labelPosition) => updateConfig({ labelPosition })}
            label="Label Position"
          />
        </div>

        {/* Typography Section */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-gray-900">Typography</h3>

          <FontFamilySelector
            value={config.labelFontFamily}
            onChange={(labelFontFamily) => updateConfig({ labelFontFamily })}
            label="Font Family"
          />

          <div className="grid grid-cols-2 gap-3">
            <FontWeightSelector
              value={config.labelFontWeight}
              onChange={(labelFontWeight) => updateConfig({ labelFontWeight })}
              label="Font Weight"
            />
            <FontSizeSelector
              value={config.labelFontSize}
              onChange={(labelFontSize) => updateConfig({ labelFontSize })}
              label="Font Size"
            />
          </div>
        </div>

        {/* Padding and Border Radius in a row */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2 relative">
            <label className="block text-[10px] font-semibold text-gray-700 uppercase tracking-wide">
              Padding
            </label>
            <div className="relative">
              <svg
                className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-600"
                viewBox="0 0 16 16"
              >
                <rect
                  x="2"
                  y="2"
                  width="12"
                  height="12"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                />
                <rect
                  x="4"
                  y="4"
                  width="8"
                  height="8"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1"
                  opacity="0.5"
                />
              </svg>
              <input
                type="number"
                value={config.labelPadding}
                onChange={(e) =>
                  updateConfig({ labelPadding: Number(e.target.value) })
                }
                min="0"
                max="20"
                step="1"
                className="w-full bg-gray-100 border border-gray-200 rounded text-xs px-3 py-2 pl-10 text-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="space-y-2 relative">
            <label className="block text-[10px] font-semibold text-gray-700 uppercase tracking-wide">
              Border Radius
            </label>
            <div className="relative">
              <svg
                className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-600"
                viewBox="0 0 16 16"
              >
                <rect
                  x="2"
                  y="2"
                  width="12"
                  height="12"
                  rx="2"
                  ry="2"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                />
              </svg>
              <input
                type="number"
                value={config.labelBorderRadius}
                onChange={(e) =>
                  updateConfig({ labelBorderRadius: Number(e.target.value) })
                }
                min="0"
                max="20"
                step="1"
                className="w-full bg-gray-100 border border-gray-200 rounded text-xs px-3 py-2 pl-10 text-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>
      </div>
    );
  }
);

LabelTab.displayName = "LabelTab";

export default LabelTab;
