import { ConnectionManager } from "./connectionManager";
import { FrameOrderAnalyzer } from "./frameOrderAnalyzer";
import { BulkSelectionState, FrameLayoutAnalysis, ConnectionStrategy, defaultConnectionStrategy } from "../types";

export class SelectionManager {
  private connectionManager = new ConnectionManager();
  private frameOrderAnalyzer = new FrameOrderAnalyzer();
  private selectedFrameIds: Set<string> = new Set();
  private bulkSelectionState: BulkSelectionState | null = null;

  /**
   * Handle frame selection with toggle functionality (no modifier keys required)
   * Requirements: 1.1, 1.2, 1.3
   */
  handleFrameSelection(frameId: string, toggleMode: boolean = true): void {
    if (toggleMode && this.selectedFrameIds.has(frameId)) {
      // Deselect frame if already selected (Requirement 1.2)
      this.selectedFrameIds.delete(frameId);
    } else {
      // Add frame to selection (Requirement 1.1)
      this.selectedFrameIds.add(frameId);
    }
    
    // Update bulk selection state
    this.updateBulkSelectionState();
  }

  /**
   * Clear all frame selections
   * Requirements: 1.4
   */
  clearFrameSelection(): void {
    this.selectedFrameIds.clear();
    this.bulkSelectionState = null;
  }

  /**
   * Get all connections associated with selected frames
   * Requirements: 1.4
   */
  async getConnectionsForSelectedFrames(): Promise<GroupNode[]> {
    if (this.selectedFrameIds.size === 0) {
      return [];
    }

    const allConnections = figma.currentPage.findAll(node => 
      this.connectionManager.isFlowConnection(node)
    ) as GroupNode[];

    const associatedConnections: GroupNode[] = [];
    
    for (const connection of allConnections) {
      const metadata = this.connectionManager.getConnectionMetadata(connection);
      if (metadata) {
        // Check if connection involves any selected frames
        if (this.selectedFrameIds.has(metadata.frame1Id) || 
            this.selectedFrameIds.has(metadata.frame2Id)) {
          associatedConnections.push(connection);
        }
      }
    }

    return associatedConnections;
  }

  /**
   * Get current bulk selection state
   */
  getBulkSelectionState(): BulkSelectionState | null {
    return this.bulkSelectionState;
  }

  /**
   * Check if currently in bulk mode (multiple frames selected)
   */
  isBulkMode(): boolean {
    return this.selectedFrameIds.size > 2;
  }

  /**
   * Get selected frame IDs
   */
  getSelectedFrameIds(): string[] {
    return Array.from(this.selectedFrameIds);
  }

  /**
   * Update bulk selection state with frame layout analysis
   * Requirements: 2.1, 2.2 - Connect frame selection to layout analysis
   */
  private async updateBulkSelectionState(): Promise<void> {
    if (this.selectedFrameIds.size <= 2) {
      this.bulkSelectionState = null;
      return;
    }

    // Get frame nodes
    const frameNodes: FrameNode[] = [];
    const selectedFrames = new Map<string, { id: string; name: string }>();
    
    for (const frameId of this.selectedFrameIds) {
      try {
        const frame = await figma.getNodeByIdAsync(frameId) as FrameNode;
        if (frame && frame.type === "FRAME") {
          frameNodes.push(frame);
          selectedFrames.set(frameId, { id: frame.id, name: frame.name });
        }
      } catch (error) {
        // Remove invalid frame ID
        this.selectedFrameIds.delete(frameId);
      }
    }

    // Analyze frame layout (Requirements: 2.1 - Connect frame selection to layout analysis)
    const frameLayout = this.frameOrderAnalyzer.analyzeFrameLayout(frameNodes);
    
    // Get associated connections
    const associatedConnections = new Map<string, string[]>();
    const connections = await this.getConnectionsForSelectedFrames();
    
    for (const frameId of this.selectedFrameIds) {
      const frameConnections = connections
        .filter(conn => {
          const metadata = this.connectionManager.getConnectionMetadata(conn);
          return metadata && (metadata.frame1Id === frameId || metadata.frame2Id === frameId);
        })
        .map(conn => conn.id);
      
      associatedConnections.set(frameId, frameConnections);
    }

    // Create bulk selection state (Requirements: 2.1, 2.2)
    this.bulkSelectionState = {
      selectedFrames,
      associatedConnections,
      bulkEditableProperties: new Set(['color', 'strokeWidth', 'strokeStyle', 'arrowheads', 'opacity']),
      mixedPropertyStates: new Map(),
      frameLayout,
      connectionStrategy: defaultConnectionStrategy
    };

    // Automatically send layout analysis to UI when bulk selection changes
    // Requirements: 2.1, 2.2 - Wire bulk operations to UI controls
    if (frameLayout && frameNodes.length > 1) {
      figma.ui.postMessage({
        type: "layout-analysis-updated",
        frameLayout: frameLayout,
      });

      // Send layout suggestions if confidence is low
      if (frameLayout.confidence < 0.7 && frameLayout.suggestions.length > 0) {
        figma.ui.postMessage({
          type: "layout-suggestions-updated",
          layoutSuggestions: frameLayout.suggestions,
          frameLayout: frameLayout,
        });
      }
    }
  }

  async checkSelection() {
    const selection = figma.currentPage.selection;
    const frames = selection.filter(
      (node) => node.type === "FRAME"
    ) as FrameNode[];
    const connections = selection.filter((node) =>
      this.connectionManager.isFlowConnection(node)
    ) as GroupNode[];

    // Check if a single connection is selected
    if (connections.length === 1 && selection.length === 1) {
      const connection = connections[0];
      const metadata = this.connectionManager.getConnectionMetadata(connection);

      if (metadata) {
        // Get frame names from the connection metadata (async)
        const frame1 = (await figma.getNodeByIdAsync(
          metadata.frame1Id
        )) as FrameNode | null;
        const frame2 = (await figma.getNodeByIdAsync(
          metadata.frame2Id
        )) as FrameNode | null;

        const frameNames = [];
        if (frame1) frameNames.push({ id: frame1.id, name: frame1.name });
        if (frame2) frameNames.push({ id: frame2.id, name: frame2.name });

        figma.ui.postMessage({
          type: "connection-selected",
          config: metadata.config,
          connectionId: connection.id,
          connectionName: connection.name,
          frames: frameNames,
        });
        return;
      }
    }

    // Handle bulk selection mode (Requirements: 2.1, 2.2, 5.1)
    if (this.isBulkMode()) {
      await this.updateBulkSelectionState();
      
      // Send bulk selection state with layout analysis
      figma.ui.postMessage({
        type: "bulk-selection-changed",
        frameCount: frames.length,
        selectedFrames: frames.map((frame) => ({ id: frame.id, name: frame.name })),
        connectionCount: connections.length,
        frameLayout: this.bulkSelectionState?.frameLayout,
      });

      // Send bulk connections update if there are associated connections
      // Requirements: 4.1, 4.2 - Wire bulk operations to UI controls
      const associatedConnections = await this.getConnectionsForSelectedFrames();
      if (associatedConnections.length > 0) {
        // Filter for editable connections
        const editableConnections = associatedConnections.filter(conn => {
          // All connections are editable by default, but this could be enhanced
          // to check for locked connections or other restrictions
          return true;
        });

        figma.ui.postMessage({
          type: "bulk-connections-updated",
          bulkConnections: associatedConnections.map(conn => conn.id),
          editableConnections: editableConnections.map(conn => conn.id),
        });

        // Analyze mixed properties for bulk editing (Requirements: 4.4, 4.5)
        if (editableConnections.length > 1) {
          this.analyzeMixedProperties(editableConnections);
        }
      }
      
      return;
    }

    // Handle regular selection
    figma.ui.postMessage({
      type: "selection-changed",
      frameCount: frames.length,
      frames: frames.map((frame) => ({ id: frame.id, name: frame.name })),
      connectionCount: connections.length,
    });

    return { frames, connections };
  }

  /**
   * Analyze mixed properties across multiple connections
   * Requirements: 4.4, 4.5 - Mixed property state indicators
   */
  private analyzeMixedProperties(connections: GroupNode[]): void {
    if (connections.length < 2) return;

    const mixedProperties = new Map<string, boolean>();
    const firstConnectionMetadata = this.connectionManager.getConnectionMetadata(connections[0]);
    
    if (!firstConnectionMetadata) return;

    const firstConfig = firstConnectionMetadata.config;

    // Check each property for consistency across all connections
    for (const [key, value] of Object.entries(firstConfig)) {
      let hasVariation = false;
      
      for (let i = 1; i < connections.length; i++) {
        const metadata = this.connectionManager.getConnectionMetadata(connections[i]);
        if (metadata && metadata.config[key as keyof typeof metadata.config] !== value) {
          hasVariation = true;
          break;
        }
      }
      
      mixedProperties.set(key, hasVariation);
    }

    // Send mixed properties analysis to UI
    // Convert Map to plain object for JSON serialization
    const mixedPropertiesObject = Object.fromEntries(mixedProperties);
    figma.ui.postMessage({
      type: "mixed-properties-updated",
      mixedProperties: mixedPropertiesObject,
    });
  }
}
