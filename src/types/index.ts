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
  labelFontFamily: string;
  labelFontWeight: string;
  labelBg: string;
  labelBgOpacity: number;
  labelTextColor: string;
  labelTextColorOpacity: number;
  labelBorderColor: string;
  labelBorderColorOpacity: number;
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
  connectionName?: string;
  command?: string;
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
  labelFontFamily: "Inter",
  labelFontWeight: "Medium",
  labelBg: "#ffffff",
  labelBgOpacity: 100,
  labelTextColor: "#333333",
  labelTextColorOpacity: 100,
  labelBorderColor: "#e0e0e0",
  labelBorderColorOpacity: 100,
  labelBorderWidth: 1,
  labelBorderRadius: 4,
  labelPadding: 6,
};
