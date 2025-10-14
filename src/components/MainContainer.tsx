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
import { Menu, Settings, X, Hash } from "lucide-react";
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
  onRequestArrowEdit: () => void;
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
  onRequestArrowEdit,
  labelInputRef,
}) => {
  return (
    <div className="flex h-screen flex-col bg-gray-50">
      <header
        className={`flex items-center justify-between border-b px-6 py-3 shadow-sm transition-colors ${
          appState.isEditingConnection
            ? "border-orange-200 bg-orange-50"
            : "border-blue-200 bg-blue-50"
        }`}
      >
        <div>
          {appState.isEditingConnection ? (
            <>
              <h1 className="text-sm font-semibold text-orange-900">
                Editing Connection
              </h1>
              <p className="text-xs text-orange-700">
                @{appState.selectedConnectionName || "Flow Connection"}:
                {appState.connectedFrames.length === 2 && (
                  <>
                    {" "}
                    <span className="font-medium flex items-center gap-1">
                      <Hash className="h-3 w-3" />
                      {appState.connectedFrames[0].name}
                    </span>
                    {" → "}
                    <span className="font-medium flex items-center gap-1">
                      <Hash className="h-3 w-3" />
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
                Select 2 frames with{" "}
                <kbd className="px-1.5 py-0.5 bg-blue-100 rounded text-[10px] font-mono border border-blue-300">
                  Shift+Click
                </kbd>{" "}
                to create a connection
              </p>
            </>
          )}
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
          frameCount={appState.frameCount}
          isEditingConnection={appState.isEditingConnection}
          updateConfig={updateConfig}
          onRequestSidebar={onRequestSidebar}
          onRequestLabelEdit={onRequestLabelEdit}
          onRequestArrowEdit={onRequestArrowEdit}
        />
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
