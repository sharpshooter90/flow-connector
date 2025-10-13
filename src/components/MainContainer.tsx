import React from "react";
import { AppState, ConnectionConfig } from "../types";
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
import { Menu, Settings, X } from "lucide-react";
import PropertiesPanel from "./PropertiesPanel";
import SettingsPanel from "./SettingsPanel";

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
  labelInputRef?: React.RefObject<HTMLInputElement>;
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
  labelInputRef,
}) => {
  return (
    <div className="flex h-screen flex-col bg-gray-50">
      <header className="flex items-center justify-between border-b border-gray-200 bg-white px-6 py-3 shadow-sm">
        <div>
          <h1 className="text-sm font-semibold text-gray-900">
            Flow Connector
          </h1>
          <p className="text-xs text-gray-500">
            Preview updates as you fine-tune the connection.
          </p>
        </div>
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
          onRequestSidebar={onRequestSidebar}
          onRequestLabelEdit={onRequestLabelEdit}
        />
      </main>

      <Sheet
        open={isSidebarOpen}
        onOpenChange={onSidebarOpenChange}
        modal={false}
      >
        <SheetContent side="right" className="w-full max-w-xs">
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
