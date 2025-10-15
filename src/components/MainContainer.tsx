import React from "react";
import { AppState, ConnectionConfig } from "../types";
import PreviewFlow from "./PreviewFlow";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "./ui/sheet";
import { Button } from "./ui/button";
import { Hash, ArrowLeftRight, Settings, PanelRight } from "lucide-react";
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
  onRequestSidebar: (target: "properties" | "settings") => void;
  onRequestLabelEdit: () => void;
  onRequestArrowEdit: () => void;
  onReverseConnection: () => void;
  labelInputRef?: React.RefObject<HTMLInputElement | null>;
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
  onRequestSidebar,
  onRequestLabelEdit,
  onRequestArrowEdit,
  onReverseConnection,
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
            onClick={() => {
              if (isSidebarOpen) {
                onSidebarOpenChange(false);
              } else {
                onRequestSidebar("properties");
              }
            }}
            aria-label={isSidebarOpen ? "Close sidebar" : "Open properties"}
          >
            <PanelRight className="h-4 w-4" />
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
          <div className="flex h-full flex-col">
            <SheetHeader className="flex flex-row items-center justify-between border-b border-gray-200 pb-3">
              <SheetTitle>{sidebarTab === "properties" ? "Properties" : "Settings"}</SheetTitle>
              <div className="flex items-center gap-2">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => onRequestSidebar(sidebarTab === "settings" ? "properties" : "settings")}
                  aria-label={sidebarTab === "settings" ? "Back to properties" : "Open settings"}
                  className="h-8 w-8"
                >
                  <Settings className="h-4 w-4" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => onSidebarOpenChange(false)}
                  aria-label="Collapse panel" 
                  className="h-8 w-8"
                >
                  <PanelRight className="h-4 w-4" />
                </Button>
              </div>
            </SheetHeader>

            {sidebarTab === "properties" ? (
              <PropertiesPanel
                appState={appState}
                updateConfig={updateConfig}
                updateAppState={updateAppState}
                createConnection={createConnection}
                cancelConnection={cancelConnection}
                labelInputRef={labelInputRef}
              />
            ) : (
              <SettingsPanel
                appState={appState}
                updateAppState={updateAppState}
                clearCache={clearCache}
              />
            )}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default MainContainer;
