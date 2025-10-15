import React from "react";
import { AppState, ConnectionConfig } from "../types";
import ArrowTab from "./tabs/ArrowTab";
import LabelTab from "./tabs/LabelTab";
import BulkArrowTab from "./tabs/BulkArrowTab";
import BulkLabelTab from "./tabs/BulkLabelTab";
import BulkPropertyManager from "./BulkPropertyManager";
import { SheetBody, SheetFooter } from "./ui/sheet";
import { Button } from "./ui/button";

interface PropertiesPanelProps {
  appState: AppState;
  updateConfig: (updates: Partial<ConnectionConfig>) => void;
  updateAppState: (updates: Partial<AppState>) => void;
  createConnection: () => void;
  cancelConnection: () => void;
  labelInputRef?: React.RefObject<HTMLInputElement | null>;
  onBulkPropertyUpdate?: (property: keyof ConnectionConfig, value: any) => Promise<void>;
}

export const PropertiesPanel: React.FC<PropertiesPanelProps> = ({
  appState,
  updateConfig,
  updateAppState,
  createConnection,
  cancelConnection,
  labelInputRef,
  onBulkPropertyUpdate,
}) => {
  // Determine if we're in bulk editing mode
  const isBulkMode = appState.isBulkMode && appState.bulkSelectedConnections.length > 0;
  const affectedConnectionCount = appState.bulkSelectedConnections.length;
  return (
    <>
      <SheetBody className="space-y-6">
        <div>
          <div className="flex rounded-lg bg-gray-100 p-1 text-[11px] font-semibold uppercase tracking-wide text-gray-500">
            <button
              className={`flex-1 rounded-md px-3 py-2 transition-colors ${
                appState.activeTab === "arrow"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "hover:text-gray-700"
              }`}
              onClick={() => updateAppState({ activeTab: "arrow" })}
            >
              Arrow
            </button>
            <button
              className={`flex-1 rounded-md px-3 py-2 transition-colors ${
                appState.activeTab === "label"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "hover:text-gray-700"
              }`}
              onClick={() => updateAppState({ activeTab: "label" })}
            >
              Label
            </button>
          </div>
        </div>

        {/* Bulk mode indicator */}
        {isBulkMode && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
            <div className="flex items-center gap-2 text-sm text-blue-700">
              <svg className="w-4 h-4" viewBox="0 0 16 16" fill="currentColor">
                <path d="M2 3a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V3zm1 0v10h10V3H3z"/>
                <path d="M5 5h6v1H5V5zm0 2h6v1H5V7zm0 2h4v1H5V9z"/>
              </svg>
              <span className="font-medium">Bulk Editing Mode</span>
            </div>
            <p className="text-xs text-blue-600 mt-1">
              Editing {affectedConnectionCount} connection{affectedConnectionCount !== 1 ? 's' : ''}
            </p>
          </div>
        )}

        <div className="space-y-6">
          {appState.activeTab === "arrow" ? (
            isBulkMode ? (
              <BulkPropertyManager
                onBulkUpdate={onBulkPropertyUpdate || (async () => {})}
                onBulkUpdateMultiple={async (updates) => {
                  // Apply multiple property updates sequentially
                  for (const [property, value] of Object.entries(updates)) {
                    if (onBulkPropertyUpdate) {
                      await onBulkPropertyUpdate(property as keyof ConnectionConfig, value);
                    }
                  }
                }}
              >
                {({ validationErrors, isValidating, applyToAll }) => (
                  <BulkArrowTab
                    config={appState.config}
                    updateConfig={updateConfig}
                    mixedPropertyStates={appState.mixedPropertyStates}
                    onApplyToAll={applyToAll}
                    validationErrors={validationErrors}
                    isValidating={isValidating}
                  />
                )}
              </BulkPropertyManager>
            ) : (
              <ArrowTab config={appState.config} updateConfig={updateConfig} />
            )
          ) : (
            isBulkMode ? (
              <BulkPropertyManager
                onBulkUpdate={onBulkPropertyUpdate || (async () => {})}
                onBulkUpdateMultiple={async (updates) => {
                  // Apply multiple property updates sequentially
                  for (const [property, value] of Object.entries(updates)) {
                    if (onBulkPropertyUpdate) {
                      await onBulkPropertyUpdate(property as keyof ConnectionConfig, value);
                    }
                  }
                }}
              >
                {({ validationErrors, isValidating, applyToAll }) => (
                  <BulkLabelTab
                    config={appState.config}
                    updateConfig={updateConfig}
                    mixedPropertyStates={appState.mixedPropertyStates}
                    onApplyToAll={applyToAll}
                    inputRef={labelInputRef}
                    validationErrors={validationErrors}
                    isValidating={isValidating}
                  />
                )}
              </BulkPropertyManager>
            ) : (
              <LabelTab
                config={appState.config}
                updateConfig={updateConfig}
                inputRef={labelInputRef}
              />
            )
          )}
        </div>
      </SheetBody>

      <SheetFooter className="gap-3 sticky bottom-0 bg-white">
        <Button variant="outline" className="flex-1" onClick={cancelConnection}>
          {appState.isEditingConnection || isBulkMode ? "Done" : "Cancel"}
        </Button>
        {isBulkMode ? (
          <Button
            className="flex-1"
            onClick={createConnection}
            disabled={appState.bulkOperationInProgress}
          >
            {appState.bulkOperationInProgress 
              ? "Updating..." 
              : `Update ${affectedConnectionCount} Connection${affectedConnectionCount !== 1 ? 's' : ''}`
            }
          </Button>
        ) : (
          <Button
            className="flex-1"
            onClick={createConnection}
            disabled={!appState.isEditingConnection && appState.frameCount !== 2}
          >
            {appState.isEditingConnection
              ? "Update Connection"
              : "Create Connection"}
          </Button>
        )}
      </SheetFooter>
    </>
  );
};

export default PropertiesPanel;
