import React from "react";
import { AppState, ConnectionConfig } from "../types";
import ArrowTab from "./tabs/ArrowTab";
import LabelTab from "./tabs/LabelTab";
import { SheetBody, SheetFooter } from "./ui/sheet";
import { Button } from "./ui/button";

interface PropertiesPanelProps {
  appState: AppState;
  updateConfig: (updates: Partial<ConnectionConfig>) => void;
  updateAppState: (updates: Partial<AppState>) => void;
  createConnection: () => void;
  cancelConnection: () => void;
  labelInputRef?: React.RefObject<HTMLInputElement | null>;
}

export const PropertiesPanel: React.FC<PropertiesPanelProps> = ({
  appState,
  updateConfig,
  updateAppState,
  createConnection,
  cancelConnection,
  labelInputRef,
}) => {
  return (
    <>
      <SheetBody className="space-y-6">
        <div>
          <div className="flex rounded-lg bg-gray-100 p-1 text-[11px] font-semibold uppercase tracking-wide">
            <button
              className={`flex-1 rounded-md px-3 py-2 transition-colors ${
                appState.activeTab === "arrow"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
              }`}
              onClick={() => updateAppState({ activeTab: "arrow" })}
            >
              Connector
            </button>
            <button
              className={`flex-1 rounded-md px-3 py-2 transition-colors ${
                appState.activeTab === "label"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
              }`}
              onClick={() => updateAppState({ activeTab: "label" })}
            >
              Label
            </button>
          </div>
        </div>

        <div className="space-y-6">
          {appState.activeTab === "arrow" ? (
            <ArrowTab config={appState.config} updateConfig={updateConfig} />
          ) : (
            <LabelTab
              config={appState.config}
              updateConfig={updateConfig}
              inputRef={labelInputRef}
            />
          )}
        </div>
      </SheetBody>

      <SheetFooter className="gap-3 sticky bottom-0 bg-white">
        <Button variant="outline" className="flex-1" onClick={cancelConnection}>
          {appState.isEditingConnection ? "Done" : "Cancel"}
        </Button>
        <Button
          className="flex-1"
          onClick={createConnection}
          disabled={!appState.isEditingConnection && appState.frameCount !== 2}
        >
          {appState.isEditingConnection
            ? "Update Connection"
            : "Create Connection"}
        </Button>
      </SheetFooter>
    </>
  );
};

export default PropertiesPanel;
