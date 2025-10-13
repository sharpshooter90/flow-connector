# Design Document

## Overview

This design outlines the conversion of the Flow Connector Figma plugin UI from vanilla HTML/CSS/JavaScript to React.js. The plugin will maintain its existing Figma plugin architecture with `code.ts` running in Figma's sandbox and the UI running in an iframe, but the UI will be rebuilt using React components for better maintainability and developer experience.

## Architecture

### High-Level Architecture

The plugin maintains the standard Figma plugin architecture:

```
┌─────────────────────────────────────────┐
│ Figma Sandbox (code.ts)                 │
│ - Connection logic                      │
│ - Frame selection handling              │
│ - Vector path generation                │
│ - Plugin data storage                   │
└─────────────────┬───────────────────────┘
                  │ postMessage API
┌─────────────────▼───────────────────────┐
│ UI iframe (React App)                   │
│ - React components                      │
│ - State management                      │
│ - User interactions                     │
│ - Live preview                          │
└─────────────────────────────────────────┘
```

### Build System Architecture

```
Source Files:
├── src/
│   ├── components/          # React components
│   ├── hooks/              # Custom React hooks
│   ├── types/              # TypeScript interfaces
│   ├── utils/              # Utility functions
│   └── App.tsx             # Main React app
├── code.ts                 # Figma sandbox code (unchanged)
└── manifest.json           # Plugin manifest (unchanged)

Build Output:
├── code.js                 # Compiled sandbox code
├── ui.html                 # Single HTML file with bundled React
└── manifest.json           # Plugin manifest
```

## Components and Interfaces

### Component Hierarchy

```
App
├── MainContainer
│   ├── LeftPanel
│   │   ├── Header
│   │   ├── StatusDisplay
│   │   ├── GlobalControls (checkboxes)
│   │   ├── TabNavigation
│   │   ├── TabContent
│   │   │   ├── ArrowTab
│   │   │   │   ├── ColorPicker
│   │   │   │   ├── StrokeWidthSelector
│   │   │   │   ├── StrokeStyleSelector
│   │   │   │   ├── SloppinessSelector
│   │   │   │   ├── ArrowTypeSelector
│   │   │   │   ├── ArrowheadSelector
│   │   │   │   ├── PositionSelector
│   │   │   │   ├── RangeSlider (offset, opacity)
│   │   │   │   └── CheckboxControl (avoid overlap)
│   │   │   └── LabelTab
│   │   │       ├── ColorPicker (text, bg, border)
│   │   │       ├── BorderWidthSelector
│   │   │       ├── LabelPositionSelector
│   │   │       └── RangeSlider (offset, font size, etc.)
│   │   └── ButtonGroup
│   └── RightPanel
│       ├── PreviewHeader
│       │   └── LabelInput
│       └── PreviewContainer
│           └── ConnectionPreview
└── MessageHandler (for Figma communication)
```

### Key Component Interfaces

```typescript
// Main app state interface
interface AppState {
  config: ConnectionConfig;
  status: PluginStatus;
  selectedConnectionId: string | null;
  isEditingConnection: boolean;
  frameCount: number;
  connectionCount: number;
}

// Component props interfaces
interface ColorPickerProps {
  value: string;
  colors: string[];
  onChange: (color: string) => void;
  label: string;
}

interface RangeSliderProps {
  value: number;
  min: number;
  max: number;
  label: string;
  onChange: (value: number) => void;
  showValue?: boolean;
}

interface OptionSelectorProps<T> {
  value: T;
  options: Array<{ value: T; label: string; icon?: React.ReactNode }>;
  onChange: (value: T) => void;
  label: string;
  columns?: number;
}

// Figma message interfaces (existing)
interface FigmaMessage {
  type: string;
  config?: ConnectionConfig;
  frameCount?: number;
  connectionId?: string;
  // ... other existing message types
}
```

## Data Models

### State Management Strategy

**Primary State Container**: Single React state object in the main App component containing all UI state.

**State Updates**: 
- Local state changes update immediately for responsive UI
- Debounced updates sent to Figma backend for persistence
- Figma messages update local state for external changes

```typescript
// Main state structure
const [appState, setAppState] = useState<AppState>({
  config: defaultConfig,
  status: { type: 'info', message: 'Select 2 frames...' },
  selectedConnectionId: null,
  isEditingConnection: false,
  frameCount: 0,
  connectionCount: 0
});

// State update patterns
const updateConfig = useCallback((updates: Partial<ConnectionConfig>) => {
  setAppState(prev => ({
    ...prev,
    config: { ...prev.config, ...updates }
  }));
  
  // Debounced save to Figma
  debouncedSaveConfig({ ...appState.config, ...updates });
}, [appState.config]);
```

### Configuration Data Model

The existing `ConnectionConfig` interface remains unchanged to maintain compatibility:

```typescript
interface ConnectionConfig {
  // Arrow properties
  color: string;
  strokeWidth: number;
  strokeStyle: 'solid' | 'dashed' | 'dotted';
  sloppiness: 'none' | 'low' | 'high';
  arrowType: 'straight' | 'curved' | 'elbow';
  arrowheads: 'none' | 'end' | 'both';
  startPosition: 'auto' | 'top' | 'right' | 'bottom' | 'left';
  endPosition: 'auto' | 'top' | 'right' | 'bottom' | 'left';
  connectionOffset: number;
  avoidOverlap: boolean;
  opacity: number;
  
  // Label properties
  label: string;
  labelPosition: 'center' | 'top' | 'bottom';
  labelOffset: number;
  labelFontSize: number;
  labelBg: string;
  labelTextColor: string;
  labelBorderColor: string;
  labelBorderWidth: number;
  labelBorderRadius: number;
  labelPadding: number;
}
```

## Error Handling

### Component Error Boundaries

```typescript
class PluginErrorBoundary extends React.Component {
  // Catch and display React component errors
  // Provide fallback UI for broken components
  // Log errors for debugging
}
```

### Figma Communication Error Handling

```typescript
const useFigmaMessages = () => {
  // Handle message parsing errors
  // Retry failed communications
  // Provide user feedback for connection issues
  // Graceful degradation when Figma API unavailable
};
```

### Validation and Input Handling

```typescript
// Input validation hooks
const useValidatedInput = (value, validator, onChange) => {
  // Validate input values
  // Provide immediate feedback
  // Prevent invalid state updates
};
```

## Testing Strategy

### Component Testing Approach

**Unit Tests**: Individual component testing with React Testing Library
- Test component rendering with various props
- Test user interactions (clicks, input changes)
- Test state updates and callbacks
- Mock Figma message handling

**Integration Tests**: Component interaction testing
- Test tab switching functionality
- Test form submission and validation
- Test preview updates with config changes
- Test message passing between components

**Visual Regression Tests**: UI consistency testing
- Screenshot comparison for component rendering
- Test responsive behavior
- Test theme and styling consistency

### Testing Tools and Setup

```typescript
// Test utilities
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { jest } from '@jest/globals';

// Mock Figma API for testing
const mockFigmaAPI = {
  postMessage: jest.fn(),
  on: jest.fn(),
  // ... other Figma API mocks
};

// Component test example
describe('ColorPicker', () => {
  it('should update color when option is clicked', () => {
    const onChange = jest.fn();
    render(<ColorPicker value="#000" colors={['#000', '#fff']} onChange={onChange} />);
    
    fireEvent.click(screen.getByTestId('color-option-#fff'));
    expect(onChange).toHaveBeenCalledWith('#fff');
  });
});
```

### Performance Testing

**Bundle Size Monitoring**: Track React bundle size impact
**Render Performance**: Monitor component re-render frequency
**Memory Usage**: Test for memory leaks in long-running sessions
**Message Passing Performance**: Ensure efficient Figma communication

## Implementation Phases

### Phase 1: Project Setup and Build Configuration
- Configure React build system (Webpack/Vite)
- Set up TypeScript for React components
- Configure development and production builds
- Set up testing framework

### Phase 2: Core Component Structure
- Create main App component and routing
- Implement basic layout components (MainContainer, LeftPanel, RightPanel)
- Set up state management and Figma message handling
- Create reusable UI components (ColorPicker, RangeSlider, etc.)

### Phase 3: Feature Implementation
- Implement Arrow tab functionality
- Implement Label tab functionality
- Add preview system with React
- Implement all form controls and interactions

### Phase 4: Integration and Polish
- Connect all components to Figma backend
- Implement error handling and validation
- Add comprehensive testing
- Performance optimization and bundle size optimization

### Phase 5: Migration and Deployment
- Replace existing UI with React version
- Ensure backward compatibility
- Update build scripts and documentation
- Deploy and validate in Figma environment