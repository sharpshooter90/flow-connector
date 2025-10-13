import React from 'react';
import { ConnectionConfig } from '../types';
import TextInput from './ui/TextInput';

interface RightPanelProps {
  config: ConnectionConfig;
  updateConfig: (updates: Partial<ConnectionConfig>) => void;
}

const RightPanel: React.FC<RightPanelProps> = ({ config, updateConfig }) => {
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
        <div className="relative w-60 h-40">
          {/* Frame previews */}
          <div className="absolute top-8 left-8 w-12 h-9 bg-blue-600 rounded border-2 border-blue-700"></div>
          <div className="absolute bottom-8 right-8 w-12 h-9 bg-blue-600 rounded border-2 border-blue-700"></div>
          
          {/* Connection preview */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none">
            <defs>
              <filter id="preview-roughen-low">
                <feTurbulence baseFrequency="0.04" numOctaves="3" result="noise" />
                <feDisplacementMap in="SourceGraphic" in2="noise" scale="0.3" />
              </filter>
              <filter id="preview-roughen-high">
                <feTurbulence baseFrequency="0.08" numOctaves="4" result="noise" />
                <feDisplacementMap in="SourceGraphic" in2="noise" scale="0.8" />
              </filter>
            </defs>
            
            {/* Simple connection line for now */}
            <g>
              <path
                d="M 56 52 L 80 52 L 80 128 L 176 128"
                stroke={config.color}
                strokeWidth={config.strokeWidth}
                strokeDasharray={config.strokeStyle === 'dashed' ? '4,4' : config.strokeStyle === 'dotted' ? '2,2' : 'none'}
                fill="none"
                opacity={config.opacity / 100}
                filter={config.sloppiness === 'low' ? 'url(#preview-roughen-low)' : config.sloppiness === 'high' ? 'url(#preview-roughen-high)' : 'none'}
              />
              
              {/* Arrowhead */}
              {config.arrowheads !== 'none' && (
                <polygon
                  points="173,125 176,128 173,131"
                  fill={config.color}
                  opacity={config.opacity / 100}
                />
              )}
              
              {/* Label */}
              {config.label && (
                <g>
                  <rect
                    x="108"
                    y="118"
                    width={config.label.length * 6 + config.labelPadding * 2}
                    height={config.labelFontSize + config.labelPadding * 2}
                    fill={config.labelBg}
                    stroke={config.labelBorderColor}
                    strokeWidth={config.labelBorderWidth}
                    rx={config.labelBorderRadius}
                  />
                  <text
                    x={108 + config.labelPadding}
                    y={118 + config.labelPadding + config.labelFontSize * 0.8}
                    fontSize={config.labelFontSize}
                    fill={config.labelTextColor}
                    fontFamily="Inter, sans-serif"
                  >
                    {config.label}
                  </text>
                </g>
              )}
            </g>
          </svg>
        </div>
      </div>
    </div>
  );
};

export default RightPanel;