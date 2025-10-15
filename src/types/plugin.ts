/// <reference types="@figma/plugin-typings" />

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

import { ConnectionStrategy, FrameLayoutAnalysis, BulkOperationResult } from './index';

export interface PluginMessage {
  type:
    | "create-connection"
    | "update-connection"
    | "auto-create-connection"
    | "toggle-auto-create"
    | "toggle-auto-update"
    | "save-config"
    | "load-config"
    | "clear-cache"
    | "cancel"
    | "reverse-connection"
    | "frame-selection"
    | "clear-frame-selection"
    | "create-bulk-connections"
    | "update-bulk-connections"
    | "update-connection-strategy"
    | "analyze-frame-layout"
    | "exit-bulk-mode"
    | "cancel-bulk-operation"
    | "retry-bulk-operation"
    | "analyze-mixed-properties";
  config?: ConnectionConfig;
  enabled?: boolean;
  connectionId?: string;
  connectionIds?: string[];
  connectionName?: string;
  message?: string;
  command?: string;
  frameId?: string;
  // Bulk operation properties
  selectedFrames?: Array<{ id: string; name: string }>;
  connectionStrategy?: ConnectionStrategy;
  frameLayout?: FrameLayoutAnalysis;
  operationId?: string;
  bulkOperationResult?: BulkOperationResult;
}

export interface ConnectionMetadata {
  config: ConnectionConfig;
  frame1Id: string;
  frame2Id: string;
  version: string;
}

export interface Point {
  x: number;
  y: number;
}

export interface ConnectionPoints {
  startPoint: Point;
  endPoint: Point;
  startOffsetPoint: Point;
  endOffsetPoint: Point;
  waypoints: Point[];
}

export interface Rectangle {
  x: number;
  y: number;
  width: number;
  height: number;
}
