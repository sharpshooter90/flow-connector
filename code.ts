// Flow Connector Plugin - Creates configurable arrows between selected frames

/// <reference types="@figma/plugin-typings" />

import { PluginMessage } from "./src/types/plugin";
import { ConnectionCreator } from "./src/services/connectionCreator";
import { ConnectionUpdater } from "./src/services/connectionUpdater";
import { SelectionManager } from "./src/services/selectionManager";
import { StorageManager } from "./src/services/storageManager";
import { PluginInitializer } from "./src/services/pluginInitializer";
import { ConnectionManager } from "./src/services/connectionManager";
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

// Enhanced selection check with auto-create logic
async function checkSelection() {
  const result = await selectionManager.checkSelection();

  if (result) {
    const { frames } = result;

    // Auto-create connection when exactly 2 frames are selected
    if (autoCreateEnabled && frames.length === 2 && lastFrameCount !== 2) {
      figma.ui.postMessage({ type: "get-config" });
    }

    lastFrameCount = frames.length;
  }
}

// Initialize the plugin
async function initializePlugin() {
  await pluginInitializer.initialize(autoUpdateEnabled);

  // Override the selection manager's check to include auto-create logic
  figma.on("selectionchange", checkSelection);
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

    // Get the connection node
    const connection = figma.getNodeById(msg.connectionId) as GroupNode;
    if (!connection || !connectionManager.isFlowConnection(connection)) {
      figma.ui.postMessage({
        type: "error",
        message: "Connection not found",
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

    // Get the frame nodes
    const frame1 = figma.getNodeById(metadata.frame1Id) as FrameNode;
    const frame2 = figma.getNodeById(metadata.frame2Id) as FrameNode;

    if (!frame1 || !frame2) {
      figma.ui.postMessage({
        type: "error",
        message: "Connected frames not found",
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
