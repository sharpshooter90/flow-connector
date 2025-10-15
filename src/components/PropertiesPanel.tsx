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
  activeTab: "arrow" | "label";
}

export const PropertiesPanel: React.FC<PropertiesPanelProps> = ({
  appState,
  updateConfig,
  updateAppState,
  createConnection,
  cancelConnection,
  labelInputRef,
  activeTab,
}) => {
  return (
    <>
      <SheetBody className="space-y-6 flex-1 px-4 py-3">
        {activeTab === "arrow" ? (
          <ArrowTab config={appState.config} updateConfig={updateConfig} />
        ) : (
          <LabelTab
            config={appState.config}
            updateConfig={updateConfig}
            inputRef={labelInputRef}
          />
        )}
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
