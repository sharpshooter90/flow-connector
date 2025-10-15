import { useState, useCallback, useRef, useEffect } from "react";
import {
  AppState,
  FigmaMessage,
  defaultConfig,
  defaultConnectionStrategy,
  ConnectionConfig,
  ConnectionStrategy,
  BulkOperationResult,
  OperationProgress,
} from "./types";
import { useFigmaMessages, useDebouncedSave } from "./hooks/useFigmaMessages";
import MainContainer from "./components/MainContainer";
import BulkOperationResultComponent from "./components/ui/BulkOperationResult";
import { runIntegrationTests, logIntegrationResults } from "./utils/integrationVerification";

function App() {
  const [appState, setAppState] = useState<AppState>({
    config: defaultConfig,
    status: {
      type: "info",
      message: "Select 2 frames with Shift+Click to create a connection",
    },
    selectedConnectionId: null,
    selectedConnectionName: null,
    isEditingConnection: false,
    frameCount: 0,
    connectionCount: 0,
    connectedFrames: [],
    autoCreateEnabled: true,
    autoUpdateEnabled: true,
    activeTab: "arrow",
    // Bulk operation properties
    selectedFrames: [],
    isBulkMode: false,
    bulkSelectedConnections: [],
    bulkOperationInProgress: false,
    frameLayout: undefined,
    connectionStrategy: defaultConnectionStrategy,
    bulkEditableProperties: new Set(),
    mixedPropertyStates: new Map(),
  });

  const debouncedSave = useDebouncedSave();
  const sendMessageRef = useRef<((msg: any) => void) | null>(null);
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarTab, setSidebarTab] = useState<"properties" | "settings">(
    "properties"
  );
  const labelInputRef = useRef<HTMLInputElement>(null);
  const [pendingCommand, setPendingCommand] = useState<string | null>(null);
  
  // Bulk operation result state
  const [bulkOperationResult, setBulkOperationResult] = useState<{
    result: BulkOperationResult;
    operationType: 'create' | 'update';
  } | null>(null);
  
  // Track current bulk operation type
  const [currentBulkOperationType, setCurrentBulkOperationType] = useState<'create' | 'update' | null>(null);
  
  // Track active operations for progress display
  const [activeOperations, setActiveOperations] = useState<OperationProgress[]>([]);

  const handleFigmaMessage = useCallback((message: FigmaMessage) => {
    switch (message.type) {
      case "menu-command":
        // Store command for processing after component initialization
        if (message.command) {
          setPendingCommand(message.command);
        }
        break;

      case "selection-changed":
        const frameCount = message.frameCount || 0;
        const connectionCount = message.connectionCount || 0;
        setAppState((prev) => ({
          ...prev,
          frameCount,
          connectionCount,
          ...(connectionCount === 0
            ? {
                isEditingConnection: false,
                selectedConnectionId: null,
                selectedConnectionName: null,
                connectedFrames: [],
              }
            : {}),
          status: {
            type: "info",
            message:
              frameCount === 2
                ? "Ready to create connection"
                : "Select 2 frames with Shift+Click to create a connection",
          },
        }));
        break;

      case "bulk-selection-changed":
        const selectedFrames = message.selectedFrames || [];
        const isBulkMode = selectedFrames.length > 2;
        const frameLayout = message.frameLayout;
        
        setAppState((prev) => ({
          ...prev,
          selectedFrames,
          isBulkMode,
          frameLayout,
          // Clear single-frame editing state when entering bulk mode
          ...(isBulkMode
            ? {
                isEditingConnection: false,
                selectedConnectionId: null,
                selectedConnectionName: null,
                connectedFrames: [],
              }
            : {}),
          status: {
            type: "info",
            message: isBulkMode
              ? `${selectedFrames.length} frames selected - Bulk mode active${
                  frameLayout?.confidence && frameLayout.confidence < 0.7
                    ? " (scattered layout detected)"
                    : ""
                }`
              : selectedFrames.length === 2
              ? "Ready to create connection"
              : "Select frames to create connections",
          },
        }));

        // Automatically request layout analysis if not provided and we have enough frames
        if (isBulkMode && !frameLayout && selectedFrames.length > 2) {
          // Request layout analysis from plugin
          sendMessage({
            type: "analyze-frame-layout",
            selectedFrames,
          });
        }
        break;

      case "bulk-connections-updated":
        const bulkConnections = message.bulkConnections || [];
        const editableConnections = message.editableConnections || bulkConnections; // Fallback to all if not provided
        
        setAppState((prev) => ({
          ...prev,
          bulkSelectedConnections: editableConnections, // Use only editable connections
          // Update bulk editable properties based on selected connections
          bulkEditableProperties: new Set(Object.keys(prev.config) as Array<keyof ConnectionConfig>),
        }));

        // Show warning if some connections are not editable
        if (bulkConnections.length > editableConnections.length) {
          const nonEditableCount = bulkConnections.length - editableConnections.length;
          setAppState((prev) => ({
            ...prev,
            status: {
              type: "info",
              message: `${editableConnections.length} connections selected for editing (${nonEditableCount} connections cannot be modified)`,
            },
          }));
        }

        // Request mixed property analysis if we have bulk connections
        if (editableConnections.length > 1) {
          sendMessage({
            type: "analyze-mixed-properties",
            connectionIds: editableConnections,
          });
        }
        break;

      case "connection-selected":
        if (message.config && message.connectionId) {
          setAppState((prev) => ({
            ...prev,
            config: message.config!,
            selectedConnectionId: message.connectionId!,
            selectedConnectionName: message.connectionName || null,
            connectedFrames: message.frames || [],
            isEditingConnection: true,
            status: {
              type: "editing",
              message: `Editing: ${message.connectionName || "Connection"}`,
            },
          }));
        }
        break;

      case "config-loaded":
        if (message.config) {
          setAppState((prev) => ({
            ...prev,
            config: { ...prev.config, ...message.config },
          }));
        }
        break;

      case "connection-created":
        setAppState((prev) => ({
          ...prev,
          status: {
            type: "success",
            message: "Connection created successfully!",
          },
        }));
        break;

      case "get-config":
        console.log(
          "Received get-config request, sending auto-create with config:",
          appState.config
        );
        // Send current config back to Figma for auto-creation
        if (sendMessageRef.current) {
          sendMessageRef.current({
            type: "auto-create-connection",
            config: appState.config,
          });
        }
        break;

      case "bulk-operation-progress":
        const progress = message.operationProgress;
        if (progress) {
          // Update active operations list
          setActiveOperations((prev) => {
            const existing = prev.find(op => op.operationId === progress.operationId);
            if (existing) {
              // Update existing operation
              return prev.map(op => 
                op.operationId === progress.operationId ? progress : op
              );
            } else {
              // Add new operation
              return [...prev, progress];
            }
          });

          setAppState((prev) => ({
            ...prev,
            bulkOperationInProgress: progress.status === 'in-progress',
            currentOperation: progress,
            status: {
              type: progress.status === 'failed' ? 'error' : 'info',
              message: progress.status === 'in-progress'
                ? `Processing ${progress.current}/${progress.total} operations...`
                : progress.status === 'completed'
                ? `Bulk operation completed successfully`
                : `Bulk operation failed`,
            },
          }));
        }
        break;

      case "bulk-operation-completed":
        const result = message.bulkOperationResult;
        
        // Update active operations - mark as completed
        if (result?.operationId) {
          setActiveOperations((prev) => 
            prev.map(op => 
              op.operationId === result.operationId 
                ? { ...op, status: 'completed' as const, endTime: Date.now() }
                : op
            )
          );
        }

        setAppState((prev) => ({
          ...prev,
          bulkOperationInProgress: false,
          status: {
            type: result && result.failed > 0 ? 'error' : 'success',
            message: result
              ? `Bulk operation completed: ${result.successful} successful, ${result.failed} failed`
              : 'Bulk operation completed',
          },
        }));
        
        // Show bulk operation result dialog (Requirements: 3.5, 5.4, 5.5)
        if (result) {
          setBulkOperationResult({
            result,
            operationType: currentBulkOperationType || 'create',
          });
        }
        break;

      case "layout-analysis-updated":
        if (message.frameLayout) {
          setAppState((prev) => ({
            ...prev,
            frameLayout: message.frameLayout,
          }));
        }
        break;

      case "connection-strategy-updated":
        if (message.connectionStrategy) {
          setAppState((prev) => ({
            ...prev,
            connectionStrategy: message.connectionStrategy!,
          }));
        }
        break;

      case "mixed-properties-updated":
        // Handle mixed property states for bulk editing
        if (message.mixedProperties) {
          // Convert plain object back to Map for React state
          const mixedPropertiesMap = new Map(Object.entries(message.mixedProperties));
          setAppState((prev) => ({
            ...prev,
            mixedPropertyStates: mixedPropertiesMap,
          }));
        }
        break;

      case "bulk-operation-started":
        // Create a new operation progress entry
        const newOperationId = `op_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const newOperation: OperationProgress = {
          operationId: newOperationId,
          type: currentBulkOperationType || 'create',
          current: 0,
          total: 1, // Will be updated when we get actual progress
          status: 'pending',
          startTime: Date.now(),
          canCancel: true,
        };

        setActiveOperations((prev) => [...prev, newOperation]);

        setAppState((prev) => ({
          ...prev,
          bulkOperationInProgress: true,
          currentOperation: newOperation,
          status: {
            type: "info",
            message: "Starting bulk operation...",
          },
        }));
        break;

      case "bulk-operation-error":
        const errorResult = message.bulkOperationResult;
        
        // Update active operations - mark as failed
        if (errorResult?.operationId) {
          setActiveOperations((prev) => 
            prev.map(op => 
              op.operationId === errorResult.operationId 
                ? { ...op, status: 'failed' as const, endTime: Date.now() }
                : op
            )
          );
        }

        setAppState((prev) => ({
          ...prev,
          bulkOperationInProgress: false,
          status: {
            type: "error",
            message: errorResult?.errors?.[0]?.error || "Bulk operation failed",
          },
        }));
        
        // Show error result dialog (Requirements: 3.5, 5.4, 5.5)
        if (errorResult) {
          setBulkOperationResult({
            result: errorResult,
            operationType: currentBulkOperationType || 'create',
          });
        }
        break;

      case "layout-suggestions-updated":
        if (message.layoutSuggestions && message.frameLayout) {
          setAppState((prev) => ({
            ...prev,
            frameLayout: {
              ...prev.frameLayout!,
              suggestions: message.layoutSuggestions!,
            },
          }));
        }
        break;



      case "error":
        setAppState((prev) => ({
          ...prev,
          status: {
            type: "error",
            message: "An error occurred. Please try again.",
          },
        }));
        break;

      default:
        break;
    }
  }, []);

  const { sendMessage } = useFigmaMessages({ onMessage: handleFigmaMessage });

  // Store sendMessage in ref for use in message handler
  useEffect(() => {
    sendMessageRef.current = sendMessage;
  }, [sendMessage]);

  const openSidebar = useCallback((target: "properties" | "settings") => {
    setSidebarTab(target);
    setSidebarOpen(true);
  }, []);

  // Load initial config and settings when app starts
  useEffect(() => {
    sendMessage({ type: "load-config" });
    sendMessage({
      type: "toggle-auto-create",
      enabled: appState.autoCreateEnabled,
    });
    sendMessage({
      type: "toggle-auto-update",
      enabled: appState.autoUpdateEnabled,
    });
  }, [sendMessage]); // Only run once when component mounts

  // Integration verification effect - run tests when bulk state changes
  // Requirements: 1.1, 2.1, 3.1, 4.1, 5.1 - Ensure proper state management throughout bulk workflows
  useEffect(() => {
    if (appState.isBulkMode && appState.selectedFrames.length > 1) {
      // Run integration tests to verify bulk functionality is properly connected
      const testResults = runIntegrationTests(appState);
      
      // Log results in development mode
      if (process.env.NODE_ENV === 'development') {
        logIntegrationResults(testResults);
      }
      
      // Check for critical integration failures
      const criticalFailures = testResults.filter(result => 
        !result.passed && (
          result.testName.includes("Frame Selection") ||
          result.testName.includes("State Management")
        )
      );
      
      if (criticalFailures.length > 0) {
        console.warn("Critical bulk functionality integration issues detected:", criticalFailures);
      }
    }
  }, [appState.isBulkMode, appState.selectedFrames.length, appState.frameLayout, appState.bulkSelectedConnections.length]);

  const updateConfig = useCallback(
    (updates: Partial<ConnectionConfig>) => {
      const newConfig = { ...appState.config, ...updates };

      setAppState((prev) => ({
        ...prev,
        config: newConfig,
      }));

      // Debounced save to Figma
      debouncedSave(newConfig, sendMessage);

      // Auto-create or update connection if applicable
      if (appState.isEditingConnection && appState.selectedConnectionId) {
        sendMessage({
          type: "update-connection",
          connectionId: appState.selectedConnectionId,
          config: newConfig,
        });
      } else if (appState.autoCreateEnabled && appState.frameCount === 2) {
        sendMessage({ type: "auto-create-connection", config: newConfig });
      }
    },
    [
      appState.config,
      appState.autoCreateEnabled,
      appState.frameCount,
      appState.isEditingConnection,
      appState.selectedConnectionId,
      debouncedSave,
      sendMessage,
    ]
  );

  const updateAppState = useCallback(
    (updates: Partial<AppState>) => {
      setAppState((prev) => ({ ...prev, ...updates }));

      // Send auto-create/auto-update settings to backend
      if ("autoCreateEnabled" in updates) {
        console.log("Sending auto-create setting:", updates.autoCreateEnabled);
        sendMessage({
          type: "toggle-auto-create",
          enabled: updates.autoCreateEnabled,
        });
      }
      if ("autoUpdateEnabled" in updates) {
        console.log("Sending auto-update setting:", updates.autoUpdateEnabled);
        sendMessage({
          type: "toggle-auto-update",
          enabled: updates.autoUpdateEnabled,
        });
      }
    },
    [sendMessage]
  );

  const handleLabelEditRequest = useCallback(() => {
    openSidebar("properties");
    updateAppState({ activeTab: "label" });
    requestAnimationFrame(() => {
      const input = labelInputRef.current;
      if (input) {
        input.focus({ preventScroll: true });
        input.select();
      }
    });
  }, [openSidebar, updateAppState]);

  // Handle menu commands
  useEffect(() => {
    if (!pendingCommand) return;

    switch (pendingCommand) {
      case "draw-connection":
        // Open UI in default draw mode
        openSidebar("properties");
        updateAppState({ activeTab: "arrow" });
        break;

      case "update-connection":
        // Open UI - if connection is selected, it will auto-load
        openSidebar("properties");
        updateAppState({ activeTab: "arrow" });
        break;

      case "update-connection-label":
        // Open UI focused on label editing
        handleLabelEditRequest();
        break;

      case "about-project":
        // Show about dialog or info
        setAppState((prev) => ({
          ...prev,
          status: {
            type: "info",
            message:
              "Flow Connector - An open source Figma plugin for creating configurable connections between frames",
          },
        }));
        openSidebar("settings");
        break;

      case "about-author":
        // Open external URL
        window.open("https://oss-design-tools.adventureland.io", "_blank");
        break;

      default:
        break;
    }

    // Clear pending command
    setPendingCommand(null);
  }, [pendingCommand, openSidebar, updateAppState, handleLabelEditRequest]);

  const handleArrowEditRequest = useCallback(() => {
    openSidebar("properties");
    updateAppState({ activeTab: "arrow" });
  }, [openSidebar, updateAppState]);

  const reverseConnection = useCallback(() => {
    if (
      appState.connectedFrames.length === 2 &&
      appState.selectedConnectionId
    ) {
      // Swap the connected frames in state
      const reversedFrames = [
        appState.connectedFrames[1],
        appState.connectedFrames[0],
      ];

      // Swap start and end positions in config
      const newConfig = {
        ...appState.config,
        startPosition: appState.config.endPosition,
        endPosition: appState.config.startPosition,
      };

      // Update app state
      setAppState((prev) => ({
        ...prev,
        connectedFrames: reversedFrames,
        config: newConfig,
      }));

      // Use the existing update mechanism with reversed frames
      // Save config
      debouncedSave(newConfig, sendMessage);

      // Send reverse-connection message with reversed config
      sendMessage({
        type: "reverse-connection",
        connectionId: appState.selectedConnectionId,
        config: newConfig,
      });
    }
  }, [
    appState.connectedFrames,
    appState.selectedConnectionId,
    appState.config,
    sendMessage,
    debouncedSave,
  ]);

  const createConnection = useCallback(() => {
    sendMessage({ type: "create-connection", config: appState.config });
  }, [sendMessage, appState.config]);

  const cancelConnection = useCallback(() => {
    setAppState((prev) => ({
      ...prev,
      selectedConnectionId: null,
      selectedConnectionName: null,
      connectedFrames: [],
      isEditingConnection: false,
      status: {
        type: "info",
        message: "Select 2 frames with Shift+Click to create a connection",
      },
    }));
    sendMessage({ type: "cancel-connection" });
  }, [sendMessage]);

  const clearCache = useCallback(() => {
    sendMessage({ type: "clear-cache" });
  }, [sendMessage]);

  // Bulk mode helper functions
  const updateConnectionStrategy = useCallback((strategy: ConnectionStrategy) => {
    setAppState((prev) => ({
      ...prev,
      connectionStrategy: strategy,
    }));
    
    sendMessage({
      type: "update-connection-strategy",
      connectionStrategy: strategy,
    });
  }, [sendMessage]);

  const createBulkConnections = useCallback(() => {
    if (appState.selectedFrames.length > 1) {
      setCurrentBulkOperationType('create');
      setAppState((prev) => ({
        ...prev,
        bulkOperationInProgress: true,
        status: {
          type: "info",
          message: "Creating bulk connections...",
        },
      }));

      sendMessage({
        type: "create-bulk-connections",
        config: appState.config,
        selectedFrames: appState.selectedFrames,
        connectionStrategy: appState.connectionStrategy,
      });
    }
  }, [sendMessage, appState.config, appState.selectedFrames, appState.connectionStrategy]);

  const updateBulkConnections = useCallback((updates: Partial<ConnectionConfig>) => {
    if (appState.bulkSelectedConnections.length > 0) {
      const newConfig = { ...appState.config, ...updates };
      
      setCurrentBulkOperationType('update');
      setAppState((prev) => ({
        ...prev,
        config: newConfig,
        bulkOperationInProgress: true,
        status: {
          type: "info",
          message: `Updating ${prev.bulkSelectedConnections.length} connections...`,
        },
      }));

      sendMessage({
        type: "update-bulk-connections",
        config: newConfig,
        connectionIds: appState.bulkSelectedConnections,
      } as Partial<FigmaMessage>);
    }
  }, [sendMessage, appState.config, appState.bulkSelectedConnections]);

  // Handle individual bulk property updates (Requirements: 4.1, 4.2, 4.3, 4.4, 4.5)
  const handleBulkPropertyUpdate = useCallback(async (property: keyof ConnectionConfig, value: any) => {
    if (appState.bulkSelectedConnections.length === 0) {
      console.warn('No connections selected for bulk update');
      return;
    }

    try {
      // Update the local config first for immediate UI feedback
      const updates = { [property]: value } as Partial<ConnectionConfig>;
      const newConfig = { ...appState.config, ...updates };
      
      setAppState((prev) => ({
        ...prev,
        config: newConfig,
        bulkOperationInProgress: true,
        status: {
          type: "info",
          message: `Updating ${property} for ${prev.bulkSelectedConnections.length} connections...`,
        },
      }));

      // Clear mixed state for this property since we're applying a uniform value
      setAppState((prev) => ({
        ...prev,
        mixedPropertyStates: new Map(
          Array.from(prev.mixedPropertyStates.entries()).filter(([key]) => key !== property)
        ),
      }));

      setCurrentBulkOperationType('update');
      
      // Send the update to the plugin
      sendMessage({
        type: "update-bulk-connections",
        config: newConfig,
        connectionIds: appState.bulkSelectedConnections,
      } as Partial<FigmaMessage>);

    } catch (error) {
      console.error('Failed to update bulk property:', error);
      setAppState((prev) => ({
        ...prev,
        bulkOperationInProgress: false,
        status: {
          type: "error",
          message: `Failed to update ${property}: ${error instanceof Error ? error.message : 'Unknown error'}`,
        },
      }));
    }
  }, [sendMessage, appState.config, appState.bulkSelectedConnections]);

  // Handle multiple bulk property updates (Requirements: 4.1, 4.2, 4.3, 4.4)
  const handleBulkMultiplePropertyUpdate = useCallback(async (updates: Partial<ConnectionConfig>) => {
    if (appState.bulkSelectedConnections.length === 0) {
      console.warn('No connections selected for bulk update');
      return;
    }

    try {
      const newConfig = { ...appState.config, ...updates };
      
      setAppState((prev) => ({
        ...prev,
        config: newConfig,
        bulkOperationInProgress: true,
        status: {
          type: "info",
          message: `Updating ${Object.keys(updates).length} properties for ${prev.bulkSelectedConnections.length} connections...`,
        },
      }));

      // Clear mixed states for updated properties
      const updatedProperties = Object.keys(updates) as Array<keyof ConnectionConfig>;
      setAppState((prev) => ({
        ...prev,
        mixedPropertyStates: new Map(
          Array.from(prev.mixedPropertyStates.entries()).filter(([key]) => !updatedProperties.includes(key))
        ),
      }));

      setCurrentBulkOperationType('update');
      
      // Send the update to the plugin
      sendMessage({
        type: "update-bulk-connections",
        config: newConfig,
        connectionIds: appState.bulkSelectedConnections,
      } as Partial<FigmaMessage>);

    } catch (error) {
      console.error('Failed to update bulk properties:', error);
      setAppState((prev) => ({
        ...prev,
        bulkOperationInProgress: false,
        status: {
          type: "error",
          message: `Failed to update properties: ${error instanceof Error ? error.message : 'Unknown error'}`,
        },
      }));
    }
  }, [sendMessage, appState.config, appState.bulkSelectedConnections]);

  const exitBulkMode = useCallback(() => {
    setAppState((prev) => ({
      ...prev,
      selectedFrames: [],
      isBulkMode: false,
      bulkSelectedConnections: [],
      frameLayout: undefined,
      connectionStrategy: defaultConnectionStrategy,
      bulkEditableProperties: new Set(),
      mixedPropertyStates: new Map(),
      status: {
        type: "info",
        message: "Select 2 frames with Shift+Click to create a connection",
      },
    }));

    sendMessage({ type: "exit-bulk-mode" });
  }, [sendMessage]);

  // Progress tracking and retry functionality
  const retryBulkOperation = useCallback((operationId: string) => {
    setAppState((prev) => ({
      ...prev,
      bulkOperationInProgress: true,
      status: {
        type: "info",
        message: "Retrying bulk operation...",
      },
    }));

    sendMessage({
      type: "retry-bulk-operation",
      operationId,
    });
  }, [sendMessage]);

  const cancelBulkOperation = useCallback(() => {
    setAppState((prev) => ({
      ...prev,
      bulkOperationInProgress: false,
      status: {
        type: "info",
        message: "Bulk operation cancelled",
      },
    }));

    sendMessage({ type: "cancel-bulk-operation" });
  }, [sendMessage]);

  // Request layout analysis for selected frames
  const requestLayoutAnalysis = useCallback(() => {
    if (appState.selectedFrames.length > 1) {
      sendMessage({
        type: "analyze-frame-layout",
        selectedFrames: appState.selectedFrames,
      });
    }
  }, [sendMessage, appState.selectedFrames]);

  // Handle bulk operation result retry (Requirements: 3.5, 5.4, 5.5)
  const handleBulkOperationRetry = useCallback((failedItems: Array<{ frameIds?: string[]; connectionId?: string; error: string }>) => {
    if (!bulkOperationResult) return;

    const operationType = bulkOperationResult.operationType;
    
    if (operationType === 'create' && failedItems.some(item => item.frameIds)) {
      // Retry failed connection creations
      const failedFrameIds = failedItems
        .filter(item => item.frameIds)
        .flatMap(item => item.frameIds || []);
      
      if (failedFrameIds.length > 0) {
        setCurrentBulkOperationType('create');
        setAppState((prev) => ({
          ...prev,
          bulkOperationInProgress: true,
          status: {
            type: "info",
            message: "Retrying failed connections...",
          },
        }));

        sendMessage({
          type: "create-bulk-connections",
          config: appState.config,
          selectedFrames: failedFrameIds.map(id => ({ id, name: `Frame ${id}` })),
          connectionStrategy: appState.connectionStrategy,
        });
      }
    } else if (operationType === 'update' && failedItems.some(item => item.connectionId)) {
      // Retry failed connection updates
      const failedConnectionIds = failedItems
        .filter(item => item.connectionId)
        .map(item => item.connectionId!);
      
      if (failedConnectionIds.length > 0) {
        setCurrentBulkOperationType('update');
        setAppState((prev) => ({
          ...prev,
          bulkOperationInProgress: true,
          status: {
            type: "info",
            message: "Retrying failed updates...",
          },
        }));

        sendMessage({
          type: "update-bulk-connections",
          config: appState.config,
          connectionIds: failedConnectionIds,
        } as Partial<FigmaMessage>);
      }
    }

    // Close the result dialog
    setBulkOperationResult(null);
  }, [bulkOperationResult, appState.config, appState.connectionStrategy, sendMessage]);

  // Handle bulk operation result close
  const handleBulkOperationResultClose = useCallback(() => {
    setBulkOperationResult(null);
    setCurrentBulkOperationType(null);
  }, []);

  // Progress tracking handlers (Requirements: 5.1, 5.2, 5.3)
  const handleCancelOperation = useCallback((operationId: string) => {
    sendMessage({
      type: "cancel-bulk-operation",
      operationId,
    });
  }, [sendMessage]);

  const handleRetryOperation = useCallback((operationId: string) => {
    sendMessage({
      type: "retry-bulk-operation",
      operationId,
    });
  }, [sendMessage]);

  const handleDismissOperation = useCallback((operationId: string) => {
    // Remove operation from active operations list
    setActiveOperations((prev) => 
      prev.filter(op => op.operationId !== operationId)
    );
  }, []);

  return (
    <>
      <MainContainer
        appState={appState}
        updateConfig={updateConfig}
        updateAppState={updateAppState}
        createConnection={createConnection}
        cancelConnection={cancelConnection}
        clearCache={clearCache}
        isSidebarOpen={isSidebarOpen}
        onSidebarOpenChange={setSidebarOpen}
        sidebarTab={sidebarTab}
        onSidebarTabChange={setSidebarTab}
        onRequestSidebar={openSidebar}
        onRequestLabelEdit={handleLabelEditRequest}
        onRequestArrowEdit={handleArrowEditRequest}
        onReverseConnection={reverseConnection}
        labelInputRef={labelInputRef}
        // Bulk operation props
        updateConnectionStrategy={updateConnectionStrategy}
        createBulkConnections={createBulkConnections}
        updateBulkConnections={updateBulkConnections}
        exitBulkMode={exitBulkMode}
        retryBulkOperation={retryBulkOperation}
        cancelBulkOperation={cancelBulkOperation}
        requestLayoutAnalysis={requestLayoutAnalysis}
        onBulkPropertyUpdate={handleBulkPropertyUpdate}
        onBulkMultiplePropertyUpdate={handleBulkMultiplePropertyUpdate}
        // Progress tracking props
        activeOperations={activeOperations}
        onCancelOperation={handleCancelOperation}
        onRetryOperation={handleRetryOperation}
        onDismissOperation={handleDismissOperation}
      />
      
      {/* Bulk Operation Result Dialog (Requirements: 3.5, 5.4, 5.5) */}
      {bulkOperationResult && (
        <BulkOperationResultComponent
          result={bulkOperationResult.result}
          operationType={bulkOperationResult.operationType}
          onRetry={handleBulkOperationRetry}
          onClose={handleBulkOperationResultClose}
          canRetry={true}
        />
      )}
    </>
  );
}

export default App;
