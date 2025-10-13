import React, { memo } from 'react';
import { ConnectionConfig } from '../../types';
import ColorPicker from '../ui/ColorPicker';
import OptionSelector from '../ui/OptionSelector';
import RangeSlider from '../ui/RangeSlider';
import CheckboxControl from '../ui/CheckboxControl';

interface ArrowTabProps {
  config: ConnectionConfig;
  updateConfig: (updates: Partial<ConnectionConfig>) => void;
}

const ArrowTab: React.FC<ArrowTabProps> = memo(({ config, updateConfig }) => {
  const strokeColors = [
    '#2c2c2c', '#dc3545', '#28a745', '#1976d2', '#ff9800', '#2196f3'
  ];

  const strokeWidthOptions = [
    { value: 1, label: '1', className: 'stroke-width-1' },
    { value: 2, label: '2', className: 'stroke-width-2' },
    { value: 3, label: '3', className: 'stroke-width-3' },
    { value: 4, label: '4', className: 'stroke-width-4' }
  ];

  const strokeStyleOptions = [
    { value: 'solid' as const, label: 'Solid', className: 'stroke-solid' },
    { value: 'dashed' as const, label: 'Dashed', className: 'stroke-dashed' },
    { value: 'dotted' as const, label: 'Dotted', className: 'stroke-dotted' }
  ];

  const sloppinessOptions = [
    { 
      value: 'none' as const, 
      label: 'None',
      icon: <svg className="w-4 h-2"><line x1="2" y1="4" x2="14" y2="4" stroke="currentColor" strokeWidth="1.5" /></svg>
    },
    { 
      value: 'low' as const, 
      label: 'Low',
      icon: <svg className="w-4 h-2"><line x1="2" y1="4" x2="14" y2="4" stroke="currentColor" strokeWidth="1.5" /></svg>
    },
    { 
      value: 'high' as const, 
      label: 'High',
      icon: <svg className="w-4 h-2"><path d="M2,4 Q6,2 10,4 T14,4" stroke="currentColor" strokeWidth="1.5" fill="none" /></svg>
    }
  ];

  const arrowTypeOptions = [
    { 
      value: 'straight' as const, 
      label: 'Straight',
      icon: (
        <svg className="w-4 h-2">
          <line x1="2" y1="4" x2="12" y2="4" stroke="currentColor" strokeWidth="1.5" />
          <polygon points="10,2 12,4 10,6" fill="currentColor" />
        </svg>
      )
    },
    { 
      value: 'curved' as const, 
      label: 'Curved',
      icon: (
        <svg className="w-4 h-2">
          <path d="M2,4 Q7,1 12,4" stroke="currentColor" strokeWidth="1.5" fill="none" />
          <polygon points="10,2 12,4 10,6" fill="currentColor" />
        </svg>
      )
    },
    { 
      value: 'elbow' as const, 
      label: 'Elbow',
      icon: (
        <svg className="w-4 h-2">
          <path d="M2,4 L7,4 L7,2 L12,2" stroke="currentColor" strokeWidth="1.5" fill="none" />
          <polygon points="10,1 12,2 10,3" fill="currentColor" />
        </svg>
      )
    }
  ];

  const arrowheadOptions = [
    { 
      value: 'none' as const, 
      label: 'None',
      icon: <svg className="w-4 h-2"><line x1="2" y1="4" x2="12" y2="4" stroke="currentColor" strokeWidth="1.5" /></svg>
    },
    { 
      value: 'end' as const, 
      label: 'End',
      icon: (
        <svg className="w-4 h-2">
          <line x1="2" y1="4" x2="12" y2="4" stroke="currentColor" strokeWidth="1.5" />
          <polygon points="10,2 12,4 10,6" fill="currentColor" />
        </svg>
      )
    },
    { 
      value: 'both' as const, 
      label: 'Both',
      icon: (
        <svg className="w-4 h-2">
          <line x1="2" y1="4" x2="12" y2="4" stroke="currentColor" strokeWidth="1.5" />
          <polygon points="4,2 2,4 4,6" fill="currentColor" />
          <polygon points="10,2 12,4 10,6" fill="currentColor" />
        </svg>
      )
    }
  ];

  const positionOptions = [
    { value: 'auto' as const, label: 'Auto' },
    { value: 'top' as const, label: 'Top' },
    { value: 'right' as const, label: 'Right' },
    { value: 'bottom' as const, label: 'Bottom' },
    { value: 'left' as const, label: 'Left' }
  ];

  return (
    <div className="space-y-4">
      <ColorPicker
        value={config.color}
        colors={strokeColors}
        onChange={(color) => updateConfig({ color })}
        label="Stroke"
      />

      <OptionSelector
        value={config.strokeWidth}
        options={strokeWidthOptions}
        onChange={(strokeWidth) => updateConfig({ strokeWidth })}
        label="Stroke Width"
        columns={4}
      />

      <OptionSelector
        value={config.strokeStyle}
        options={strokeStyleOptions}
        onChange={(strokeStyle) => updateConfig({ strokeStyle })}
        label="Stroke Style"
        columns={3}
      />

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

      <OptionSelector
        value={config.arrowheads}
        options={arrowheadOptions}
        onChange={(arrowheads) => updateConfig({ arrowheads })}
        label="Arrowheads"
        columns={3}
      />

      <OptionSelector
        value={config.startPosition}
        options={positionOptions}
        onChange={(startPosition) => updateConfig({ startPosition })}
        label="Start Position"
        columns={3}
      />

      <OptionSelector
        value={config.endPosition}
        options={positionOptions}
        onChange={(endPosition) => updateConfig({ endPosition })}
        label="End Position"
        columns={3}
      />

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

      <RangeSlider
        value={config.opacity}
        min={0}
        max={100}
        label="Opacity"
        onChange={(opacity) => updateConfig({ opacity })}
      />
    </div>
  );
});

ArrowTab.displayName = 'ArrowTab';

export default ArrowTab;