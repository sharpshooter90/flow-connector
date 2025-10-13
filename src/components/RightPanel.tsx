import React, { useMemo } from 'react';
import { ConnectionConfig } from '../types';
import TextInput from './ui/TextInput';
import { buildPreviewGeometry } from '../utils/previewConnection';

interface RightPanelProps {
  config: ConnectionConfig;
  updateConfig: (updates: Partial<ConnectionConfig>) => void;
}

const RightPanel: React.FC<RightPanelProps> = ({ config, updateConfig }) => {
  const preview = useMemo(() => buildPreviewGeometry(config), [config]);

  return (
    <div className="flex-1 p-4 flex flex-col">
      {/* Preview Header */}
      <div className="mb-4">
        <h3 className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-3">
          Preview
        </h3>
        <TextInput
          value={config.label}
          onChange={(label) => updateConfig({ label })}
          label="Label Text"
          placeholder="Label Text"
        />
      </div>

      {/* Preview Container */}
      <div className="flex-1 bg-white rounded-lg border border-gray-200 p-5 flex items-center justify-center">
        <div
          className="relative"
          style={{ width: preview.canvas.width, height: preview.canvas.height }}
        >
          {preview.frames.map((frame, index) => (
            <div
              key={index}
              className="absolute rounded border-2"
              style={{
                left: frame.x,
                top: frame.y,
                width: frame.width,
                height: frame.height,
                backgroundColor: '#2563eb',
                borderColor: '#1d4ed8'
              }}
            />
          ))}

          <svg
            className="absolute inset-0 w-full h-full pointer-events-none"
            viewBox={`0 0 ${preview.canvas.width} ${preview.canvas.height}`}
          >
            <path
              d={preview.path}
              stroke={preview.color}
              strokeWidth={preview.strokeWidth}
              strokeDasharray={preview.strokeDasharray}
              fill="none"
              opacity={preview.opacity}
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {preview.arrowheads.map((arrow) => (
              <polygon
                key={arrow.type}
                points={arrow.points}
                fill={preview.color}
                opacity={preview.opacity}
              />
            ))}

            {preview.label && (
              <g>
                <rect
                  x={preview.label.rect.x}
                  y={preview.label.rect.y}
                  width={preview.label.rect.width}
                  height={preview.label.rect.height}
                  fill={preview.label.background}
                  stroke={preview.label.borderWidth > 0 ? preview.label.borderColor : 'none'}
                  strokeWidth={preview.label.borderWidth}
                  rx={preview.label.borderRadius}
                  ry={preview.label.borderRadius}
                />
                <text
                  x={preview.label.rect.x + preview.label.padding}
                  y={preview.label.rect.y + preview.label.rect.height / 2}
                  fontSize={preview.label.fontSize}
                  fill={preview.label.textColor}
                  fontFamily="Inter, sans-serif"
                  dominantBaseline="middle"
                >
                  {preview.label.text}
                </text>
              </g>
            )}
          </svg>
        </div>
      </div>
    </div>
  );
};

export default RightPanel;
