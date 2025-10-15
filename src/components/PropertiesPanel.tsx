import React from "react";
import { AppState, ConnectionConfig } from "../types";
import ArrowTab from "./tabs/ArrowTab";
import LabelTab from "./tabs/LabelTab";
import { SheetBody, SheetFooter } from "./ui/sheet";
import { Button } from "./ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "./ui/tabs";

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
        <Tabs
          value={appState.activeTab}
          onValueChange={(value) => updateAppState({ activeTab: value as "arrow" | "label" })}
        >
          <TabsList className="grid w-full grid-cols-2 text-[9px] font-semibold uppercase tracking-wide bg-transparent">
            <TabsTrigger
              value="arrow"
              className="bg-gray-50 data-[state=active]:bg-gray-100 data-[state=active]:text-gray-900"
            >
              Connector
            </TabsTrigger>
            <TabsTrigger
              value="label"
              className="bg-gray-50 data-[state=active]:bg-gray-100 data-[state=active]:text-gray-900"
            >
              Label
            </TabsTrigger>
          </TabsList>

          <TabsContent value="arrow" className="space-y-6">
            <ArrowTab config={appState.config} updateConfig={updateConfig} />
          </TabsContent>

          <TabsContent value="label" className="space-y-6">
            <LabelTab
              config={appState.config}
              updateConfig={updateConfig}
              inputRef={labelInputRef}
            />
          </TabsContent>
        </Tabs>
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
