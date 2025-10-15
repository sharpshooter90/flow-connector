// Connection configuration interface (matches existing code.ts)
export interface ConnectionConfig {
  color: string;
  strokeWidth: number;
  strokeStyle: "solid" | "dashed" | "dotted";
  strokeAlign: "center" | "inside" | "outside";
  strokeCap: "none" | "round" | "square";
  strokeJoin: "miter" | "round" | "bevel";
  sloppiness: "none" | "low" | "high";
  arrowType: "straight" | "curved" | "elbow";
  arrowheads: "none" | "end" | "both";
  startPosition: "auto" | "top" | "right" | "bottom" | "left";
  endPosition: "auto" | "top" | "right" | "bottom" | "left";
  connectionOffset: number;
  avoidOverlap: boolean;
  opacity: number;
  label: string;
  labelPosition: "center" | "top" | "bottom";
  labelOffset: number;
  labelFontSize: number;
  labelBg: string;
  labelTextColor: string;
  labelBorderColor: string;
  labelBorderWidth: number;
  labelBorderRadius: number;
  labelPadding: number;
}

// Plugin message interface (matches existing code.ts)
export interface FigmaMessage {
  type: string;
  config?: ConnectionConfig;
  enabled?: boolean;
  frameCount?: number;
  frames?: Array<{ id: string; name: string }>;
  connectionCount?: number;
  connectionId?: string;
  connectionIds?: string[];
  connectionName?: string;
  command?: string;
  // Bulk operation message properties
  selectedFrames?: Array<{ id: string; name: string }>;
  frameLayout?: FrameLayoutAnalysis;
  bulkConnections?: string[];
  editableConnections?: string[];
  operationProgress?: OperationProgress;
  bulkOperationResult?: BulkOperationResult;
  connectionStrategy?: ConnectionStrategy;
  // Additional bulk operation properties
  mixedProperties?: Record<string, boolean>;
  layoutSuggestions?: string[];
  operationId?: string;
  canRetry?: boolean;
  // Debug message
  message?: string;
}

// UI state interface
export interface AppState {
  config: ConnectionConfig;
  status: {
    type: "info" | "success" | "error" | "editing";
    message: string;
  };
  selectedConnectionId: string | null;
  selectedConnectionName: string | null;
  isEditingConnection: boolean;
  frameCount: number;
  connectionCount: number;
  connectedFrames: Array<{ id: string; name: string }>;
  autoCreateEnabled: boolean;
  autoUpdateEnabled: boolean;
  activeTab: "arrow" | "label";
  // Bulk operation properties
  selectedFrames: Array<{ id: string; name: string }>;
  isBulkMode: boolean;
  bulkSelectedConnections: string[];
  bulkOperationInProgress: boolean;
  currentOperation?: OperationProgress;
  frameLayout?: FrameLayoutAnalysis;
  connectionStrategy: ConnectionStrategy;
  bulkEditableProperties: Set<keyof ConnectionConfig>;
  mixedPropertyStates: Map<keyof ConnectionConfig, boolean>;
}

// Layout pattern types for frame analysis
export interface LayoutPattern {
  type: 'horizontal' | 'vertical' | 'grid' | 'scattered' | 'circular';
  direction?: 'left-to-right' | 'right-to-left' | 'top-to-bottom' | 'bottom-to-top';
  gridDimensions?: { rows: number; cols: number };
}

// Frame layout analysis result
export interface FrameLayoutAnalysis {
  pattern: LayoutPattern;
  isOrdered: boolean;
  sortedFrames: Array<{ id: string; name: string }>;
  confidence: number; // 0-1 confidence in the detected pattern
  suggestions: string[]; // User-facing suggestions for better ordering
}

// Connection strategy configuration
export interface ConnectionStrategy {
  type: 'sequential' | 'hub-and-spoke' | 'full-mesh' | 'custom';
  centerFrameId?: string; // for hub-and-spoke
  customPairs?: Array<[string, string]>; // for custom strategy
}

// Bulk operation configuration
export interface BulkOperationConfig {
  connectionConfig: ConnectionConfig;
  selectedFrameIds: string[];
  operationType: 'create' | 'update';
  targetConnectionIds?: string[];
  connectionStrategy?: ConnectionStrategy;
}

// Bulk operation result
export interface BulkOperationResult {
  successful: number;
  failed: number;
  errors: Array<{ frameIds?: string[]; connectionId?: string; error: string }>;
  createdConnections?: string[];
  updatedConnections?: string[];
  operationId?: string;
  canRetry?: boolean;
}

// Progress tracking interfaces
export interface OperationProgress {
  operationId: string;
  type: 'create' | 'update';
  current: number;
  total: number;
  status: 'pending' | 'in-progress' | 'completed' | 'failed' | 'cancelled';
  startTime: number;
  endTime?: number;
  estimatedTimeRemaining?: number;
  currentItem?: string;
  canCancel: boolean;
}

export interface ProgressCallback {
  (progress: OperationProgress): void;
}

export interface OperationSummary {
  operationId: string;
  type: 'create' | 'update';
  totalItems: number;
  successful: number;
  failed: number;
  duration: number;
  errors: Array<{ frameIds?: string[]; connectionId?: string; error: string }>;
  createdConnections?: string[];
  updatedConnections?: string[];
}

// Bulk operation error
export interface BulkOperationError {
  frameIds?: string[];
  connectionId?: string;
  error: string;
  retryable: boolean;
}

// Bulk selection state
export interface BulkSelectionState {
  selectedFrames: Map<string, { id: string; name: string }>;
  associatedConnections: Map<string, string[]>;
  bulkEditableProperties: Set<keyof ConnectionConfig>;
  mixedPropertyStates: Map<keyof ConnectionConfig, boolean>;
  frameLayout: FrameLayoutAnalysis;
  connectionStrategy: ConnectionStrategy;
}

// Connection relationships mapping
export interface ConnectionRelationships {
  frameToConnections: Map<string, string[]>;
  connectionToFrames: Map<string, [string, string]>;
  bulkEditableConnections: Set<string>;
}



// Default configuration (matches existing code.ts)
export const defaultConfig: ConnectionConfig = {
  color: "#2c2c2c",
  strokeWidth: 3,
  strokeStyle: "solid",
  strokeAlign: "center",
  strokeCap: "round",
  strokeJoin: "round",
  sloppiness: "low",
  arrowType: "elbow",
  arrowheads: "end",
  startPosition: "auto",
  endPosition: "auto",
  connectionOffset: 20,
  avoidOverlap: true,
  opacity: 100,
  label: "Label Text",
  labelPosition: "center",
  labelOffset: 10,
  labelFontSize: 12,
  labelBg: "#ffffff",
  labelTextColor: "#333333",
  labelBorderColor: "#e0e0e0",
  labelBorderWidth: 1,
  labelBorderRadius: 4,
  labelPadding: 6,
};

// Default connection strategy
export const defaultConnectionStrategy: ConnectionStrategy = {
  type: 'sequential'
};

// Visual feedback message interface
export interface FeedbackMessage {
  id: string;
  type: 'success' | 'warning' | 'info' | 'progress';
  title: string;
  message?: string;
  duration?: number; // in milliseconds, 0 for persistent
  connectionIds?: string[]; // connections to highlight
  frameIds?: string[]; // frames to highlight
}
