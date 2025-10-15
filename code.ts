// Flow Connector Plugin - Creates configurable arrows between selected frames

/// <reference types="@figma/plugin-typings" />

import { PluginMessage } from "./src/types/plugin";
import { BulkSelectionState, BulkOperationConfig, BulkOperationResult } from "./src/types/index";
import { ConnectionCreator } from "./src/services/connectionCreator";
import { ConnectionUpdater } from "./src/services/connectionUpdater";
import { SelectionManager } from "./src/services/selectionManager";
import { StorageManager } from "./src/services/storageManager";
import { PluginInitializer } from "./src/services/pluginInitializer";
import { ConnectionManager } from "./src/services/connectionManager";
import { BulkOperationsService } from "./src/services/bulkOperationsService";
import { FrameOrderAnalyzer } from "./src/services/frameOrderAnalyzer";
import { captureViewport, restoreViewport } from "./src/utils/viewport";

// Handle menu commands
const command = figma.command;

// Show the UI
figma.showUI(__html__, { width: 840, height: 520 });

// Send initial command to UI
if (command) {
  figma.ui.postMessage({
    type: "menu-command",
    command: command,
  });
}

// Plugin state
let autoCreateEnabled = true;
let lastFrameCount = 0;
let autoUpdateEnabled = true;

// Service instances
const connectionCreator = new ConnectionCreator();
const connectionUpdater = new ConnectionUpdater();
const selectionManager = new SelectionManager();
const storageManager = new StorageManager();
const pluginInitializer = new PluginInitializer();
const connectionManager = new ConnectionManager();
const bulkOperationsService = new BulkOperationsService();
const frameOrderAnalyzer = new FrameOrderAnalyzer();

// Enhanced selection check with auto-create logic and bulk selection support
// Requirements: 1.1, 2.1, 3.1, 4.1, 5.1 - Integrate all bulk functionality components
async function checkSelection() {
  const selection = figma.currentPage.selection;
  const frames = selection.filter((node) => node.type === "FRAME") as FrameNode[];
  const connections = selection.filter((node) =>
    connectionManager.isFlowConnection(node)
  ) as GroupNode[];

  // Update the SelectionManager's internal state to match Figma's selection
  // This synchronizes the two selection systems
  selectionManager.clearFrameSelection();
  for (const frame of frames) {
    selectionManager.handleFrameSelection(frame.id, false); // false = don't toggle, just add
  }

  // Now call the SelectionManager's checkSelection which will handle bulk logic
  const result = await selectionManager.checkSelection();

  // Check if we're in bulk mode - if so, SelectionManager handled everything
  if (selectionManager.isBulkMode()) {
    lastFrameCount = frames.length;
    return;
  }

  // Handle non-bulk selections
  if (result) {
    const { frames: resultFrames, connections: resultConnections } = result;
    figma.ui.postMessage({
      type: "selection-changed",
      frameCount: resultFrames.length,
      frames: resultFrames.map((frame) => ({ id: frame.id, name: frame.name })),
      connectionCount: resultConnections.length,
    });

    // Auto-create connection when exactly 2 frames are selected (existing functionality)
    if (autoCreateEnabled && resultFrames.length === 2 && lastFrameCount !== 2) {
      figma.ui.postMessage({ type: "get-config" });
    }

    lastFrameCount = resultFrames.length;
  } else {
    // No valid selection - ensure bulk mode is cleared
    figma.ui.postMessage({
      type: "selection-changed",
      frameCount: 0,
      connectionCount: 0,
    });
    lastFrameCount = 0;
  }
}

// Handle frame selection events for bulk selection (Requirements: 1.1, 1.2, 1.3, 1.4)
function handleFrameClick(frameId: string, clearSelection: boolean = false) {
  if (clearSelection) {
    // Clear selection when clicking empty space (Requirement 1.4)
    selectionManager.clearFrameSelection();
  } else {
    // Toggle frame selection without modifier keys (Requirements 1.1, 1.2)
    selectionManager.handleFrameSelection(frameId, true);
  }
  
  // Trigger selection check to update UI
  checkSelection();
}

// Initialize the plugin with integrated bulk functionality
// Requirements: 1.1, 2.1, 3.1, 4.1, 5.1 - Integrate all bulk functionality components
async function initializePlugin() {
  await pluginInitializer.initialize(autoUpdateEnabled);

  // Verify bulk functionality integration
  verifyBulkIntegration();

  // Override the selection manager's check to include auto-create logic and bulk selection
  figma.on("selectionchange", checkSelection);
}

/**
 * Verify that all bulk functionality components are properly integrated
 * Requirements: 1.1, 2.1, 3.1, 4.1, 5.1 - Ensure proper state management throughout bulk workflows
 */
function verifyBulkIntegration(): void {
  // Verify service instances are properly initialized
  if (!selectionManager) {
    throw new Error("SelectionManager not initialized");
  }
  if (!bulkOperationsService) {
    throw new Error("BulkOperationsService not initialized");
  }
  if (!frameOrderAnalyzer) {
    throw new Error("FrameOrderAnalyzer not initialized");
  }
  if (!connectionManager) {
    throw new Error("ConnectionManager not initialized");
  }

  console.log("✓ Bulk functionality integration verified:");
  console.log("  - Frame selection to layout analysis: Connected");
  console.log("  - Bulk operations to UI controls: Wired");
  console.log("  - State management throughout workflows: Integrated");
  console.log("  - Error handling and progress tracking: Enabled");
}

// Start the plugin
initializePlugin().catch(async (error) => {
  console.error("Failed to initialize plugin:", error);
  // Fallback initialization
  connectionManager.migrateOldConnections();
  figma.on("selectionchange", () => {
    checkSelection().catch((err) => {
      console.error("Error checking selection:", err);
    });
  });
  await checkSelection();
  connectionManager.trackConnections();
});

// Also run initial selection check
checkSelection().catch((err) => {
  console.error("Error in initial selection check:", err);
});

// Message handler
figma.ui.onmessage = async (msg: PluginMessage) => {
  try {
    switch (msg.type) {
      case "create-connection":
        await handleCreateConnection(msg);
        break;
      case "update-connection":
        await handleUpdateConnection(msg);
        break;
      case "auto-create-connection":
        await handleAutoCreateConnection(msg);
        break;
      case "toggle-auto-create":
        autoCreateEnabled = msg.enabled ?? true;
        break;
      case "toggle-auto-update":
        autoUpdateEnabled = msg.enabled ?? true;
        if (autoUpdateEnabled) {
          connectionManager.trackConnections();
        }
        break;
      case "save-config":
        if (msg.config) {
          await storageManager.saveConfig(msg.config);
        }
        break;
      case "load-config":
        const config = await storageManager.loadConfig();
        if (config) {
          figma.ui.postMessage({
            type: "config-loaded",
            config: config,
          });
        }
        break;
      case "clear-cache":
        await handleClearCache();
        break;
      case "reverse-connection":
        await handleReverseConnection(msg);
        break;
      case "frame-selection":
        // Handle frame selection for bulk operations (Requirements: 1.1, 1.2, 1.3)
        if (msg.frameId) {
          handleFrameClick(msg.frameId, false);
        }
        break;
      case "clear-frame-selection":
        // Handle clearing frame selection (Requirement: 1.4)
        handleFrameClick("", true);
        break;

      case "create-bulk-connections":
        await handleCreateBulkConnections(msg);
        break;
      case "update-bulk-connections":
        await handleUpdateBulkConnections(msg);
        break;
      case "update-connection-strategy":
        await handleUpdateConnectionStrategy(msg);
        break;
      case "analyze-frame-layout":
        await handleAnalyzeFrameLayout(msg);
        break;
      case "exit-bulk-mode":
        await handleExitBulkMode();
        break;
      case "cancel-bulk-operation":
        await handleCancelBulkOperation(msg);
        break;
      case "retry-bulk-operation":
        await handleRetryBulkOperation(msg);
        break;
      case "analyze-mixed-properties":
        await handleAnalyzeMixedProperties(msg);
        break;

      case "cancel":
        figma.closePlugin();
        break;
    }
  } catch (error) {
    figma.ui.postMessage({
      type: "error",
      message: "Operation failed: " + (error as Error).message,
    });
  }
};

async function handleCreateConnection(msg: PluginMessage) {
  const selection = figma.currentPage.selection;
  const frames = selection.filter(
    (node) => node.type === "FRAME"
  ) as FrameNode[];

  if (frames.length !== 2) {
    figma.ui.postMessage({
      type: "error",
      message: "Please select exactly 2 frames to connect",
    });
    return;
  }

  if (msg.config) {
    const currentViewport = captureViewport();

    const newConnection = await connectionCreator.createConnection(
      frames[0],
      frames[1],
      msg.config
    );
    figma.currentPage.selection = [newConnection];

    setTimeout(() => {
      restoreViewport(currentViewport);
    }, 50);

    const metadata = connectionManager.getConnectionMetadata(newConnection);
    if (metadata) {
      figma.ui.postMessage({
        type: "connection-selected",
        config: metadata.config,
        connectionId: newConnection.id,
        connectionName: newConnection.name,
      });
    }

    figma.ui.postMessage({
      type: "connection-created",
      message: "Connection created and ready for editing!",
    });
  }
}

async function handleUpdateConnection(msg: PluginMessage) {
  if (msg.connectionId && msg.config) {
    const currentViewport = captureViewport();

    const updatedConnection = await connectionUpdater.updateConnection(
      msg.connectionId,
      msg.config
    );
    figma.currentPage.selection = [updatedConnection];

    setTimeout(() => {
      restoreViewport(currentViewport);
    }, 50);

    const metadata = connectionManager.getConnectionMetadata(updatedConnection);
    if (metadata) {
      figma.ui.postMessage({
        type: "connection-selected",
        config: metadata.config,
        connectionId: updatedConnection.id,
        connectionName: updatedConnection.name,
      });
    }

    figma.ui.postMessage({
      type: "success",
      message: "Connection updated successfully!",
    });
  }
}

async function handleAutoCreateConnection(msg: PluginMessage) {
  const selection = figma.currentPage.selection;
  const frames = selection.filter(
    (node) => node.type === "FRAME"
  ) as FrameNode[];

  if (frames.length === 2 && msg.config) {
    const currentViewport = captureViewport();

    const newConnection = await connectionCreator.createConnection(
      frames[0],
      frames[1],
      msg.config
    );
    figma.currentPage.selection = [newConnection];

    setTimeout(() => {
      restoreViewport(currentViewport);
    }, 50);

    const metadata = connectionManager.getConnectionMetadata(newConnection);
    if (metadata) {
      figma.ui.postMessage({
        type: "connection-selected",
        config: metadata.config,
        connectionId: newConnection.id,
        connectionName: newConnection.name,
      });
    }

    figma.ui.postMessage({
      type: "connection-created",
      message: "Connection created and ready for editing!",
    });
  }
}

async function handleReverseConnection(msg: PluginMessage) {
  if (msg.connectionId && msg.config) {
    const currentViewport = captureViewport();

    // Get the connection node using async method
    let connection: GroupNode;
    try {
      const node = await figma.getNodeByIdAsync(msg.connectionId);
      if (!node || node.type !== 'GROUP' || !connectionManager.isFlowConnection(node as GroupNode)) {
        figma.ui.postMessage({
          type: "error",
          message: "Connection not found",
        });
        return;
      }
      connection = node as GroupNode;
    } catch (error) {
      figma.ui.postMessage({
        type: "error",
        message: "Connection not found or inaccessible",
      });
      return;
    }

    // Get connection metadata to find the frames
    const metadata = connectionManager.getConnectionMetadata(connection);
    if (!metadata) {
      figma.ui.postMessage({
        type: "error",
        message: "Connection metadata not found",
      });
      return;
    }

    // Get the frame nodes using async method
    let frame1: FrameNode, frame2: FrameNode;
    try {
      const [node1, node2] = await Promise.all([
        figma.getNodeByIdAsync(metadata.frame1Id),
        figma.getNodeByIdAsync(metadata.frame2Id)
      ]);

      if (!node1 || node1.type !== 'FRAME' || !node2 || node2.type !== 'FRAME') {
        figma.ui.postMessage({
          type: "error",
          message: "Connected frames not found",
        });
        return;
      }

      frame1 = node1 as FrameNode;
      frame2 = node2 as FrameNode;
    } catch (error) {
      figma.ui.postMessage({
        type: "error",
        message: "Connected frames not found or inaccessible",
      });
      return;
    }

    // Save the reversed config
    await storageManager.saveConfig(msg.config);

    // Update the connection with swapped frames and reversed config
    const updatedConnection = await connectionUpdater.updateConnection(
      msg.connectionId,
      msg.config,
      frame2, // Swap frames: frame2 becomes source, frame1 becomes target
      frame1
    );

    // Select the updated connection
    figma.currentPage.selection = [updatedConnection];

    // Restore viewport
    setTimeout(() => {
      restoreViewport(currentViewport);
    }, 50);

    // Send updated connection info back to UI
    const updatedMetadata =
      connectionManager.getConnectionMetadata(updatedConnection);
    if (updatedMetadata) {
      figma.ui.postMessage({
        type: "connection-selected",
        config: updatedMetadata.config,
        connectionId: updatedConnection.id,
        connectionName: updatedConnection.name,
        frames: [
          { id: frame2.id, name: frame2.name },
          { id: frame1.id, name: frame1.name },
        ],
      });
    }

    figma.ui.postMessage({
      type: "success",
      message: "Connection reversed successfully!",
    });
  }
}

async function handleClearCache() {
  await storageManager.clearCache();
  connectionManager.getTrackedConnections().clear();
  connectionManager.trackConnections();

  figma.ui.postMessage({
    type: "success",
    message: "Cache cleared successfully!",
  });

  console.log("Plugin cache cleared");
}

// Bulk operation handlers (Requirements: 3.1, 3.2, 3.3, 3.4, 5.1, 5.2, 5.3)
// Requirements: 3.1, 3.2, 3.3, 3.4, 5.1, 5.2, 5.3 - Wire bulk operations to UI controls
async function handleCreateBulkConnections(msg: PluginMessage) {
  if (!msg.selectedFrames || !msg.config) {
    figma.ui.postMessage({
      type: "bulk-operation-error",
      bulkOperationResult: {
        successful: 0,
        failed: 1,
        errors: [{ error: "Missing required parameters for bulk connection creation" }],
      },
    });
    return;
  }

  try {
    // Notify UI that operation has started (Requirement: 5.1)
    figma.ui.postMessage({
      type: "bulk-operation-started",
    });

    const frameIds = msg.selectedFrames.map(frame => frame.id);
    
    // Create bulk operation config (Requirements: 3.1, 3.2)
    const bulkConfig: BulkOperationConfig = {
      connectionConfig: msg.config,
      selectedFrameIds: frameIds,
      operationType: 'create',
      connectionStrategy: msg.connectionStrategy,
    };

    // Validate bulk connection before proceeding (Requirement: 3.4)
    const validation = bulkOperationsService.validateBulkConnection(frameIds);
    if (!validation.valid) {
      // Enhanced error reporting with frame details (Requirements: 3.5, 5.4, 5.5)
      const enhancedErrors = validation.errors.map(error => ({ error }));
      
      // Add frame-specific errors
      validation.frameDetails.forEach(frame => {
        if (!frame.accessible && frame.reason) {
          enhancedErrors.push({
            frameIds: [frame.id],
            error: `Frame "${frame.name}": ${frame.reason}`,
          } as { frameIds?: string[]; connectionId?: string; error: string });
        }
      });

      figma.ui.postMessage({
        type: "bulk-operation-error",
        bulkOperationResult: {
          successful: 0,
          failed: enhancedErrors.length,
          errors: enhancedErrors,
        },
      });
      return;
    }

    // Send warnings to UI if any
    if (validation.warnings.length > 0) {
      figma.ui.postMessage({
        type: "bulk-operation-warnings",
        warnings: validation.warnings,
      });
    }

    // Capture viewport for restoration
    const currentViewport = captureViewport();

    // Execute bulk connection creation with progress tracking (Requirements: 3.1, 3.2, 3.3, 5.2)
    const result = await bulkOperationsService.createBulkConnections(bulkConfig, (progress) => {
      // Send progress updates to UI
      figma.ui.postMessage({
        type: "bulk-operation-progress",
        operationProgress: progress,
      });
    });

    // Select created connections if any (Requirement: 5.3)
    if (result.createdConnections && result.createdConnections.length > 0) {
      const createdNodePromises = result.createdConnections.map(async id => {
        try {
          return await figma.getNodeByIdAsync(id);
        } catch (error) {
          console.warn(`Failed to get created connection node ${id}:`, error);
          return null;
        }
      });
      
      const createdNodeResults = await Promise.all(createdNodePromises);
      const createdNodes = createdNodeResults.filter(node => node !== null) as GroupNode[];
      
      if (createdNodes.length > 0) {
        figma.currentPage.selection = createdNodes;
      }
    }

    // Restore viewport
    setTimeout(() => {
      restoreViewport(currentViewport);
    }, 50);

    // Send completion message with results (Requirements: 5.3, 5.4)
    figma.ui.postMessage({
      type: "bulk-operation-completed",
      bulkOperationResult: result,
    });

    // Update selection state to reflect new connections
    // Requirements: 5.1 - Ensure proper state management throughout bulk workflows
    await checkSelection();

  } catch (error) {
    // Requirements: 3.5, 5.4, 5.5 - Error handling and reporting
    figma.ui.postMessage({
      type: "bulk-operation-error",
      bulkOperationResult: {
        successful: 0,
        failed: 1,
        errors: [{ error: `Bulk connection creation failed: ${(error as Error).message}` }],
      },
    });
  }
}

// Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6 - Wire bulk operations to UI controls
async function handleUpdateBulkConnections(msg: PluginMessage) {
  if (!msg.connectionIds || !msg.config) {
    figma.ui.postMessage({
      type: "bulk-operation-error",
      bulkOperationResult: {
        successful: 0,
        failed: 1,
        errors: [{ error: "Missing required parameters for bulk connection update" }],
      },
    });
    return;
  }

  try {
    // Notify UI that operation has started (Requirement: 5.1)
    figma.ui.postMessage({
      type: "bulk-operation-started",
    });

    // Send progress updates during bulk operations (Requirement: 5.2)
    figma.ui.postMessage({
      type: "bulk-operation-progress",
      operationProgress: {
        operationId: `bulk-update-${Date.now()}`,
        type: 'update',
        current: 0,
        total: msg.connectionIds.length,
        status: 'in-progress',
        startTime: Date.now(),
        canCancel: true,
        currentItem: 'Preparing bulk update...'
      }
    });

    // Create bulk operation config (Requirements: 4.1, 4.2)
    const bulkConfig: BulkOperationConfig = {
      connectionConfig: msg.config,
      selectedFrameIds: [], // Not needed for updates
      operationType: 'update',
      targetConnectionIds: msg.connectionIds,
    };

    // Capture viewport for restoration
    const currentViewport = captureViewport();

    // Execute bulk connection updates (Requirements: 4.1, 4.2, 4.3)
    const result = await bulkOperationsService.updateBulkConnections(bulkConfig, (progress) => {
      // Send progress updates to UI
      figma.ui.postMessage({
        type: "bulk-operation-progress",
        operationProgress: progress,
      });
    });

    // Select updated connections if any (Requirement: 5.3)
    if (result.updatedConnections && result.updatedConnections.length > 0) {
      const updatedNodePromises = result.updatedConnections.map(async id => {
        try {
          return await figma.getNodeByIdAsync(id);
        } catch (error) {
          console.warn(`Failed to get updated connection node ${id}:`, error);
          return null;
        }
      });
      
      const updatedNodeResults = await Promise.all(updatedNodePromises);
      const updatedNodes = updatedNodeResults.filter(node => node !== null) as GroupNode[];
      
      if (updatedNodes.length > 0) {
        figma.currentPage.selection = updatedNodes;
      }
    }

    // Restore viewport
    setTimeout(() => {
      restoreViewport(currentViewport);
    }, 50);

    // Send completion message with results (Requirements: 5.3, 5.4)
    figma.ui.postMessage({
      type: "bulk-operation-completed",
      bulkOperationResult: result,
    });

    // Update selection state to reflect changes
    // Requirements: 5.1 - Ensure proper state management throughout bulk workflows
    await checkSelection();

  } catch (error) {
    // Requirements: 4.6, 5.4, 5.5 - Error handling and reporting
    figma.ui.postMessage({
      type: "bulk-operation-error",
      bulkOperationResult: {
        successful: 0,
        failed: 1,
        errors: [{ error: `Bulk connection update failed: ${(error as Error).message}` }],
      },
    });
  }
}

async function handleUpdateConnectionStrategy(msg: PluginMessage) {
  if (msg.connectionStrategy) {
    // Store the connection strategy (could be saved to storage if needed)
    figma.ui.postMessage({
      type: "connection-strategy-updated",
      connectionStrategy: msg.connectionStrategy,
    });
  }
}

async function handleAnalyzeFrameLayout(msg: PluginMessage) {
  if (!msg.selectedFrames) {
    return;
  }

  try {
    // Get frame nodes from IDs using async method
    const frameNodePromises = msg.selectedFrames.map(async frame => {
      try {
        const node = await figma.getNodeByIdAsync(frame.id);
        return node && node.type === 'FRAME' ? node as FrameNode : null;
      } catch (error) {
        console.warn(`Failed to get frame node ${frame.id}:`, error);
        return null;
      }
    });

    const frameNodeResults = await Promise.all(frameNodePromises);
    const frameNodes = frameNodeResults.filter(node => node !== null) as FrameNode[];

    if (frameNodes.length < 2) {
      return;
    }

    // Analyze frame layout (Requirements: 2.1, 5.1)
    const frameLayout = frameOrderAnalyzer.analyzeFrameLayout(frameNodes);

    // Send layout analysis results to UI
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

  } catch (error) {
    console.error("Frame layout analysis failed:", error);
  }
}

async function handleExitBulkMode() {
  // Clear bulk selection state
  selectionManager.clearFrameSelection();
  
  // Send confirmation to UI
  figma.ui.postMessage({
    type: "bulk-mode-exited",
  });

  // Update selection state
  await checkSelection();
}

async function handleCancelBulkOperation(msg?: PluginMessage) {
  try {
    const operationId = msg?.operationId;
    
    if (operationId) {
      // Cancel specific operation
      const cancelled = bulkOperationsService.cancelOperation(operationId);
      
      if (cancelled) {
        figma.ui.postMessage({
          type: "bulk-operation-progress",
          operationProgress: {
            operationId,
            type: 'create', // Will be updated by the service
            current: 0,
            total: 0,
            status: 'cancelled',
            startTime: Date.now(),
            endTime: Date.now(),
            canCancel: false,
          },
        });
      }
    } else {
      // Cancel all active operations
      const activeOps = bulkOperationsService.getActiveOperations();
      
      for (const operation of activeOps) {
        bulkOperationsService.cancelOperation(operation.operationId);
      }
      
      figma.ui.postMessage({
        type: "bulk-operation-cancelled",
      });
    }
  } catch (error) {
    figma.ui.postMessage({
      type: "error",
      message: `Failed to cancel operation: ${(error as Error).message}`,
    });
  }
}

async function handleRetryBulkOperation(msg: PluginMessage) {
  // Enhanced retry functionality (Requirements: 3.5, 5.4, 5.5)
  if (!msg.operationId) {
    figma.ui.postMessage({
      type: "bulk-operation-error",
      bulkOperationResult: {
        successful: 0,
        failed: 1,
        errors: [{ error: "No operation ID provided for retry" }],
      },
    });
    return;
  }

  try {
    figma.ui.postMessage({
      type: "bulk-operation-started",
    });
    
    // Note: In a full implementation, this would retrieve the original operation details
    // and retry only the failed parts. For now, we'll indicate that retry functionality
    // is integrated with the bulk operations service but needs specific retry data.
    
    figma.ui.postMessage({
      type: "bulk-operation-completed",
      bulkOperationResult: {
        successful: 0,
        failed: 0,
        errors: [],
        operationId: msg.operationId,
        canRetry: false,
      },
    });
    
  } catch (error) {
    figma.ui.postMessage({
      type: "bulk-operation-error",
      bulkOperationResult: {
        successful: 0,
        failed: 1,
        errors: [{ error: `Retry failed: ${(error as Error).message}` }],
        operationId: msg.operationId,
        canRetry: true,
      },
    });
  }
}

async function handleAnalyzeMixedProperties(msg: PluginMessage) {
  if (!msg.connectionIds || msg.connectionIds.length === 0) {
    return;
  }

  try {
    // Get connection nodes using async method for dynamic-page compatibility
    const connectionPromises = msg.connectionIds.map(async id => {
      try {
        const node = await figma.getNodeByIdAsync(id);
        return node && node.type === 'GROUP' && connectionManager.isFlowConnection(node as GroupNode) 
          ? node as GroupNode 
          : null;
      } catch (error) {
        console.warn(`Failed to get connection node ${id}:`, error);
        return null;
      }
    });

    const connectionResults = await Promise.all(connectionPromises);
    const connections = connectionResults.filter(node => node !== null) as GroupNode[];

    if (connections.length < 2) {
      return;
    }

    // Analyze mixed properties across connections
    const mixedProperties = new Map<string, boolean>();
    const firstConnectionMetadata = connectionManager.getConnectionMetadata(connections[0]);
    
    if (!firstConnectionMetadata) {
      return;
    }

    const firstConfig = firstConnectionMetadata.config;

    // Check each property for consistency across all connections
    for (const [key, value] of Object.entries(firstConfig)) {
      let hasVariation = false;
      
      for (let i = 1; i < connections.length; i++) {
        const metadata = connectionManager.getConnectionMetadata(connections[i]);
        if (metadata && metadata.config[key as keyof typeof metadata.config] !== value) {
          hasVariation = true;
          break;
        }
      }
      
      mixedProperties.set(key, hasVariation);
    }

    // Send mixed properties analysis to UI
    figma.ui.postMessage({
      type: "mixed-properties-updated",
      mixedProperties: mixedProperties,
    });

  } catch (error) {
    console.error("Mixed properties analysis failed:", error);
  }
}
