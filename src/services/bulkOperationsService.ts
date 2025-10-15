import {
  BulkOperationConfig,
  BulkOperationResult,
  ConnectionConfig,
  ConnectionStrategy,
  FrameLayoutAnalysis,
  OperationProgress,
  ProgressCallback,
} from "../types/index";
import { ConnectionCreator } from "./connectionCreator";
import { ConnectionManager } from "./connectionManager";
import { FrameOrderAnalyzer } from "./frameOrderAnalyzer";
import { ProgressTracker, progressTracker } from "./progressTracker";
import { visualFeedbackManager } from "./visualFeedbackManager";
import { connectionHighlighter } from "./connectionHighlighter";

export class BulkOperationsService {
  private connectionCreator = new ConnectionCreator();
  private connectionManager = new ConnectionManager();
  private frameOrderAnalyzer = new FrameOrderAnalyzer();
  private progressTracker = progressTracker;

  /**
   * Create connections between all selected frames using the specified strategy
   */
  async createBulkConnections(
    config: BulkOperationConfig,
    progressCallback?: ProgressCallback
  ): Promise<BulkOperationResult> {
    if (config.selectedFrameIds.length < 2) {
      return {
        successful: 0,
        failed: 1,
        errors: [
          {
            error:
              "At least 2 frames must be selected for bulk connection creation",
          },
        ],
      };
    }

    // Generate operation ID and start progress tracking
    const operationId = ProgressTracker.generateOperationId();

    try {
      // Get frame nodes from IDs
      const frames = await this.getFrameNodes(config.selectedFrameIds);
      if (frames.length !== config.selectedFrameIds.length) {
        return {
          successful: 0,
          failed: 1,
          errors: [{ error: "Some selected frames could not be found" }],
        };
      }

      // Analyze frame layout if strategy is sequential
      let frameLayout: FrameLayoutAnalysis | undefined;
      if (config.connectionStrategy?.type === "sequential") {
        frameLayout = this.frameOrderAnalyzer.analyzeFrameLayout(frames);
      }

      // Generate connection pairs based on strategy
      const connectionPairs = this.generateConnectionPairs(
        frames,
        config.connectionStrategy || { type: "sequential" },
        frameLayout
      );

      if (connectionPairs.length === 0) {
        return {
          successful: 0,
          failed: 1,
          errors: [{ error: "No valid connection pairs could be generated" }],
        };
      }

      // Start progress tracking
      this.progressTracker.startOperation(
        operationId,
        "create",
        connectionPairs.length
      );

      // Subscribe to progress updates if callback provided
      let unsubscribe: (() => void) | undefined;
      if (progressCallback) {
        unsubscribe = this.progressTracker.subscribe(
          operationId,
          progressCallback
        );
      }

      try {
        // Create connections in batches with progress tracking
        const result = await this.processBatchWithProgress(
          operationId,
          connectionPairs,
          async (pair) => {
            const [frame1, frame2] = pair;
            return await this.connectionCreator.createConnection(
              frame1,
              frame2,
              config.connectionConfig
            );
          }
        );

        // Add operation metadata to result
        result.operationId = operationId;
        result.canRetry = result.failed > 0;

        // Show visual feedback for completion
        visualFeedbackManager.showOperationCompletion(result);

        // Highlight created connections
        if (result.createdConnections && result.createdConnections.length > 0) {
          connectionHighlighter.showCompletionFeedback(
            result.createdConnections,
            "create"
          );
        }

        return result;
      } finally {
        // Clean up progress tracking
        if (unsubscribe) {
          unsubscribe();
        }
        // Keep operation for a short time to allow UI to show completion
        setTimeout(() => this.progressTracker.cleanup(operationId), 3000);
      }
    } catch (error) {
      // Mark operation as failed
      this.progressTracker.markFailed(
        operationId,
        error instanceof Error ? error.message : "Unknown error"
      );

      return {
        successful: 0,
        failed: 1,
        errors: [
          {
            error: `Bulk connection creation failed: ${
              error instanceof Error ? error.message : "Unknown error"
            }`,
          },
        ],
        operationId,
        canRetry: true,
      };
    }
  }

  /**
   * Update properties of multiple connections
   */
  async updateBulkConnections(
    config: BulkOperationConfig,
    progressCallback?: ProgressCallback
  ): Promise<BulkOperationResult> {
    if (
      !config.targetConnectionIds ||
      config.targetConnectionIds.length === 0
    ) {
      return {
        successful: 0,
        failed: 1,
        errors: [{ error: "No connections specified for bulk update" }],
      };
    }

    // Generate operation ID
    const operationId = ProgressTracker.generateOperationId();

    try {
      // Validate and filter connections (Requirements: 4.1, 4.6)
      const validation = this.validateBulkUpdate(config.targetConnectionIds);

      if (!validation.valid) {
        return {
          successful: 0,
          failed: config.targetConnectionIds.length,
          errors: validation.errors.map((error) => ({ error })),
        };
      }

      // Use only modifiable connections
      const modifiableConnectionIds = validation.modifiableConnections;
      const nonModifiableCount = validation.nonModifiableConnections.length;

      if (modifiableConnectionIds.length === 0) {
        return {
          successful: 0,
          failed: config.targetConnectionIds.length,
          errors: [{ error: "No connections can be modified" }],
        };
      }

      // Get connection nodes for modifiable connections
      const connections = await this.getConnectionNodes(
        modifiableConnectionIds
      );
      const validConnections = connections.filter(
        (conn) => conn !== null
      ) as GroupNode[];

      // Start progress tracking
      this.progressTracker.startOperation(
        operationId,
        "update",
        validConnections.length
      );

      // Subscribe to progress updates if callback provided
      let unsubscribe: (() => void) | undefined;
      if (progressCallback) {
        unsubscribe = this.progressTracker.subscribe(
          operationId,
          progressCallback
        );
      }

      try {
        // Update connections in batches with progress tracking
        const result = await this.processUpdateBatchWithProgress(
          operationId,
          validConnections,
          config.connectionConfig
        );

        // Add information about non-modifiable connections to the result
        if (nonModifiableCount > 0) {
          const nonModifiableErrors = validation.nonModifiableConnections.map(
            ({ connectionId, reason }) => ({
              connectionId,
              error: `Cannot modify connection: ${reason}`,
            })
          );

          result.errors = result.errors.concat(nonModifiableErrors);
          result.failed += nonModifiableCount;
        }

        // Add operation metadata to result
        result.operationId = operationId;
        result.canRetry = result.failed > 0;

        // Show visual feedback for completion
        visualFeedbackManager.showOperationCompletion(result);

        // Highlight updated connections
        if (result.updatedConnections && result.updatedConnections.length > 0) {
          connectionHighlighter.showCompletionFeedback(
            result.updatedConnections,
            "update"
          );
        }

        return result;
      } finally {
        // Clean up progress tracking
        if (unsubscribe) {
          unsubscribe();
        }
        // Keep operation for a short time to allow UI to show completion
        setTimeout(() => this.progressTracker.cleanup(operationId), 3000);
      }
    } catch (error) {
      // Mark operation as failed
      this.progressTracker.markFailed(
        operationId,
        error instanceof Error ? error.message : "Unknown error"
      );

      return {
        successful: 0,
        failed: config.targetConnectionIds?.length || 0,
        errors: [
          {
            error: `Bulk connection update failed: ${
              error instanceof Error ? error.message : "Unknown error"
            }`,
          },
        ],
        operationId,
        canRetry: true,
      };
    }
  }

  /**
   * Generate connection pairs from selected frames based on strategy
   */
  private generateConnectionPairs(
    frames: FrameNode[],
    strategy: ConnectionStrategy,
    frameLayout?: FrameLayoutAnalysis
  ): Array<[FrameNode, FrameNode]> {
    switch (strategy.type) {
      case "sequential":
        return this.generateSequentialPairs(frames, frameLayout);

      case "hub-and-spoke":
        return this.generateHubAndSpokePairs(frames, strategy.centerFrameId);

      case "full-mesh":
        return this.generateFullMeshPairs(frames);

      case "custom":
        return this.generateCustomPairs(frames, strategy.customPairs || []);

      default:
        return this.generateSequentialPairs(frames, frameLayout);
    }
  }

  /**
   * Generate sequential connection pairs (A→B→C→D)
   */
  private generateSequentialPairs(
    frames: FrameNode[],
    frameLayout?: FrameLayoutAnalysis
  ): Array<[FrameNode, FrameNode]> {
    let orderedFrames = frames;

    // Use layout analysis to order frames if available
    if (frameLayout && frameLayout.isOrdered) {
      const frameMap = new Map(frames.map((frame) => [frame.id, frame]));
      orderedFrames = frameLayout.sortedFrames
        .map((frameInfo) => frameMap.get(frameInfo.id))
        .filter((frame) => frame !== undefined) as FrameNode[];
    }

    const pairs: Array<[FrameNode, FrameNode]> = [];
    for (let i = 0; i < orderedFrames.length - 1; i++) {
      pairs.push([orderedFrames[i], orderedFrames[i + 1]]);
    }

    return pairs;
  }

  /**
   * Generate hub-and-spoke connection pairs (all frames connect to/from center)
   */
  private generateHubAndSpokePairs(
    frames: FrameNode[],
    centerFrameId?: string
  ): Array<[FrameNode, FrameNode]> {
    let centerFrame: FrameNode;

    if (centerFrameId) {
      const found = frames.find((frame) => frame.id === centerFrameId);
      if (!found) {
        // Fallback to first frame if specified center not found
        centerFrame = frames[0];
      } else {
        centerFrame = found;
      }
    } else {
      // Use the most central frame (closest to geometric center)
      centerFrame = this.findMostCentralFrame(frames);
    }

    const pairs: Array<[FrameNode, FrameNode]> = [];
    for (const frame of frames) {
      if (frame.id !== centerFrame.id) {
        pairs.push([centerFrame, frame]);
      }
    }

    return pairs;
  }

  /**
   * Generate full-mesh connection pairs (every frame connects to every other frame)
   */
  private generateFullMeshPairs(
    frames: FrameNode[]
  ): Array<[FrameNode, FrameNode]> {
    const pairs: Array<[FrameNode, FrameNode]> = [];

    for (let i = 0; i < frames.length; i++) {
      for (let j = i + 1; j < frames.length; j++) {
        pairs.push([frames[i], frames[j]]);
      }
    }

    return pairs;
  }

  /**
   * Generate custom connection pairs based on user specification
   */
  private generateCustomPairs(
    frames: FrameNode[],
    customPairs: Array<[string, string]>
  ): Array<[FrameNode, FrameNode]> {
    const frameMap = new Map(frames.map((frame) => [frame.id, frame]));
    const pairs: Array<[FrameNode, FrameNode]> = [];

    for (const [fromId, toId] of customPairs) {
      const fromFrame = frameMap.get(fromId);
      const toFrame = frameMap.get(toId);

      if (fromFrame && toFrame) {
        pairs.push([fromFrame, toFrame]);
      }
    }

    return pairs;
  }

  /**
   * Find the most geometrically central frame
   */
  private findMostCentralFrame(frames: FrameNode[]): FrameNode {
    // Calculate geometric center of all frames
    const centerX =
      frames.reduce((sum, frame) => sum + frame.x + frame.width / 2, 0) /
      frames.length;
    const centerY =
      frames.reduce((sum, frame) => sum + frame.y + frame.height / 2, 0) /
      frames.length;

    // Find frame closest to geometric center
    let closestFrame = frames[0];
    let minDistance = Number.MAX_VALUE;

    for (const frame of frames) {
      const frameX = frame.x + frame.width / 2;
      const frameY = frame.y + frame.height / 2;
      const distance = Math.sqrt(
        Math.pow(frameX - centerX, 2) + Math.pow(frameY - centerY, 2)
      );

      if (distance < minDistance) {
        minDistance = distance;
        closestFrame = frame;
      }
    }

    return closestFrame;
  }

  /**
   * Batch process operations with progress tracking and error handling
   */
  private async processBatchWithProgress<T, R>(
    operationId: string,
    items: T[],
    processor: (item: T) => Promise<R>
  ): Promise<BulkOperationResult> {
    const result: BulkOperationResult = {
      successful: 0,
      failed: 0,
      errors: [],
      createdConnections: [],
      updatedConnections: [],
    };

    for (let i = 0; i < items.length; i++) {
      // Check for cancellation
      if (this.progressTracker.isCancelled(operationId)) {
        this.progressTracker.cancelOperation(operationId);
        break;
      }

      const item = items[i];

      // Update progress with current item info
      let currentItemName = "Processing item";
      if (Array.isArray(item) && item.length === 2) {
        const [frame1, frame2] = item as [FrameNode, FrameNode];
        currentItemName = `Connecting ${frame1.name} → ${frame2.name}`;
      } else if (item && typeof item === "object" && "name" in item) {
        currentItemName = `Processing ${(item as any).name}`;
      }

      this.progressTracker.updateProgress(operationId, i, currentItemName);

      try {
        const processResult = await processor(item);
        result.successful++;

        // Track created connections if the result is a GroupNode
        if (
          processResult &&
          typeof processResult === "object" &&
          "id" in processResult
        ) {
          result.createdConnections = result.createdConnections || [];
          result.createdConnections.push((processResult as any).id);
        }
      } catch (error) {
        result.failed++;

        // Enhanced error context for better user feedback (Requirements: 3.5, 5.4, 5.5)
        let errorMessage =
          error instanceof Error
            ? error.message
            : "Unknown error during processing";

        // Enhance error message with more context
        if (Array.isArray(item) && item.length === 2) {
          const [frame1, frame2] = item as [FrameNode, FrameNode];

          // Add specific context for connection creation errors
          if (errorMessage.includes("already exists")) {
            errorMessage = `Connection already exists between "${frame1.name}" and "${frame2.name}"`;
          } else if (errorMessage.includes("invalid frame")) {
            errorMessage = `Invalid frame configuration: "${frame1.name}" or "${frame2.name}" may be locked or inaccessible`;
          } else if (errorMessage.includes("permission")) {
            errorMessage = `Insufficient permissions to connect "${frame1.name}" and "${frame2.name}"`;
          } else {
            errorMessage = `Failed to create connection between "${frame1.name}" and "${frame2.name}": ${errorMessage}`;
          }
        }

        // Determine if error is retryable based on error type
        const isRetryable =
          !errorMessage.toLowerCase().includes("validation") &&
          !errorMessage.toLowerCase().includes("invalid") &&
          !errorMessage.toLowerCase().includes("permission") &&
          !errorMessage.toLowerCase().includes("locked") &&
          !errorMessage.toLowerCase().includes("not found");

        if (isRetryable) {
          errorMessage += " (retryable)";
        }

        let errorContext: {
          frameIds?: string[];
          connectionId?: string;
          error: string;
        } = {
          error: errorMessage,
        };

        // Add context based on item type
        if (Array.isArray(item) && item.length === 2) {
          // Connection pair - add frame IDs
          const [frame1, frame2] = item as [FrameNode, FrameNode];
          errorContext.frameIds = [frame1.id, frame2.id];
        } else if (item && typeof item === "object" && "id" in item) {
          // Single item with ID
          errorContext.connectionId = (item as any).id;
        }

        result.errors.push(errorContext);
      }
    }

    // Final progress update
    this.progressTracker.updateProgress(operationId, items.length, "Completed");

    return result;
  }

  /**
   * Batch process connection updates with progress tracking
   */
  private async processUpdateBatchWithProgress(
    operationId: string,
    connections: GroupNode[],
    newConfig: ConnectionConfig
  ): Promise<BulkOperationResult> {
    const result: BulkOperationResult = {
      successful: 0,
      failed: 0,
      errors: [],
      updatedConnections: [],
    };

    for (let i = 0; i < connections.length; i++) {
      // Check for cancellation
      if (this.progressTracker.isCancelled(operationId)) {
        this.progressTracker.cancelOperation(operationId);
        break;
      }

      const connection = connections[i];

      // Update progress
      this.progressTracker.updateProgress(
        operationId,
        i,
        `Updating ${connection.name || "connection"}`
      );

      try {
        const newConnection = await this.updateConnectionProperties(
          connection,
          newConfig
        );
        result.successful++;

        if (newConnection && newConnection.id) {
          result.updatedConnections = result.updatedConnections || [];
          result.updatedConnections.push(newConnection.id);
        }
      } catch (error) {
        result.failed++;

        // Enhanced error context for updates (Requirements: 3.5, 5.4, 5.5)
        let errorMessage =
          error instanceof Error
            ? error.message
            : "Unknown error during update";

        // Add specific context for connection update errors
        const connectionName = connection.name || `Connection ${connection.id}`;

        if (errorMessage.includes("not found")) {
          errorMessage = `Connection "${connectionName}" no longer exists or has been deleted`;
        } else if (errorMessage.includes("locked")) {
          errorMessage = `Connection "${connectionName}" is locked and cannot be modified`;
        } else if (errorMessage.includes("permission")) {
          errorMessage = `Insufficient permissions to modify connection "${connectionName}"`;
        } else if (errorMessage.includes("invalid")) {
          errorMessage = `Invalid configuration for connection "${connectionName}"`;
        } else {
          errorMessage = `Failed to update connection "${connectionName}": ${errorMessage}`;
        }

        const isRetryable =
          !errorMessage.toLowerCase().includes("not found") &&
          !errorMessage.toLowerCase().includes("invalid") &&
          !errorMessage.toLowerCase().includes("permission") &&
          !errorMessage.toLowerCase().includes("locked") &&
          !errorMessage.toLowerCase().includes("deleted");

        if (isRetryable) {
          errorMessage += " (retryable)";
        }

        result.errors.push({
          connectionId: connection.id,
          error: errorMessage,
        });
      }
    }

    // Final progress update
    this.progressTracker.updateProgress(
      operationId,
      connections.length,
      "Completed"
    );

    return result;
  }

  /**
   * Update properties of a single connection
   */
  private async updateConnectionProperties(
    connection: GroupNode,
    newConfig: ConnectionConfig
  ): Promise<GroupNode> {
    // Get existing metadata
    const metadata = this.connectionManager.getConnectionMetadata(connection);
    if (!metadata) {
      throw new Error(`Connection ${connection.name} has no metadata`);
    }

    // Get the connected frames
    const frame1 = figma.getNodeById(metadata.frame1Id) as FrameNode;
    const frame2 = figma.getNodeById(metadata.frame2Id) as FrameNode;

    if (!frame1 || !frame2) {
      throw new Error(
        `Connected frames not found for connection ${connection.name}`
      );
    }

    // Remove the old connection
    connection.remove();
    this.connectionManager.removeTrackedConnection(connection.id);

    // Create new connection with updated config
    const newConnection = await this.connectionCreator.createConnection(
      frame1,
      frame2,
      newConfig
    );

    return newConnection;
  }

  /**
   * Get frame nodes from their IDs using async method for dynamic-page compatibility
   */
  private async getFrameNodes(frameIds: string[]): Promise<FrameNode[]> {
    const framePromises = frameIds.map(async (frameId) => {
      try {
        const node = await figma.getNodeByIdAsync(frameId);
        return node && node.type === "FRAME" ? (node as FrameNode) : null;
      } catch (error) {
        console.warn(`Failed to get frame node ${frameId}:`, error);
        return null;
      }
    });

    const frameResults = await Promise.all(framePromises);
    return frameResults.filter((frame) => frame !== null) as FrameNode[];
  }

  /**
   * Get connection nodes from their IDs using async method for dynamic-page compatibility
   */
  private async getConnectionNodes(
    connectionIds: string[]
  ): Promise<(GroupNode | null)[]> {
    const connectionPromises = connectionIds.map(async (connectionId) => {
      try {
        const node = await figma.getNodeByIdAsync(connectionId);
        if (
          node &&
          node.type === "GROUP" &&
          this.connectionManager.isFlowConnection(node as GroupNode)
        ) {
          return node as GroupNode;
        }
        return null;
      } catch (error) {
        console.warn(`Failed to get connection node ${connectionId}:`, error);
        return null;
      }
    });

    return await Promise.all(connectionPromises);
  }

  /**
   * Get connections associated with selected frames
   */
  getConnectionsForFrames(frameIds: string[]): GroupNode[] {
    const allConnections = this.connectionManager.findAllConnections();
    const associatedConnections: GroupNode[] = [];

    for (const connection of allConnections) {
      const metadata = this.connectionManager.getConnectionMetadata(connection);
      if (
        metadata &&
        (frameIds.includes(metadata.frame1Id) ||
          frameIds.includes(metadata.frame2Id))
      ) {
        associatedConnections.push(connection);
      }
    }

    return associatedConnections;
  }

  /**
   * Filter connections that can be modified for bulk updates (Requirements: 4.1, 4.6)
   */
  filterModifiableConnections(connectionIds: string[]): {
    modifiable: string[];
    nonModifiable: Array<{ connectionId: string; reason: string }>;
  } {
    const modifiable: string[] = [];
    const nonModifiable: Array<{ connectionId: string; reason: string }> = [];

    for (const connectionId of connectionIds) {
      const connection = figma.getNodeById(connectionId) as GroupNode | null;

      if (!connection) {
        nonModifiable.push({
          connectionId,
          reason: "Connection not found or has been deleted",
        });
        continue;
      }

      if (connection.type !== "GROUP") {
        nonModifiable.push({
          connectionId,
          reason: "Invalid connection type",
        });
        continue;
      }

      if (!this.connectionManager.isFlowConnection(connection)) {
        nonModifiable.push({
          connectionId,
          reason: "Not a Flow Connector connection",
        });
        continue;
      }

      // Check if connection is locked or read-only
      if (connection.locked) {
        nonModifiable.push({
          connectionId,
          reason: "Connection is locked",
        });
        continue;
      }

      // Check if connection metadata is valid
      const metadata = this.connectionManager.getConnectionMetadata(connection);
      if (!metadata) {
        nonModifiable.push({
          connectionId,
          reason: "Connection metadata is missing or invalid",
        });
        continue;
      }

      // Check if connected frames still exist
      const frame1 = figma.getNodeById(metadata.frame1Id);
      const frame2 = figma.getNodeById(metadata.frame2Id);

      if (!frame1 || !frame2) {
        nonModifiable.push({
          connectionId,
          reason: "One or both connected frames no longer exist",
        });
        continue;
      }

      if (frame1.type !== "FRAME" || frame2.type !== "FRAME") {
        nonModifiable.push({
          connectionId,
          reason: "Connected nodes are not frames",
        });
        continue;
      }

      // Check if frames are accessible (not in a locked parent)
      if (
        this.isNodeOrParentLocked(frame1) ||
        this.isNodeOrParentLocked(frame2)
      ) {
        nonModifiable.push({
          connectionId,
          reason:
            "One or both connected frames are locked or in a locked container",
        });
        continue;
      }

      // Connection passed all checks
      modifiable.push(connectionId);
    }

    return { modifiable, nonModifiable };
  }

  /**
   * Check if a node or any of its parents are locked
   */
  private isNodeOrParentLocked(node: BaseNode): boolean {
    let current: BaseNode | null = node;

    while (current) {
      if ("locked" in current && current.locked) {
        return true;
      }
      current = current.parent;
    }

    return false;
  }

  /**
   * Validate bulk update permissions for connections (Requirements: 4.1, 4.6)
   */
  validateBulkUpdate(connectionIds: string[]): {
    valid: boolean;
    errors: string[];
    warnings: string[];
    modifiableConnections: string[];
    nonModifiableConnections: Array<{ connectionId: string; reason: string }>;
  } {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (connectionIds.length === 0) {
      errors.push("No connections specified for bulk update");
      return {
        valid: false,
        errors,
        warnings,
        modifiableConnections: [],
        nonModifiableConnections: [],
      };
    }

    // Filter connections by modifiability
    const { modifiable, nonModifiable } =
      this.filterModifiableConnections(connectionIds);

    // Add warnings for non-modifiable connections
    if (nonModifiable.length > 0) {
      warnings.push(
        `${nonModifiable.length} connection(s) cannot be modified and will be skipped`
      );

      // Add specific reasons as additional warnings
      const reasonCounts = new Map<string, number>();
      nonModifiable.forEach(({ reason }) => {
        reasonCounts.set(reason, (reasonCounts.get(reason) || 0) + 1);
      });

      reasonCounts.forEach((count, reason) => {
        warnings.push(`${count} connection(s): ${reason}`);
      });
    }

    // Check if we have any modifiable connections left
    if (modifiable.length === 0) {
      errors.push("No connections can be modified");
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      modifiableConnections: modifiable,
      nonModifiableConnections: nonModifiable,
    };
  }

  /**
   * Get detailed connection information for bulk operations
   */
  getConnectionDetails(connectionIds: string[]): Array<{
    connectionId: string;
    connectionName: string;
    frame1: { id: string; name: string } | null;
    frame2: { id: string; name: string } | null;
    isModifiable: boolean;
    reason?: string;
  }> {
    return connectionIds.map((connectionId) => {
      const connection = figma.getNodeById(connectionId) as GroupNode | null;

      if (!connection) {
        return {
          connectionId,
          connectionName: "Unknown Connection",
          frame1: null,
          frame2: null,
          isModifiable: false,
          reason: "Connection not found",
        };
      }

      const metadata = this.connectionManager.getConnectionMetadata(connection);
      let frame1 = null;
      let frame2 = null;

      if (metadata) {
        const f1 = figma.getNodeById(metadata.frame1Id) as FrameNode | null;
        const f2 = figma.getNodeById(metadata.frame2Id) as FrameNode | null;

        if (f1) frame1 = { id: f1.id, name: f1.name };
        if (f2) frame2 = { id: f2.id, name: f2.name };
      }

      const { modifiable, nonModifiable } = this.filterModifiableConnections([
        connectionId,
      ]);
      const isModifiable = modifiable.length > 0;
      const reason =
        nonModifiable.length > 0 ? nonModifiable[0].reason : undefined;

      return {
        connectionId,
        connectionName: connection.name || "Unnamed Connection",
        frame1,
        frame2,
        isModifiable,
        reason,
      };
    });
  }

  /**
   * Validate bulk connection operation with enhanced error reporting
   * Requirements: 3.5, 5.4, 5.5 - User-friendly error messages with context
   */
  validateBulkConnection(frameIds: string[]): {
    valid: boolean;
    errors: string[];
    warnings: string[];
    frameDetails: Array<{
      id: string;
      name: string;
      exists: boolean;
      accessible: boolean;
      locked: boolean;
      reason?: string;
    }>;
  } {
    const errors: string[] = [];
    const warnings: string[] = [];
    const frameDetails: Array<{
      id: string;
      name: string;
      exists: boolean;
      accessible: boolean;
      locked: boolean;
      reason?: string;
    }> = [];

    if (frameIds.length < 2) {
      errors.push(
        "At least 2 frames must be selected for bulk connection creation"
      );
      return { valid: false, errors, warnings, frameDetails };
    }

    if (frameIds.length > 20) {
      warnings.push(
        "Creating connections between many frames may take some time"
      );
    }

    // Detailed frame validation
    for (const frameId of frameIds) {
      const frame = figma.getNodeById(frameId) as FrameNode | null;

      if (!frame) {
        frameDetails.push({
          id: frameId,
          name: "Unknown Frame",
          exists: false,
          accessible: false,
          locked: false,
          reason: "Frame not found or has been deleted",
        });
        continue;
      }

      if (frame.type !== "FRAME") {
        frameDetails.push({
          id: frameId,
          name: frame.name,
          exists: true,
          accessible: false,
          locked: false,
          reason: "Selected node is not a frame",
        });
        continue;
      }

      const isLocked = this.isNodeOrParentLocked(frame);
      const isAccessible = !isLocked && frame.visible !== false;

      frameDetails.push({
        id: frameId,
        name: frame.name,
        exists: true,
        accessible: isAccessible,
        locked: isLocked,
        reason: isLocked
          ? "Frame or parent is locked"
          : !isAccessible
          ? "Frame is not accessible"
          : undefined,
      });
    }

    // Check for inaccessible frames
    const inaccessibleFrames = frameDetails.filter((f) => !f.accessible);
    if (inaccessibleFrames.length > 0) {
      errors.push(
        `${inaccessibleFrames.length} frame${
          inaccessibleFrames.length !== 1 ? "s are" : " is"
        } not accessible: ${inaccessibleFrames.map((f) => f.name).join(", ")}`
      );
    }

    // Check for existing connections to avoid duplicates
    const accessibleFrameIds = frameDetails
      .filter((f) => f.accessible)
      .map((f) => f.id);
    if (accessibleFrameIds.length >= 2) {
      const existingConnections =
        this.getConnectionsForFrames(accessibleFrameIds);
      if (existingConnections.length > 0) {
        warnings.push(
          `${existingConnections.length} connection${
            existingConnections.length !== 1 ? "s" : ""
          } already exist between selected frames and will be skipped`
        );
      }
    }

    // Final validation
    if (accessibleFrameIds.length < 2) {
      errors.push(
        "At least 2 accessible frames are required for bulk connection creation"
      );
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      frameDetails,
    };
  }

  /**
   * Get connections associated with selected frames and filter for bulk editing (Requirements: 4.1, 4.6)
   */
  getEditableConnectionsForFrames(frameIds: string[]): {
    allConnections: string[];
    editableConnections: string[];
    nonEditableConnections: Array<{ connectionId: string; reason: string }>;
    summary: {
      total: number;
      editable: number;
      nonEditable: number;
    };
  } {
    // Get all connections associated with the selected frames
    const associatedConnections = this.getConnectionsForFrames(frameIds);
    const allConnectionIds = associatedConnections.map((conn) => conn.id);

    // Filter for modifiable connections
    const { modifiable, nonModifiable } =
      this.filterModifiableConnections(allConnectionIds);

    return {
      allConnections: allConnectionIds,
      editableConnections: modifiable,
      nonEditableConnections: nonModifiable,
      summary: {
        total: allConnectionIds.length,
        editable: modifiable.length,
        nonEditable: nonModifiable.length,
      },
    };
  }

  /**
   * Get current operation progress
   */
  getOperationProgress(operationId: string): OperationProgress | null {
    return this.progressTracker.getProgress(operationId);
  }

  /**
   * Get all active operations
   */
  getActiveOperations(): OperationProgress[] {
    return this.progressTracker.getActiveOperations();
  }

  /**
   * Cancel a bulk operation
   */
  cancelOperation(operationId: string): boolean {
    return this.progressTracker.cancelOperation(operationId);
  }

  /**
   * Subscribe to progress updates for an operation
   */
  subscribeToProgress(
    operationId: string,
    callback: ProgressCallback
  ): () => void {
    return this.progressTracker.subscribe(operationId, callback);
  }

  /**
   * Generate enhanced operation summary with user-friendly error information
   * Requirements: 3.5, 5.4, 5.5 - User-friendly error messages with context
   */
  generateOperationSummary(
    result: BulkOperationResult,
    operationType: "create" | "update"
  ): {
    summary: string;
    details: {
      total: number;
      successful: number;
      failed: number;
      retryable: number;
      nonRetryable: number;
    };
    suggestions: string[];
  } {
    const { successful, failed } = result;
    const total = successful + failed;

    // Import error handler for enhanced processing
    const { BulkErrorHandler } = require("../utils/bulkErrorHandler");
    const enhancedErrors = BulkErrorHandler.enhanceErrors(result.errors || []);
    const errorSummary = BulkErrorHandler.generateErrorSummary(enhancedErrors);

    let summary = "";
    if (failed === 0) {
      summary = `Successfully ${
        operationType === "create" ? "created" : "updated"
      } all ${total} connection${total !== 1 ? "s" : ""}!`;
    } else if (successful === 0) {
      summary = `Failed to ${operationType} any connections. Review the errors below and try again.`;
    } else {
      summary = `Partially completed: ${successful} successful, ${failed} failed. ${
        errorSummary.retryableErrors
      } error${errorSummary.retryableErrors !== 1 ? "s" : ""} can be retried.`;
    }

    return {
      summary,
      details: {
        total,
        successful,
        failed,
        retryable: errorSummary.retryableErrors,
        nonRetryable: errorSummary.nonRetryableErrors,
      },
      suggestions: errorSummary.topSuggestions,
    };
  }

  /**
   * Retry failed operations from a previous bulk operation
   */
  async retryFailedOperations(
    originalResult: BulkOperationResult,
    config: BulkOperationConfig,
    progressCallback?: ProgressCallback
  ): Promise<BulkOperationResult> {
    if (!originalResult.errors || originalResult.errors.length === 0) {
      return {
        successful: 0,
        failed: 0,
        errors: [{ error: "No failed operations to retry" }],
      };
    }

    // Extract retryable items from errors
    const retryableItems: Array<{
      frameIds?: string[];
      connectionId?: string;
    }> = [];

    for (const error of originalResult.errors) {
      // Only retry if error message indicates it's retryable
      if (error.error.includes("(retryable)")) {
        retryableItems.push({
          frameIds: error.frameIds,
          connectionId: error.connectionId,
        });
      }
    }

    if (retryableItems.length === 0) {
      return {
        successful: 0,
        failed: 0,
        errors: [{ error: "No retryable operations found" }],
      };
    }

    // Create new config for retry
    const retryConfig: BulkOperationConfig = Object.assign({}, config, {
      selectedFrameIds: retryableItems
        .filter((item) => item.frameIds)
        .flatMap((item) => item.frameIds || []),
      targetConnectionIds: retryableItems
        .filter((item) => item.connectionId)
        .map((item) => item.connectionId!)
        .filter((id) => id !== undefined),
    });

    // Execute retry based on operation type
    if (config.operationType === "create") {
      return await this.createBulkConnections(retryConfig, progressCallback);
    } else {
      return await this.updateBulkConnections(retryConfig, progressCallback);
    }
  }
}
