import React from "react";
import { AppState, ConnectionConfig, ConnectionStrategy, OperationProgress } from "../types";
import PreviewFlow from "./PreviewFlow";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "./ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Button } from "./ui/button";
import { Menu, Settings, X, Hash, ArrowLeftRight, Users, AlertTriangle, Zap } from "lucide-react";
import PropertiesPanel from "./PropertiesPanel";
import SettingsPanel from "./SettingsPanel";
import BulkActionControls from "./BulkActionControls";
import ProgressIndicator from "./ui/ProgressIndicator";

interface MainContainerProps {
  appState: AppState;
  updateConfig: (updates: Partial<ConnectionConfig>) => void;
  updateAppState: (updates: Partial<AppState>) => void;
  createConnection: () => void;
  cancelConnection: () => void;
  clearCache: () => void;
  isSidebarOpen: boolean;
  onSidebarOpenChange: (open: boolean) => void;
  sidebarTab: "properties" | "settings";
  onSidebarTabChange: (tab: "properties" | "settings") => void;
  onRequestSidebar: (target: "properties" | "settings") => void;
  onRequestLabelEdit: () => void;
  onRequestArrowEdit: () => void;
  onReverseConnection: () => void;
  labelInputRef?: React.RefObject<HTMLInputElement | null>;
  // Bulk operation functions
  updateConnectionStrategy?: (strategy: ConnectionStrategy) => void;
  createBulkConnections?: () => void;
  updateBulkConnections?: (updates: Partial<ConnectionConfig>) => void;
  exitBulkMode?: () => void;
  retryBulkOperation?: (operationId: string) => void;
  cancelBulkOperation?: () => void;
  requestLayoutAnalysis?: () => void;
  onBulkPropertyUpdate?: (property: keyof ConnectionConfig, value: any) => Promise<void>;
  onBulkMultiplePropertyUpdate?: (updates: Partial<ConnectionConfig>) => Promise<void>;
  // Progress tracking functions
  activeOperations?: OperationProgress[];
  onCancelOperation?: (operationId: string) => void;
  onRetryOperation?: (operationId: string) => void;
  onDismissOperation?: (operationId: string) => void;
}

const MainContainer: React.FC<MainContainerProps> = ({
  appState,
  updateConfig,
  updateAppState,
  createConnection,
  cancelConnection,
  clearCache,
  isSidebarOpen,
  onSidebarOpenChange,
  sidebarTab,
  onSidebarTabChange,
  onRequestSidebar,
  onRequestLabelEdit,
  onRequestArrowEdit,
  onReverseConnection,
  labelInputRef,
  // Bulk operation props
  updateConnectionStrategy,
  createBulkConnections,
  updateBulkConnections,
  exitBulkMode,
  retryBulkOperation,
  cancelBulkOperation,
  // requestLayoutAnalysis, // Currently unused but available for future use
  onBulkPropertyUpdate,
  onBulkMultiplePropertyUpdate,
  // Progress tracking props
  activeOperations = [],
  onCancelOperation,
  onRetryOperation,
  onDismissOperation,
}) => {
  return (
    <div className="flex h-screen flex-col bg-gray-50">
      <header
        className={`flex items-center justify-between border-b px-6 py-3 shadow-sm transition-colors ${
          appState.isBulkMode
            ? "border-purple-200 bg-purple-50"
            : appState.isEditingConnection
            ? "border-orange-200 bg-orange-50"
            : "border-blue-200 bg-blue-50"
        }`}
      >
        <div className="flex-1">
          {appState.isBulkMode ? (
            <>
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-purple-700" />
                <h1 className="text-sm font-semibold text-purple-900">
                  Bulk Mode - {appState.selectedFrames.length} frames selected
                </h1>
                {appState.bulkOperationInProgress && (
                  <div className="flex items-center gap-1">
                    <Zap className="h-3 w-3 text-purple-600 animate-pulse" />
                    <span className="text-xs text-purple-600">Processing...</span>
                  </div>
                )}
              </div>
              
              {/* Layout warning for scattered frames */}
              {appState.frameLayout && appState.frameLayout.pattern.type === 'scattered' && (
                <div className="flex items-center gap-1.5 mt-1">
                  <AlertTriangle className="h-3 w-3 text-amber-600" />
                  <p className="text-xs text-amber-700">
                    Selected frames appear scattered. Connection order may not be predictable.
                  </p>
                </div>
              )}
              
              {/* Layout suggestions */}
              {appState.frameLayout && appState.frameLayout.suggestions.length > 0 && (
                <p className="text-xs text-purple-600 mt-1">
                  Suggestion: {appState.frameLayout.suggestions[0]}
                </p>
              )}
              
              {/* Frame names preview */}
              <div className="flex items-center gap-1 mt-1 text-xs text-purple-700">
                <span>Frames:</span>
                {appState.selectedFrames.slice(0, 3).map((frame, index) => (
                  <span key={frame.id} className="font-medium">
                    {frame.name}
                    {index < Math.min(2, appState.selectedFrames.length - 1) && ", "}
                  </span>
                ))}
                {appState.selectedFrames.length > 3 && (
                  <span className="text-purple-600">
                    +{appState.selectedFrames.length - 3} more
                  </span>
                )}
              </div>
            </>
          ) : appState.isEditingConnection ? (
            <>
              <h1 className="text-sm font-semibold text-orange-900">
                Editing Flow connection
              </h1>

              <p className="text-xs text-orange-700 flex items-center gap-1.5">
                Frames:
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onReverseConnection}
                  aria-label="Reverse connection"
                  className="h-4 w-4 p-0"
                >
                  <ArrowLeftRight className="h-3.5 w-3.5" />
                </Button>
                {appState.connectedFrames.length === 2 && (
                  <>
                    <Hash className="h-3 w-3" />
                    <span className="font-medium">A</span>
                    <span className="font-medium">
                      {appState.connectedFrames[0].name}
                    </span>
                    {" → "}
                    <Hash className="h-3 w-3" />
                    <span className="font-medium">B</span>
                    <span className="font-medium">
                      {appState.connectedFrames[1].name}
                    </span>
                  </>
                )}
              </p>
            </>
          ) : (
            <>
              <h1 className="text-sm font-semibold text-blue-900">
                Flow Connector
              </h1>
              <p className="text-xs text-blue-700">
                Select frames to create connections or edit existing ones
              </p>
            </>
          )}
        </div>
        
        {/* Bulk Action Controls */}
        {appState.isBulkMode && (
          <div className="flex items-center gap-2 mr-4">
            <BulkActionControls
              appState={appState}
              updateConnectionStrategy={updateConnectionStrategy}
              createBulkConnections={createBulkConnections}
              exitBulkMode={exitBulkMode}
              cancelBulkOperation={cancelBulkOperation}
              retryBulkOperation={retryBulkOperation}
            />
          </div>
        )}
        <div className="flex items-center gap-2">

          <Button
            variant="outline"
            size="icon"
            onClick={() => onRequestSidebar("settings")}
            aria-label="Open settings"
          >
            <Settings className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => onRequestSidebar("properties")}
            aria-label="Open properties"
          >
            <Menu className="h-4 w-4" />
          </Button>
        </div>
      </header>

      <main className="relative flex flex-1 overflow-hidden">
        <PreviewFlow
          config={appState.config}
          frameCount={appState.frameCount}
          isEditingConnection={appState.isEditingConnection}
          updateConfig={updateConfig}
          onRequestSidebar={onRequestSidebar}
          onRequestLabelEdit={onRequestLabelEdit}
          onRequestArrowEdit={onRequestArrowEdit}
        />
        
        {/* Progress Indicators Overlay */}
        {activeOperations.length > 0 && (
          <div className="absolute bottom-4 right-4 space-y-2 z-40 max-w-sm">
            {activeOperations.map((operation) => (
              <ProgressIndicator
                key={operation.operationId}
                progress={operation}
                onCancel={onCancelOperation ? () => onCancelOperation(operation.operationId) : undefined}
                onRetry={onRetryOperation ? () => onRetryOperation(operation.operationId) : undefined}
                onDismiss={onDismissOperation ? () => onDismissOperation(operation.operationId) : undefined}
                className="shadow-lg"
              />
            ))}
          </div>
        )}
      </main>

      <Sheet
        open={isSidebarOpen}
        onOpenChange={onSidebarOpenChange}
        modal={false}
      >
        <SheetContent
          side="right"
          className="w-full max-w-xs border-l border-gray-200"
        >
          <Tabs
            value={sidebarTab}
            onValueChange={(value) =>
              onSidebarTabChange(value as "properties" | "settings")
            }
            className="flex h-full flex-col"
          >
            <SheetHeader className="flex justify-between border-b border-gray-200">
              <SheetTitle>Inspector</SheetTitle>
              <div className="flex items-center gap-3">
                <TabsList>
                  <TabsTrigger value="properties">Properties</TabsTrigger>
                  <TabsTrigger value="settings">Settings</TabsTrigger>
                </TabsList>
                <SheetClose asChild>
                  <Button variant="ghost" size="icon" aria-label="Close panel">
                    <X className="h-4 w-4" />
                  </Button>
                </SheetClose>
              </div>
            </SheetHeader>

            <TabsContent value="properties" className="flex h-full flex-col">
              <PropertiesPanel
                appState={appState}
                updateConfig={updateConfig}
                updateAppState={updateAppState}
                createConnection={createConnection}
                cancelConnection={cancelConnection}
                labelInputRef={labelInputRef}
                onBulkPropertyUpdate={onBulkPropertyUpdate}
              />
            </TabsContent>

            <TabsContent value="settings" className="flex h-full flex-col">
              <SettingsPanel
                appState={appState}
                updateAppState={updateAppState}
                clearCache={clearCache}
              />
            </TabsContent>
          </Tabs>
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default MainContainer;
