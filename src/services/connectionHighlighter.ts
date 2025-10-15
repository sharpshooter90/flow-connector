import { ConnectionManager } from "./connectionManager";

export interface HighlightConfig {
  color: string;
  strokeWidth: number;
  opacity: number;
  duration: number; // in milliseconds
}

export interface HighlightState {
  connectionId: string;
  originalStyle: {
    color: string;
    strokeWidth: number;
    opacity: number;
  };
  highlightConfig: HighlightConfig;
  timeoutId?: ReturnType<typeof setTimeout>;
}

export class ConnectionHighlighter {
  private connectionManager = new ConnectionManager();
  private activeHighlights = new Map<string, HighlightState>();
  private defaultHighlightConfig: HighlightConfig = {
    color: "#3B82F6", // Blue highlight
    strokeWidth: 5,
    opacity: 0.8,
    duration: 2000, // 2 seconds
  };

  /**
   * Highlight connections temporarily during bulk operations
   */
  highlightConnections(
    connectionIds: string[],
    config?: Partial<HighlightConfig>
  ): void {
    const highlightConfig = Object.assign(
      {},
      this.defaultHighlightConfig,
      config
    );

    for (const connectionId of connectionIds) {
      this.highlightConnection(connectionId, highlightConfig);
    }
  }

  /**
   * Highlight a single connection
   */
  async highlightConnection(
    connectionId: string,
    config: HighlightConfig = this.defaultHighlightConfig
  ): Promise<void> {
    const connection = (await figma.getNodeByIdAsync(
      connectionId
    )) as GroupNode | null;
    if (!connection || !this.connectionManager.isFlowConnection(connection)) {
      return;
    }

    // Clear existing highlight if any
    this.clearHighlight(connectionId);

    // Find the path element in the connection
    const pathElement = this.findPathElement(connection);
    if (!pathElement) return;

    // Store original style
    const originalStyle = {
      color: this.getStrokeColor(pathElement),
      strokeWidth:
        typeof pathElement.strokeWeight === "number"
          ? pathElement.strokeWeight
          : 1,
      opacity: pathElement.opacity || 1,
    };

    // Apply highlight style
    this.applyHighlightStyle(pathElement, config);

    // Store highlight state
    const highlightState: HighlightState = {
      connectionId,
      originalStyle,
      highlightConfig: config,
    };

    // Set timeout to remove highlight
    if (config.duration > 0) {
      highlightState.timeoutId = setTimeout(() => {
        this.clearHighlight(connectionId);
      }, config.duration);
    }

    this.activeHighlights.set(connectionId, highlightState);
  }

  /**
   * Clear highlight from a specific connection
   */
  clearHighlight(connectionId: string): void {
    const highlightState = this.activeHighlights.get(connectionId);
    if (!highlightState) return;

    // Clear timeout if exists
    if (highlightState.timeoutId) {
      clearTimeout(highlightState.timeoutId);
    }

    // Restore original style
    const connection = figma.getNodeById(connectionId) as GroupNode | null;
    if (connection) {
      const pathElement = this.findPathElement(connection);
      if (pathElement) {
        this.restoreOriginalStyle(pathElement, highlightState.originalStyle);
      }
    }

    this.activeHighlights.delete(connectionId);
  }

  /**
   * Clear all active highlights
   */
  clearAllHighlights(): void {
    const connectionIds = Array.from(this.activeHighlights.keys());
    for (const connectionId of connectionIds) {
      this.clearHighlight(connectionId);
    }
  }

  /**
   * Highlight connections associated with selected frames
   */
  highlightFrameConnections(
    frameIds: string[],
    config?: Partial<HighlightConfig>
  ): void {
    const allConnections = this.connectionManager.findAllConnections();
    const associatedConnections: string[] = [];

    for (const connection of allConnections) {
      const metadata = this.connectionManager.getConnectionMetadata(connection);
      if (
        metadata &&
        (frameIds.includes(metadata.frame1Id) ||
          frameIds.includes(metadata.frame2Id))
      ) {
        associatedConnections.push(connection.id);
      }
    }

    this.highlightConnections(associatedConnections, config);
  }

  /**
   * Show temporary visual feedback for completed operations
   */
  showCompletionFeedback(
    connectionIds: string[],
    operationType: "create" | "update"
  ): void {
    const config: HighlightConfig = {
      color: operationType === "create" ? "#10B981" : "#3B82F6", // Green for create, blue for update
      strokeWidth: 4,
      opacity: 0.9,
      duration: 3000, // 3 seconds for completion feedback
    };

    this.highlightConnections(connectionIds, config);
  }

  /**
   * Show layout suggestion visual cues
   */
  showLayoutSuggestions(
    frameIds: string[],
    suggestionType: "sequential" | "hub-and-spoke" | "scattered"
  ): void {
    // This would show visual cues on frames to suggest better layouts
    // For now, we'll highlight the frames themselves
    const frames = frameIds
      .map((id) => figma.getNodeById(id) as FrameNode | null)
      .filter((frame) => frame !== null) as FrameNode[];

    if (frames.length === 0) return;

    const suggestionConfig = this.getSuggestionConfig(suggestionType);

    // Apply visual cues to frames (temporary border highlight)
    for (const frame of frames) {
      this.highlightFrame(frame, suggestionConfig);
    }
  }

  /**
   * Get suggestion configuration based on type
   */
  private getSuggestionConfig(suggestionType: string): HighlightConfig {
    switch (suggestionType) {
      case "sequential":
        return {
          color: "#3B82F6", // Blue for sequential
          strokeWidth: 3,
          opacity: 0.6,
          duration: 5000,
        };
      case "hub-and-spoke":
        return {
          color: "#8B5CF6", // Purple for hub-and-spoke
          strokeWidth: 3,
          opacity: 0.6,
          duration: 5000,
        };
      case "scattered":
        return {
          color: "#F59E0B", // Amber for scattered warning
          strokeWidth: 3,
          opacity: 0.6,
          duration: 5000,
        };
      default:
        return this.defaultHighlightConfig;
    }
  }

  /**
   * Highlight a frame with visual cues
   */
  private highlightFrame(frame: FrameNode, config: HighlightConfig): void {
    // Store original stroke properties
    const originalStroke = {
      strokes: frame.strokes ? frame.strokes.slice() : [],
      strokeWeight:
        typeof frame.strokeWeight === "number" ? frame.strokeWeight : 1,
      strokeAlign: frame.strokeAlign,
    };

    // Apply highlight stroke
    const highlightStroke: SolidPaint = {
      type: "SOLID",
      color: this.hexToRgb(config.color),
      opacity: config.opacity,
    };

    frame.strokes = [highlightStroke];
    frame.strokeWeight = Number(config.strokeWidth);
    frame.strokeAlign = "OUTSIDE";

    // Remove highlight after duration
    if (config.duration > 0) {
      setTimeout(() => {
        // Restore original stroke
        frame.strokes = originalStroke.strokes;
        frame.strokeWeight = originalStroke.strokeWeight;
        frame.strokeAlign = originalStroke.strokeAlign;
      }, config.duration);
    }
  }

  /**
   * Find the path element within a connection group
   */
  private findPathElement(connection: GroupNode): VectorNode | null {
    for (const child of connection.children) {
      if (child.type === "VECTOR" && child.name.includes("path")) {
        return child as VectorNode;
      }
    }
    return null;
  }

  /**
   * Apply highlight style to a path element
   */
  private applyHighlightStyle(
    pathElement: VectorNode,
    config: HighlightConfig
  ): void {
    // Apply highlight color
    const highlightColor: SolidPaint = {
      type: "SOLID",
      color: this.hexToRgb(config.color),
      opacity: config.opacity,
    };

    pathElement.strokes = [highlightColor];
    pathElement.strokeWeight = Number(config.strokeWidth);
    pathElement.opacity = config.opacity;
  }

  /**
   * Restore original style to a path element
   */
  private restoreOriginalStyle(
    pathElement: VectorNode,
    originalStyle: { color: string; strokeWidth: number; opacity: number }
  ): void {
    const originalColor: SolidPaint = {
      type: "SOLID",
      color: this.hexToRgb(originalStyle.color),
      opacity: originalStyle.opacity,
    };

    pathElement.strokes = [originalColor];
    pathElement.strokeWeight = originalStyle.strokeWidth;
    pathElement.opacity = originalStyle.opacity;
  }

  /**
   * Get stroke color from a path element
   */
  private getStrokeColor(pathElement: VectorNode): string {
    if (pathElement.strokes && pathElement.strokes.length > 0) {
      const stroke = pathElement.strokes[0];
      if (stroke.type === "SOLID") {
        return this.rgbToHex(stroke.color);
      }
    }
    return "#000000"; // Default black
  }

  /**
   * Convert hex color to RGB
   */
  private hexToRgb(hex: string): RGB {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? {
          r: parseInt(result[1], 16) / 255,
          g: parseInt(result[2], 16) / 255,
          b: parseInt(result[3], 16) / 255,
        }
      : { r: 0, g: 0, b: 0 };
  }

  /**
   * Convert RGB to hex color
   */
  private rgbToHex(rgb: RGB): string {
    const toHex = (value: number) => {
      const hex = Math.round(value * 255).toString(16);
      return hex.length === 1 ? "0" + hex : hex;
    };

    return `#${toHex(rgb.r)}${toHex(rgb.g)}${toHex(rgb.b)}`;
  }

  /**
   * Get all currently highlighted connections
   */
  getHighlightedConnections(): string[] {
    return Array.from(this.activeHighlights.keys());
  }

  /**
   * Check if a connection is currently highlighted
   */
  isHighlighted(connectionId: string): boolean {
    return this.activeHighlights.has(connectionId);
  }
}

// Global connection highlighter instance
export const connectionHighlighter = new ConnectionHighlighter();
